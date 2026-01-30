// app/api/business/discount-types/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(request: NextRequest) {
  try {
    // ✅ Extract query parameters
    const { searchParams } = new URL(request.url);
    const page_id = searchParams.get("page_id");
    const product_id = searchParams.get("product_id");
    const business = searchParams.get("business");

    // ✅ Validate page_id
    /*if (!page_id || page_id === "undefined") {
      return NextResponse.json(
        {
          status: "failed",
          message: "Missing required parameter: page_id",
        },
        { status: 400 }
      );
    }*/

    const axios = await createServerAxios();

    // ✅ Pass query params correctly
    const response = await axios.get("/business/nom-empty-categories", {
      params: { business, page_id, product_id },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("[discount-types] Error:", error.response?.data || error.message);

    return NextResponse.json(
      {
        status: "failed",
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch discount types",
      },
      { status: error.response?.status || 500 }
    );
  }
}
