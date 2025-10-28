// app/api/auth/mine/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET() {
  try {
    const axios = await createServerAxios();

    // 🔹 Replace this with your external API path
    const response = await axios.get("/user/mine");

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("User fetch error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch user info" },
      { status: error.response?.status || 500 }
    );
  }
}
