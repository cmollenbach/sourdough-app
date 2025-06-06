import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // if you use cookies for auth
});

// Attach JWT token to every request if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Generic GET
export async function apiGet<T>(url: string): Promise<T> {
  const response = await api.get<T>(url);
  return response.data;
}

// Generic POST
export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const response = await api.post<T>(url, data);
  return response.data;
}

export default api;