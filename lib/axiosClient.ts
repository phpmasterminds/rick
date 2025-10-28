// lib/axiosClient.ts
import axios from "axios";
import { cookies } from "next/headers";

const axiosClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ✅ Request interceptor
axiosClient.interceptors.request.use((config) => {
  // If already has Bearer token (set by serverAxios), skip Basic Auth
  
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;
 
  /*config.headers.Authorization*/
  if (!token) {
    const username = process.env.BACKEND_BASIC_USER;
    const password = process.env.BACKEND_BASIC_PASS;
    if (username && password) {
      const basicToken = Buffer.from(`${username}:${password}`).toString("base64");
      config.headers.Authorization = `Basic ${basicToken}`;
    }
  }

  return config;
});

export default axiosClient;
