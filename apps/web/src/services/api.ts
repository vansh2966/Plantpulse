import axios from "axios";
import { auth } from "../config/supabase";

let envApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
if (envApiUrl && !envApiUrl.endsWith('/api/v1')) {
  envApiUrl = envApiUrl.replace(/\/$/, '') + '/api/v1';
}
const API_BASE_URL = envApiUrl || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the Supabase session token to all requests if the user is logged in
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await auth.getSession();
  if (session) {
    if (!config.headers) {
      config.headers = {} as any;
    }
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
