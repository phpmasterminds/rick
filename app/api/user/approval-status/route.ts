import { NextResponse, NextRequest } from "next/server";
import axiosClient from "@/lib/axiosClient";

export async function GET(req: NextRequest) {
  try {
	const userId = req.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    // 1️⃣ Fetch PHPFox access token
    const tokenResponse = await axiosClient.post(
      "/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.BACKEND_BASIC_USER +
                ":" +
                process.env.BACKEND_BASIC_PASS
            ).toString("base64"),
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    // 2️⃣ Call PHPFox /business/register API with token
    const response = await axiosClient.post("/business/verify-code", {'user_group_id':1,'user_id':userId}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("Register API error:", error);

    const status = error.response?.status || 500;
    const msg = error.response?.data || { message: "Internal Server Error" };

    return NextResponse.json(msg, { status });
  }
}