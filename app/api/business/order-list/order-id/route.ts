import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // <-- FIXED


    const response = await axios.get("/business/order-id", {
      params: { id }, // <-- FIXED
    });

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error("GET Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch data" },
      { status: error.response?.status || 500 }
    );
  }
}