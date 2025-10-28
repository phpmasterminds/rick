// lib/serverAxios.ts
import { cookies } from "next/headers";
import axiosClient from "./axiosClient";

export async function createServerAxios() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const instance = axiosClient;

  if (token) {
    // ✅ Use Bearer token — skip Basic Auth
    instance.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    // No token → Basic Auth fallback handled automatically by axiosClient interceptor
  }

  return instance;
}
