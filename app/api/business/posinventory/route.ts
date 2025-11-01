// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

	const { searchParams } = new URL(req.url);
	const business = searchParams.get("business");
	const page = searchParams.get("page") || "1";
	const is_from = searchParams.get("is_from") || "pos";

    // 🔹 Replace this with your external API path
    const response = await axios.get("/business/pos-inventory",{params: { business, page, is_from  }});

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("User fetch error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch user info" },
      { status: error.response?.status || 500 }
    );
  }
}
