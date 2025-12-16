import axios from "axios";

// ✅ Create a base Axios instance
const axiosBase = axios.create({
  baseURL: import.meta.env.VITE_SERVER || "http://localhost:5000/",
  withCredentials: true,
  // ❌ Remove "Content-Type": "application/json"
  headers: {
    Accept: "application/json",
  },
});

// ✅ Optional: Automatically attach token (if you’re using auth)
axiosBase.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Only set JSON type for requests *without* FormData
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle global errors (like expired token)
axiosBase.interceptors.response.use(
  (response) => response,
  (error) => {
     if (
       error.response &&
       (error.response.status === 401 || error.response.status === 403)
     ) {
       console.warn("⚠️ Unauthorized — logging out...");
       localStorage.removeItem("token");
       localStorage.removeItem("user");
    
       window.location.replace("/");
     }
    return Promise.reject(error);
  }
);

export default axiosBase;
