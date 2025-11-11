// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

	const { searchParams } = new URL(req.url);
	const order_id = searchParams.get("order_id");
	const page = searchParams.get("page") || "1";
	

    // 🔹 Replace this with your external API path
  const response = await axios.get(`/business/pos/orders/${order_id}`,{params: {  order_id }});
	
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("User fetch error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch user info" },
      { status: error.response?.status || 500 }
    );
  }
}

