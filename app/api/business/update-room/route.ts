// app/api/business/update-room/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function POST(request: NextRequest) {
  try {
    const axios = await createServerAxios();
    const body = await request.json();
    const { product_id, room_id } = body;

    // Validate required fields
    if (!product_id) {
      return NextResponse.json(
        { status: 'failed', message: 'Missing required field: product_id' },
        { status: 400 }
      );
    }

    if (!room_id) {
      return NextResponse.json(
        { status: 'failed', message: 'Missing required field: room_id' },
        { status: 400 }
      );
    }

    console.log('📤 Updating room:', { product_id, room_id });

    const response = await axios.post("/business/update-room", {
      product_id,
      room_id
    });

    console.log('✅ Backend response:', response.data);
    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('❌ Error updating room:', error.message);
    if (error.response?.data) {
      console.error('❌ Backend error:', error.response.data);
    }

    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error?.message || 
                        error.message || 
                        'Failed to update room';

    return NextResponse.json(
      { 
        status: 'failed', 
        error: { message: errorMessage }
      },
      { status: error.response?.status || 500 }
    );
  }
}