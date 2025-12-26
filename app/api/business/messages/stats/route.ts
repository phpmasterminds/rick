// app/api/business/messages/stats/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

/**
 * Message Statistics API Route
 * Location: /app/api/business/messages/stats/route.ts
 * 
 * Handles message statistics:
 * - GET: Get message counts by status and unread count
 */

// ✅ GET - Get message counts by status
export async function GET(req: Request) {
  try {
    const axios = await createServerAxios();

    const { searchParams } = new URL(req.url);
    const page_id = searchParams.get("page_id");
    const user_id = searchParams.get("user_id");
    const type = searchParams.get("type") || "count"; // count or unread

    // Build params
    const params: any = {};
    if (page_id) params.page_id = page_id;
    if (user_id) params.user_id = user_id;

    let response;

    if (type === "unread") {
      // Get unread count
      response = await axios.get(
        "/business/messages/index/getUnreadCount",
        { params }
      );
    } else {
      // Get count by status
      response = await axios.get(
        "/business/messages/index/getMessageCount",
        { params }
      );
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("GET Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch statistics" },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * API Endpoint Usage Examples:
 * 
 * // GET - Get message counts by status
 * GET /api/business/messages/stats?page_id=1
 * Response: { pending: 5, in_progress: 3, completed: 12, total: 20 }
 * 
 * // GET - Get unread count
 * GET /api/business/messages/stats?page_id=1&type=unread
 * Response: { unread_count: 3 }
 * 
 * // GET - Get counts by user
 * GET /api/business/messages/stats?user_id=5
 */