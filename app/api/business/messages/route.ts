// app/api/business/messages/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

/**
 * Messages API Route
 * Location: /app/api/business/messages/route.ts
 * 
 * Handles all messaging operations:
 * - GET: Fetch messages with pagination and filters
 * - POST: Create new message
 * - PUT: Update message (status, etc.)
 * - DELETE: Delete message
 */

// ✅ GET - Fetch paginated messages with filters
export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

    const { searchParams } = new URL(req.url);
    const page_id = searchParams.get("page_id");
    const user_id = searchParams.get("user_id");
    const method = searchParams.get("method");
    const business = searchParams.get("business");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "30";

    // Build params object
    const params: any = {
      page,
      limit,
    };

    if (page_id) params.page_id = page_id;
    if (user_id) params.user_id = user_id;
    if (status) params.status = status;
    if (search) params.search = search;
    if (method) params.method = method;
    if (business) params.business = business;

    const response = await axios.get("/business/messages", {
      params,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("GET Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch messages" },
      { status: error.response?.status || 500 }
    );
  }
}

// ✅ POST - Create new message
export async function POST(req: Request) {
  try {
    const axios = await createServerAxios();
    const body = await req.json();

    // Validate required fields
    if (!body.page_id || !body.user_id || !body.subject || !body.message) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: page_id, user_id, subject, message",
        },
        { status: 400 }
      );
    }

    const response = await axios.post(
      "/business/messages",
      body
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("POST Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to create message" },
      { status: error.response?.status || 500 }
    );
  }
}

// ✅ PUT - Update message (status, etc.)
export async function PUT(req: Request) {
  try {
    const axios = await createServerAxios();
    const body = await req.json();

    if (!body.message_id) {
      return NextResponse.json(
        { message: "Missing message_id" },
        { status: 400 }
      );
    }

    // If updating status
    if (body.status) {
		
      const response = await axios.put(
        `/business/messages`,
        {
          message_id: body.message_id,
          status: body.status,
        }
      );
      return NextResponse.json(response.data);
    }

    // Generic update (can extend for other fields)
    const response = await axios.put(
      `/business/messages/index/updateMessage/${body.message_id}`,
      body
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("PUT Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to update message" },
      { status: error.response?.status || 500 }
    );
  }
}

// ✅ DELETE - Delete message
export async function DELETE(req: Request) {
  try {
    const axios = await createServerAxios();
    const { message_id } = await req.json();

    if (!message_id) {
      return NextResponse.json(
        { message: "Missing message_id" },
        { status: 400 }
      );
    }

    const response = await axios.delete(
      `/business/messages/index/deleteMessage?message_id=${message_id}`
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("DELETE Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to delete message" },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * API Endpoint Usage Examples:
 * 
 * // GET - Fetch messages
 * GET /api/business/messages?page_id=1&status=pending&limit=30&page=1
 * 
 * // GET - Fetch with search
 * GET /api/business/messages?page_id=1&search=order&limit=30&page=1
 * 
 * // POST - Create message
 * POST /api/business/messages
 * {
 *   "page_id": 1,
 *   "user_id": 5,
 *   "subject": "Order Inquiry",
 *   "message": "Do you have this product in stock?"
 * }
 * 
 * // PUT - Update status
 * PUT /api/business/messages
 * {
 *   "message_id": 1,
 *   "status": "in_progress"
 * }
 * 
 * // DELETE - Delete message
 * DELETE /api/business/messages
 * {
 *   "message_id": 1
 * }
 */