// lib/serverAxios.ts
import { cookies } from "next/headers";
import axiosClient from "./axiosClient";
export async function createServerAxios() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("access_token")?.value;
  // 1️⃣ If no token → generate a new one
  if (!accessToken) {
    try {
      const tokenResponse = await axiosClient.post(
        "/token",
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(
                process.env.BACKEND_BASIC_USER +
                  ":" +
                  process.env.BACKEND_BASIC_PASS
              ).toString("base64"),
          },
        }
      );
      accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new Error("Token response missing access_token");
      }
      // 2️⃣ Store in cookies for next requests
      cookieStore.set({
        name: "access_token",
        value: accessToken,
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
      });
      console.log("🔐 New access_token generated");
    } catch (error) {
      console.error("❌ Failed to generate token:", error);
      throw new Error("Token generation failed");
    }
  }
  // 3️⃣ Always pass Bearer token
  const instance = axiosClient;
  instance.defaults.headers.Authorization = `Bearer ${accessToken}`;
  return instance;
}