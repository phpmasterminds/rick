// app/api/business/volume-discounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerAxios } from '@/lib/serverAxios';

/* ===========================
   GET - Fetch volume discounts
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

    const response = await axios.get(
      "/business/volume-discounts",
      {
        params: { business, limit, offset }
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('Error fetching volume discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume discounts' },
      { status: 500 }
    );
  }
}

/* ===========================
   POST - Create volume discount
=========================== */
export async function POST(request: NextRequest) {
  try {
    const axios = await createServerAxios();
    const body = await request.json();

    const { business, thresholds } = body;

    if (!business || !Array.isArray(thresholds) || thresholds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: business, thresholds' },
        { status: 400 }
      );
    }

    const response = await axios.post(
      "/business/volume-discounts",
      body
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('Error creating volume discount:', error);
    return NextResponse.json(
      { error: 'Failed to create volume discount' },
      { status: 500 }
    );
  }
}

/* ===========================
   PUT - Update volume discount
=========================== */
export async function PUT(request: NextRequest) {
  try {
    const axios = await createServerAxios();
    const body = await request.json();
	const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
   // const { id, ...updateData } = body;
console.log(id+'-');
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const response = await axios.put(
      `/business/volume-discounts/${id}`,
      body
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('Error updating volume discount:', error);
    return NextResponse.json(
      { error: 'Failed to update volume discount' },
      { status: 500 }
    );
  }
}

/* ===========================
   DELETE - Delete volume discount
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
      `/business/volume-discounts/${id}`
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('Error deleting volume discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete volume discount' },
      { status: 500 }
    );
  }
}
