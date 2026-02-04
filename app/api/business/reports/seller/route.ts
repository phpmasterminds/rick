// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

	const { searchParams } = new URL(req.url);
	const business = searchParams.get("business");
	const atype = searchParams.get("type");
	const from_date = searchParams.get("from_date");
	const to_date = searchParams.get("to_date");
	const limit = searchParams.get("limit");
	const page = searchParams.get("page");
	const product_id = searchParams.get("product_id");
	const customer_id = searchParams.get("customer_id");

    // 🔹 Replace this with your external API path
    const response = await axios.get("/business/reports/seller",{params: { business, atype, from_date, to_date, limit, page,product_id, customer_id  }});

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("User fetch error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch reports" },
      { status: error.response?.status || 500 }
    );
  }
}
