// app/api/business/update-product/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function POST(request: NextRequest) {
  try {
    const axios = await createServerAxios();

    // ✅ Parse multipart form data
    const formData = await request.formData();

    // Extract required fields
    /*const product_id = formData.get("product_id");
    if (!product_id) {
      return NextResponse.json(
        { status: "failed", message: "Missing required field: product_id" },
        { status: 400 }
      );
    }
console.log(formData);*/
    // ✅ Send to your backend (pass formData directly)
    const response = await axios.post(
      "/business/pos-inventory/update-product-full",
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
      "Failed to update product";

    return NextResponse.json(
      { status: "failed", error: { message: errorMessage } },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const axios = await createServerAxios();
    const { id,business } = await req.json(); // get from body
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const response = await axios.delete(`/business/pos-inventory/update-product-full?id=${id}&business=${business}`);
	console.log(response);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("DELETE Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to delete" },
      { status: error.response?.status || 500 }
    );
  }
}
