// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

    const { searchParams } = new URL(req.url);
    const business = searchParams.get("business");
	
    const response = await axios.get("/business/get", {
      params: { business },
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
