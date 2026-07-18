import axios from "axios";
import { auth } from "../config/supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the Supabase session token to all requests if the user is logged in
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await auth.getSession();
  if (session) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
