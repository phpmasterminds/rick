// app/api/business/discount-types/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(request: NextRequest) {
  try {
    // ✅ Extract query parameter from URL
    const { searchParams } = new URL(request.url);
    const page_id = searchParams.get('page_id');


    // ✅ Validate page_id exists
    if (!page_id || page_id === undefined || page_id === 'undefined') {
      return NextResponse.json(
        {
          status: 'failed',
          message: 'Missing required parameter: page_id'
        },
        { status: 400 }
      );
    }

    const axios = await createServerAxios();

    // ✅ Pass query params using params object
    const response = await axios.get("/business/pos-inventory/discount-scopes", {
      params: {
        page_id: page_id
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'failed',
        message: error.response?.data?.message || "Failed to fetch discount scopes" 
      },
      { status: error.response?.status || 500 }
    );
  }
}