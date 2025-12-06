// app/api/business/order-list/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

	const { searchParams } = new URL(req.url);
	const page = searchParams.get("page") || "1";
    const status = searchParams.get("status") || "1";
    const limit = searchParams.get("limit") || "1";
    const business = searchParams.get("business") || "1";
    const user_id = searchParams.get("user_id") || "1";


    const response = await axios.get("/business/order-list", {
      params: { limit, page, status, business, user_id },
    });
	
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("User fetch error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch user info" },
      { status: error.response?.status || 500 }
    );
  }
}

