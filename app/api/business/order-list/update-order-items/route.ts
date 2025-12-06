// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function PUT(req: Request) {
  try {
    const axios = await createServerAxios();
    const body = await req.json();
    
	const response = await axios.put(`/business/order/update-order-items`, body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("PUT Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to update item" },
      { status: error.response?.status || 500 }
    );
  }
}
