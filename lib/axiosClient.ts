// lib/axiosClient.ts
import axios from "axios";
//import { cookies } from "next/headers";

const axiosClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ✅ Request interceptor
axiosClient.interceptors.request.use(async (config) => {
  // If already has Bearer token (set by serverAxios), skip Basic Auth
  
  //const cookieStore = await cookies();
  //const token = cookieStore.get("access_token")?.value;
 
  /*config.headers.Authorization*/
  axiosClient.defaults.headers.common["Authorization"] = "";
  
  if (!config.headers.Authorization) {
	 //if (!token) {
		const username = process.env.BACKEND_BASIC_USER;
		const password = process.env.BACKEND_BASIC_PASS;
		if (username && password) {
		  const basicToken = Buffer.from(`${username}:${password}`).toString("base64");
		  config.headers.Authorization = `Basic ${basicToken}`;
		}
	  //}
  }

  return config;
});

// 🔥 ADD THIS FUNCTION HERE — at bottom
export const clearAxiosAuth = () => {
  delete axiosClient.defaults.headers.common["Authorization"];
    axiosClient.defaults.headers.common["Authorization"] = "";

};

export default axiosClient;
