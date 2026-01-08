import { NextResponse,NextRequest } from "next/server";
import axiosClient from "@/lib/axiosClient";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();

    // 1️⃣ Fetch PHPFox access token
	
	/*const uploadResponse = await axios.post(
	"https://www.api.natureshigh.com/upload.php",body
	,
	{
	headers: {
	  "Content-Type": "multipart/form-data",
	},
	}
	);
	console.log(uploadResponse);*/

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
    const response = await axiosClient.post("/business/register", body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
		"Content-Type": "multipart/form-data"
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
