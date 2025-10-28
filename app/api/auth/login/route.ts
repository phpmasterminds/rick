import { NextResponse } from "next/server";
import axiosClient from "@/lib/axiosClient";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await axiosClient.post("/token", body);
	
	const { access_token, refresh_token, token_type, expires_in } = response.data;

    // 🕐 1 day expiration (24 hours)
    const oneDay = 24 * 60 * 60;

    // ✅ Await cookies() in Next.js 15+
    const cookieStore = await cookies();



    // 🍪 Set secure, HTTP-only cookie
    cookieStore.set("access_token", access_token, {
      maxAge: oneDay,
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("Login API error:", error.message);
    const status = error.response?.status || 500;
    const msg = error.response?.data || { message: "Internal Server Error" };
    return NextResponse.json(msg, { status });
  }
}
