// app/api/business/messages/[id]/replies/route.ts
import { NextResponse } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";

/**
 * Message Replies API Route
 * Location: /app/api/business/messages/[id]/replies/route.ts
 * 
 * Handles message reply operations:
 * - POST: Add reply to message
 */

// ✅ POST - Add reply to message
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const axios = await createServerAxios();
    const body = await req.json();

    if (!messageId) {
      return NextResponse.json(
        { message: "Missing message ID" },
        { status: 400 }
      );
    }

    if (!body.user_id || !body.reply_text) {
      return NextResponse.json(
        {
          message: "Missing required fields: user_id, reply_text",
        },
        { status: 400 }
      );
    }

    const response = await axios.post(
      "/business/messages",
      {
        message_id: messageId,
        user_id: body.user_id,
        reply_text: body.reply_text,
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("POST Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to add reply" },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * API Endpoint Usage Examples:
 * 
 * // POST - Add reply to message
 * POST /api/business/messages/1/replies
 * {
 *   "user_id": 1,
 *   "reply_text": "Yes, we have it in stock!"
 * }
 */