import axios from "axios";
import { auth } from "../config/firebase";

// In React Native (Android Emulator), localhost refers to the emulator itself.
// To reach the development machine's localhost, use 10.0.2.2.
// For physical devices on the same Wi-Fi, use the machine's local IP address.
const API_BASE_URL = "http://192.168.1.5:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
