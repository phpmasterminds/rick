// app/api/business/toggle-publish/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function POST(request: NextRequest) {
  try {
    const axios = await createServerAxios();
    const body = await request.json();
    const { product_id, enable_product } = body;

    // Validate required fields
    if (!product_id) {
      return NextResponse.json(
        { status: 'failed', message: 'Missing required field: product_id' },
        { status: 400 }
      );
    }

    if (enable_product === undefined || enable_product === null) {
      return NextResponse.json(
        { status: 'failed', message: 'Missing required field: enable_product' },
        { status: 400 }
      );
    }

    console.log('📤 Toggling publish:', { product_id, enable_product });

    const response = await axios.post("/business/toggle-publish", {
      product_id,
      enable_product
    });

    console.log('✅ Backend response:', response.data);
    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('❌ Error toggling publish:', error.message);
    if (error.response?.data) {
      console.error('❌ Backend error:', error.response.data);
    }

    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error?.message || 
                        error.message || 
                        'Failed to toggle publish';

    return NextResponse.json(
      { 
        status: 'failed', 
        error: { message: errorMessage }
      },
      { status: error.response?.status || 500 }
    );
  }
}