import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // <-- FIXED


    const response = await axios.get("/business/user/invoice-id", {
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


export async function POST(request: Request) {
  try {
	const axios = await createServerAxios();

    const body = await request.json();
    const { invoice_id, payment_method, paid_at, notes,status, amount_paid, p_status } = body;

    if (!invoice_id) {
      return NextResponse.json(
        { status: 'error', error: 'invoice_id and payment_method are required' },
        { status: 400 }
      );
    }

    // Update invoice payment status
    const response = await axios.post(
      `/business/user/invoice-id`,
      {
        invoice_id,
        payment_method,
        paid_at,
        notes,
		status,
		amount_paid,
		p_status
      }
    );

    return NextResponse.json({
      status: 'success',
      message: 'Payment updated successfully',
      data: response.data,
    });
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        error: error.response?.data?.error || 'Failed to update payment' 
      },
      { status: error.response?.status || 500 }
    );
  }
}
