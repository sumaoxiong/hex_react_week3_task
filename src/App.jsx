import { useState } from "react";
import axios, { Axios } from "axios";
import "./assets/style.css";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const [formData, setFormData] = useState({
    username: "", //TEMP:測試用帳號，後續正式版需刪除
    password: "",
  });
  const [isAuth, setIsAuth] = useState(false); //預設登入狀態為否

  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    //console.log(name, value);
    setFormData((preData) => ({
      ...preData,
      [name]: value,
    }));
  };

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

  const checkLogin = async () => {
    try {
      //取得cookie的值(登入的cookie)
      const token = document.cookie
        .split("; ") // 將整串 cookie 字串以 "; " 切割成陣列，例如：["hexToken=abc123", "otherCookie=xyz"]
        .find((row) => row.startsWith("hexToken=")) // 從陣列中找到開頭為 "hexToken=" 的那筆資料，例如: "hexToken=abc123"
        ?.split("=")[1]; //再以 "=" 切割，取索引 [1] 的值（也就是 token 本身），例如: "abc123"
      axios.defaults.headers.common["Authorization"] = token;
      const response = await axios.post(`${API_BASE}/api/user/check`);
      console.log(response.data);
    } catch (error) {
      console.log(error.response?.data);
    }
  };

  return (
    <>
      {!isAuth ? (
        <div className="container login">
          <h1>請先登入(week3_task)</h1>
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
          <div className="row mt-5">
            <div className="col-md-6">
              <button
                className="btn btn-danger mb-5"
                type="button"
                onClick={() => checkLogin()}
              >
                確認是否登入
              </button>
              <h2>產品列表</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>產品名稱</th>
                    <th>原價</th>
                    <th>售價</th>
                    <th>是否啟用</th>
                    <th>查看細節</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.origin_price}</td>
                      <td>{item.price}</td>
                      <td>{item.is_enabled ? "是" : "否"}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => setTempProduct(item)}
                        >
                          查看細節
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h2>單一產品細節</h2>
              {tempProduct ? (
                <div className="card mb-3">
                  <img
                    src={tempProduct.imageUrl}
                    className="card-img-top primary-image"
                    alt="主圖"
                  />
                  <div className="card-body">
                    <h5 className="card-title">
                      {tempProduct.title}
                      <span className="badge bg-primary ms-2">{}</span>
                    </h5>
                    <p className="card-text">
                      商品描述：{tempProduct.description}
                    </p>
                    <p className="card-text">商品內容：{tempProduct.content}</p>
                    <div className="d-flex">
                      <p className="card-text text-secondary">
                        <del>{tempProduct.origin_price}</del>
                      </p>
                      元 / {tempProduct.price} 元
                    </div>
                    <h5 className="mt-3">更多圖片：</h5>
                    <div className="d-flex flex-wrap">
                      {tempProduct.imagesUrl.map((item, index) => (
                        <img className="images" src={item} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-secondary">請選擇一個商品查看</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
