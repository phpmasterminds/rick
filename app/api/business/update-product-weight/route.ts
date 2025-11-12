// app/api/business/update-product-weight/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function PUT(request: NextRequest) {
  try {
    const axios = await createServerAxios();
    const body = await request.json();
    const { product_id, i_weight, i_total_weight, i_price, i_onhand, i_deals } = body;

    // Validate required fields || i_weight === undefined || i_total_weight === undefined
    if (!product_id ) {
      return NextResponse.json(
        { 
          status: 'failed', 
          message: 'Missing required fields: product_id' 
        },
        { status: 400 }
      );
    }

    // Validate weight values
	let weight = 0;
	let totalWeight = 0;
	if(i_weight){
     weight = parseFloat(i_weight);
     totalWeight = parseFloat(i_total_weight);

    if (isNaN(weight) || isNaN(totalWeight)) {
      return NextResponse.json(
        { 
          status: 'failed', 
          message: 'Weight values must be valid numbers' 
        },
        { status: 400 }
      );
    }

    if (weight < 0 || totalWeight < 0) {
      return NextResponse.json(
        { 
          status: 'failed', 
          message: 'Weight values cannot be negative' 
        },
        { status: 400 }
      );
    }
	}

    // ✅ Send with original field names that match backend expectations
    const response = await axios.post(
      "/business/pos-inventory/update-product",
      {
        product_id,
        i_price: i_price,
        i_onhand: i_onhand,
        i_deals: i_deals,
        i_weight: weight,
        i_total_weight: totalWeight
      }
    );

    console.log('✅ Backend response:', response.data);
    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('❌ Error updating product weight:', error.message);
    if (error.response?.data) {
      console.error('❌ Backend error details:', error.response.data);
    }
    
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        error.message || 
                        'Failed to update product weight';
    
    return NextResponse.json(
      { 
        status: 'failed', 
        error: { message: errorMessage }
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}