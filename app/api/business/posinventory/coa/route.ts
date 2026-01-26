// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

	const { searchParams } = new URL(req.url);
	const product_id = searchParams.get("product_id");
	const page = searchParams.get("page") || "1";
	const is_from = searchParams.get("is_from") || "pos";
	const limit = searchParams.get("limit") || "30";

    // 🔹 Replace this with your external API path
    const response = await axios.get("/business/pos-inventory/coa",{params: { product_id, page, is_from, limit  }});

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("User fetch error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch user info" },
      { status: error.response?.status || 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const axios = await createServerAxios();

    // ✅ Parse multipart form data
    const formData = await request.formData();

    // ✅ Send to your backend (pass formData directly)
    const response = await axios.post(
      "/business/pos-inventory/coa",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Backend response:", response.data);
    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error("❌ Error updating product:", error.message);
    if (error.response?.data) {
      console.error("❌ Backend error:", error.response.data);
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      error.message ||
      "Failed to upload coa";

    return NextResponse.json(
      { status: "failed", error: { message: errorMessage } },
      { status: error.response?.status || 500 }
    );
  }
}
