import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // <-- FIXED

    console.log("ID =", id);

    const response = await axios.get("/admin/register-id", {
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


// ✅ POST - Create new inventory item
export async function POST(req: Request) {
  try {
    const axios = await createServerAxios();
    const body = await req.json();

    const response = await axios.post("/admin/register-id", body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("POST Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to create item" },
      { status: error.response?.status || 500 }
    );
  }
}