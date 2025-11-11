// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

	const { searchParams } = new URL(req.url);
	const user_id = searchParams.get("user_id");
	const page = searchParams.get("page") || "1";
	const limit = searchParams.get("limit") || "30";

    // 🔹 Replace this with your external API path
    const response = await axios.get("/business/get-user-business",{params: { user_id, page, limit  }});

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("User fetch error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch user info" },
      { status: error.response?.status || 500 }
    );
  }
}
