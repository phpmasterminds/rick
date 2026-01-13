// app/api/user/profile/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function POST(request: NextRequest) {
  try {
    const axios = await createServerAxios();

   // ✅ Parse JSON body
    const body = await request.json();
    const { theme, user_id } = body;

    const response = await axios.post("/business/user/theme", {
      theme,
      user_id,
    });


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
      "Failed to update";

    return NextResponse.json(
      { status: "failed", error: { message: errorMessage } },
      { status: error.response?.status || 500 }
    );
  }
}
