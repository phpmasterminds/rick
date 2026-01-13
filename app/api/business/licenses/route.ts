// app/api/business/posinventory/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

// ✅ GET - Fetch paginated inventory data
export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    
    const response = await axios.get("/business/license", {
      params: { user_id },
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

    // ✅ Parse multipart form data
    const formData = await req.formData();

 
    // ✅ Send to your backend (pass formData directly)
    const response = await axios.post(
      "/business/license",
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
    const { id } = await req.json(); // get from body
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const response = await axios.delete(`/business/pos/customer/${id}`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("DELETE Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to delete customer" },
      { status: error.response?.status || 500 }
    );
  }
}
