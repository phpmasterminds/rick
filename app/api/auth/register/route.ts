import { NextResponse } from "next/server";
import axiosClient from "@/lib/axiosClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await axiosClient.post("/register", body, {
      headers: {
        "x-api-key": process.env.API_KEY || "",
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("Register API error:", error.message);
    const status = error.response?.status || 500;
    const msg = error.response?.data || { message: "Internal Server Error" };
    return NextResponse.json(msg, { status });
  }
}
