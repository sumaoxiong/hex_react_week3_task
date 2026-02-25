import { useEffect, useRef, useState } from "react";
import axios, { Axios } from "axios";
import "./App.css";
import * as bootstrap from "bootstrap";
import "./assets/style.css";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

//將表單欄位初始化
const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: "", //TEMP:測試用帳號，後續正式版需刪除
    password: "",
  });
  const [isAuth, setIsAuth] = useState(false); //預設登入狀態為否

  const [products, setProducts] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");

  const productModalRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    //console.log(name, value);
    setFormData((preData) => ({
      ...preData,
      [name]: value,
    }));
  };

  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    //console.log(name, value);
    setTemplateProduct((preData) => ({
      ...preData,
      [name]: type === "checkbox" ? checked : value, //判斷checkbox是否有被勾選
    }));
  };

  // modal表單的多圖片更新
  const handleModalImageChange = (index, value) => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage[index] = value;

      //TODO:可以增加優化，自動增加欄位和自動刪減欄位，教學影片 53:30
      return {
        ...pre,
        imagesUrl: newImage,
      };
    });
  };

  //新增圖片
  const HandleAddImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.push("");
      return {
        ...pre,
        imagesUrl: newImage,
      };
    });
  };

  //刪除圖片
  const HandleRemoveImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.pop();
      return {
        ...pre,
        imagesUrl: newImage,
      };
    });
  };

  //取得產品列表的資料
  const getProducts = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/${API_PATH}/admin/products`
      );
      setProducts(response.data.products);
    } catch (error) {
      console.log(error.response.data);
    }
  };

  //更新產品資料(因為更新和新增兩個的api欄位幾乎一所以將這兩個寫一起)
  const updateProduct = async (id) => {
    //預設是使用post(新增產品)
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = "post";

    //如果是在編輯模式下的話要使用put
    if (modalType === "edit") {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = "put";
    }

    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== "")], //url不為空，就傳回新的陣列
      },
    };

    try {
      const response = await axios[method](url, productData);
      console.log(response.data);
      getProducts();
      closeModule();
    } catch (error) {
      console.log(error.response.data);
    }
  };

  //刪除產品
  const delProduct = async (id) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/api/${API_PATH}/admin/product/${id}`
      );
      console.log(response.data);
      getProducts(); //更新產品列表資訊
      closeModule(); //關閉表單
    } catch (error) {
      console.log(error.response.data);
    }
  };

  //登入處理
  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      //console.log(response.data); // TEST: 測試API串接
      const { token, expired } = response.data;
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`; // 設定cookie，'hexToken為自己設定的cookie名稱'
      axios.defaults.headers.common["Authorization"] = token;

      getProducts();

      setIsAuth(true); //畫面登入設定變為真
    } catch (error) {
      setIsAuth(false); //登入失敗，所以畫面要處於未登入狀態
      console.log(error.response.data);
    }
  };

  useEffect(() => {
    //取得cookie的值(登入的cookie)
    const token = document.cookie
      .split("; ") // 將整串 cookie 字串以 "; " 切割成陣列，例如：["hexToken=abc123", "otherCookie=xyz"]
      .find((row) => row.startsWith("hexToken=")) // 從陣列中找到開頭為 "hexToken=" 的那筆資料，例如: "hexToken=abc123"
      ?.split("=")[1]; //再以 "=" 切割，取索引 [1] 的值（也就是 token 本身），例如: "abc123"
    if (token) {
      axios.defaults.headers.common["Authorization"] = token;
    }

    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false,
    });

    const checkLogin = async () => {
      try {
        const response = await axios.post(`${API_BASE}/api/user/check`);
        console.log(response.data);
        setIsAuth(true); //將登入狀態變成‘真’
        getProducts(); //取得資料
      } catch (error) {
        console.log(error.response?.data);
      }
    };

    checkLogin();
  }, []);

  //表單顯示的設定
  const openModule = (type, product) => {
    //console.log(product);
    setModalType(type);
    setTemplateProduct((pre) => ({
      ...pre,
      ...product,
    }));
    productModalRef.current.show();
  };

  //關閉標單顯示的設定
  const closeModule = () => {
    productModalRef.current.hide();
  };

  return (
    <>
      {!isAuth ? (
        <div className="container login">
          <h1>請先登入</h1>
          <form className="form-floating" onSubmit={(e) => onSubmit(e)}>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                name="username"
                placeholder="name@example.com"
                value={formData.username}
                onChange={(e) => handleInputChange(e)}
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange(e)}
              />
              <label htmlFor="password">Password</label>
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-2">
              登入
            </button>
          </form>
        </div>
      ) : (
        <div className="container">
          <h2>產品列表</h2>
          <div className="text-end mt-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openModule("create", INITIAL_TEMPLATE_DATA)}
            >
              建立新的產品
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>分類</th>
                <th>產品名稱</th>
                <th>原價</th>
                <th>售價</th>
                <th>是否啟用</th>
                <th>編輯</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.category}</td>
                  <td scope="row">{item.title}</td>
                  <td>{item.origin_price}</td>
                  <td>{item.price}</td>
                  <td className={`${item.is_enabled && "text-success"}`}>
                    {item.is_enabled ? "啟用" : "未啟用"}
                  </td>
                  <td>
                    <div
                      className="btn-group"
                      role="group"
                      aria-label="Basic example"
                    >
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => openModule("edit", item)}
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => openModule("delete", item)}
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="modal fade"
        id="productModal"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
        ref={productModalRef}
      >
        <div className="modal-dialog 	modal-xl">
          <div className="modal-content">
            <div
              className={`modal-header bg-${
                modalType === "delete" ? "danger" : "dark"
              } text-white`}
            >
              <h1 className="modal-title fs-5" id="productModalLabel">
                {modalType === "delete"
                  ? "刪除"
                  : modalType === "edit"
                  ? "編輯"
                  : "新增"}
                產品
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {modalType === "delete" ? (
                <p className="fs-4">
                  確定要刪除
                  <span className="text-danger">{templateProduct.title}</span>
                  嗎？
                </p>
              ) : (
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          輸入圖片網址
                        </label>
                        <input
                          type="text"
                          id="imageUrl"
                          name="imageUrl"
                          className="form-control"
                          placeholder="請輸入圖片連結"
                          value={templateProduct.imageUrl}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      {templateProduct.imageUrl && (
                        <img
                          className="img-fluid"
                          src={templateProduct.imageUrl}
                          alt="主圖"
                        />
                      )}
                    </div>
                    <div>
                      {templateProduct.imagesUrl.map((url, index) => (
                        <div key={index}>
                          <label htmlFor="imageUrl" className="form-label">
                            輸入圖片網址
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`圖片網址${index + 1}`}
                            value={url}
                            onChange={(e) =>
                              handleModalImageChange(index, e.target.value)
                            }
                          />
                          {url && (
                            <img
                              className="img-fluid"
                              src={url}
                              alt={`副圖${index + 1}`}
                            />
                          )}
                        </div>
                      ))}

                      <button
                        className="btn btn-outline-primary btn-sm d-block w-100"
                        onClick={() => HandleAddImage()}
                      >
                        新增圖片
                      </button>
                    </div>
                    <div>
                      <button
                        className="btn btn-outline-danger btn-sm d-block w-100"
                        onClick={() => HandleRemoveImage()}
                      >
                        刪除圖片
                      </button>
                    </div>
                  </div>
                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">
                        標題
                      </label>
                      <input
                        name="title"
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={templateProduct.title}
                        onChange={(e) => handleModalInputChange(e)}
                      />
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">
                          分類
                        </label>
                        <input
                          name="category"
                          id="category"
                          type="text"
                          className="form-control"
                          placeholder="請輸入分類"
                          value={templateProduct.category}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">
                          單位
                        </label>
                        <input
                          name="unit"
                          id="unit"
                          type="text"
                          className="form-control"
                          placeholder="請輸入單位"
                          value={templateProduct.unit}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">
                          原價
                        </label>
                        <input
                          name="origin_price"
                          id="origin_price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入原價"
                          value={templateProduct.origin_price}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">
                          售價
                        </label>
                        <input
                          name="price"
                          id="price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入售價"
                          value={templateProduct.price}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        產品描述
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={templateProduct.description}
                        onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">
                        說明內容
                      </label>
                      <textarea
                        name="content"
                        id="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={templateProduct.content}
                        onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          name="is_enabled"
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={templateProduct.is_enabled}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="is_enabled"
                        >
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {modalType === "delete" ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProduct(templateProduct.id)}
                >
                  刪除
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                    onClick={() => closeModule()}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => updateProduct(templateProduct.id)}
                  >
                    儲存
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
