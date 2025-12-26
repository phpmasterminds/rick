// app/api/business/messages/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

/**
 * Single Message Detail API Route
 * Location: /app/api/business/messages/[id]/route.ts
 * 
 * Handles individual message operations:
 * - GET: Fetch single message with replies
 */
// ✅ GET - Fetch single message with all replies
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const axios = await createServerAxios();
    const { id } = await params;
    const messageId = id;

    if (!messageId) {
      return NextResponse.json(
        { message: "Missing message ID" },
        { status: 400 }
      );
    }

    // Build params object
    const apiParams: any = {
      method: "replies",
      message_id: messageId,
    };

    const response = await axios.get("/business/messages", {
      params: apiParams, // ✅ MUST be `params`
    });

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error("GET Error:", error.response?.data || error.message);

    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch message" },
      { status: error.response?.status || 500 }
    );
  }
}


/**
 * API Endpoint Usage Examples:
 * 
 * // GET - Fetch single message with replies
 * GET /api/business/messages/1
 */