// app/api/business/promotions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerAxios } from '@/lib/serverAxios';

/* ===========================
   GET - Fetch promotions
=========================== */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const business = searchParams.get('business');
  const limit = searchParams.get('limit') ?? '50';
  const offset = searchParams.get('offset') ?? '0';

  if (!business) {
    return NextResponse.json(
      { error: 'Business parameter is required' },
      { status: 400 }
    );
  }

  try {
    const axios = await createServerAxios();

    const response = await axios.get("/business/promotions",{
        params: { business, limit, offset }
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}

/* ===========================
   POST - Create promotion
=========================== */
export async function POST(request: NextRequest) {
  try {
    const axios = await createServerAxios();
    const body = await request.json();

    const {
      business,
      discount_value,
      valid_from,
      valid_to,
      promoCodeRequired,
      code,
      action,
      businessId,
      cartSubtotal,
    } = body;
	
	if(action === 'validate'){
		const response = await axios.post(
		  "/business/promotions",
		  body
		);
		return NextResponse.json(response.data, { status: response.status });
	}else{
		if (!business || !discount_value || !valid_from || !valid_to) {
		  return NextResponse.json(
			{
			  error:
				'Missing required fields: business, discountValue, validFrom, validTo',
			},
			{ status: 400 }
		  );
		}

		if (promoCodeRequired && !code) {
		  return NextResponse.json(
			{ error: 'Promo code is required when promoCodeRequired is enabled' },
			{ status: 400 }
		  );
		}

		const response = await axios.post(
		  "/business/promotions",
		  body
		);
		return NextResponse.json(response.data, { status: response.status });
	}
	
    
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    );
  }
}

/* ===========================
   PUT - Update promotion
=========================== */
export async function PUT(request: NextRequest) {
  try {
    const axios = await createServerAxios();
    const body = await request.json();
    const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const response = await axios.put(
      `/business/promotions/${id}`,
      body
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { error: 'Failed to update promotion' },
      { status: 500 }
    );
  }
}

/* ===========================
   DELETE - Delete promotion
=========================== */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'ID parameter is required' },
      { status: 400 }
    );
  }

  try {
    const axios = await createServerAxios();

    const response = await axios.delete(
      `/business/promotions/${id}`
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json(
      { error: 'Failed to delete promotion' },
      { status: 500 }
    );
  }
}
