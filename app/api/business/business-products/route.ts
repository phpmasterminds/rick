// app/api/business/discount-types/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(request: NextRequest) {
  try {
    // ✅ Extract query parameters
    const { searchParams } = new URL(request.url);
    const page_id = searchParams.get("page_id");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const product_id = searchParams.get("product_id");
    const vanity_url = searchParams.get("vanity_url");
    const user_id = searchParams.get("user_id");

   
    const axios = await createServerAxios();

    // ✅ Pass query params correctly
    const response = await axios.get("/business/get-business-products", {
      params: { page_id, product_id, limit, page, vanity_url, user_id },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("product Error:", error.response?.data || error.message);

    return NextResponse.json(
      {
        status: "failed",
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch products",
      },
      { status: error.response?.status || 500 }
    );
  }
}
