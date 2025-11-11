// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

	const { searchParams } = new URL(req.url);

	const page_id = searchParams.get("page_id");

    // 🔹 Replace this with your external API path
    const response = await axios.get("/business/sales-person",{params: { page_id  }});

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("User fetch error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch sales person info" },
      { status: error.response?.status || 500 }
    );
  }
}

// ✅ PUT - Update existing inventory item
export async function PUT(req: Request) {
  try {
    const axios = await createServerAxios();
    const body = await req.json();
    
	const response = await axios.put(`/business/sales-person`, body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("PUT Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to update item" },
      { status: error.response?.status || 500 }
    );
  }
}