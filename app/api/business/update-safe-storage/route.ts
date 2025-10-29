// app/api/business/update-safe-storage/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function POST(request: NextRequest) {
  try {
    const axios = await createServerAxios();
    const body = await request.json();
    const { product_id, safe_storage } = body;

    // Validate required fields
    if (!product_id) {
      return NextResponse.json(
        { status: 'failed', message: 'Missing required field: product_id' },
        { status: 400 }
      );
    }

    if (safe_storage === undefined || safe_storage === null) {
      return NextResponse.json(
        { status: 'failed', message: 'Missing required field: safe_storage' },
        { status: 400 }
      );
    }

    console.log('📤 Updating safe storage:', { product_id, safe_storage });

    // Call external API to update safe storage
    const response = await axios.post("/business/update-safe-storage", {
      product_id,
      safe_storage
    });

    console.log('✅ Backend response:', response.data);
    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('❌ Error updating safe storage:', error.message);
    if (error.response?.data) {
      console.error('❌ Backend error:', error.response.data);
    }

    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error?.message || 
                        error.message || 
                        'Failed to update safe storage';

    return NextResponse.json(
      { 
        status: 'failed', 
        error: { message: errorMessage }
      },
      { status: error.response?.status || 500 }
    );
  }
}