// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";


export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

	const { searchParams } = new URL(req.url);
	const business = searchParams.get("business");
	const order_id = searchParams.get("order_id");
	const page = searchParams.get("page") || "1";
	const is_from = searchParams.get("is_from") || "pos";
	const limit = searchParams.get("limit") || "30";

    // 🔹 Replace this with your external API path
    const response = await axios.get("/business/whole-sale-order",{params: { business, page, is_from, limit  }});

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("User fetch error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch user info" },
      { status: error.response?.status || 500 }
    );
  }
}

// ✅ POST - Create new inventory item
export async function POST(req: Request) {
  try {
    const axios = await createServerAxios();
    const body = await req.json();

    const response = await axios.post("/business/whole-sale-order", body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("POST Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to Order" },
      { status: error.response?.status || 500 }
    );
  }
}
