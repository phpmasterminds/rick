// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

// ✅ GET - Fetch paginated inventory data
export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const status = searchParams.get("status") || "1";
    const limit = searchParams.get("limit") || "1";

    const response = await axios.get("/business/admin/register-list", {
      params: { limit, page, status },
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

    const response = await axios.post("/business/pos/customer", body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("POST Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to create item" },
      { status: error.response?.status || 500 }
    );
  }
}

// ✅ PUT - Update existing inventory item
export async function PUT(req: Request) {
  try {
    const axios = await createServerAxios();
    const body = await req.json();
    
	const response = await axios.put(`/business/pos/customer/${body.customer_id}`, body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("PUT Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to update item" },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const axios = await createServerAxios();
    const { registration_id } = await req.json(); // get from body
    if (!registration_id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const response = await axios.delete(`/business/admin/register-list-id/${registration_id}`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("DELETE Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to delete customer" },
      { status: error.response?.status || 500 }
    );
  }
}
