// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";


export async function POST(req: Request) {
  try {
    const axios = await createServerAxios();
    // ✅ Parse multipart form data
    const formData = await req.formData();
	
	const response = await axios.post(
      "/business/admin/register-list",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
	
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("POST Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to create item" },
      { status: error.response?.status || 500 }
    );
  }
}