// app/api/user/profile/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

async function validateImage(buffer: Buffer, mimeType: string): Promise<boolean> {
  // Check MIME type
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validMimeTypes.includes(mimeType)) {
    return false;
  }

  // Check file signature (magic bytes)
  if (mimeType === 'image/jpeg' && !isJpeg(buffer)) return false;
  if (mimeType === 'image/png' && !isPng(buffer)) return false;
  if (mimeType === 'image/webp' && !isWebp(buffer)) return false;
  if (mimeType === 'image/gif' && !isGif(buffer)) return false;

  return true;
}

function isJpeg(buffer: Buffer): boolean {
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer: Buffer): boolean {
  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  );
}

function isWebp(buffer: Buffer): boolean {
  return (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  );
}

function isGif(buffer: Buffer): boolean {
  return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
	const axios = await createServerAxios();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const businessId = formData.get('businessId') as string;
    const photoType = formData.get('photoType') as 'company' | 'cover';

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file provided',
        },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Business ID is required',
        },
        { status: 400 }
      );
    }

    if (!photoType || !['company', 'cover'].includes(photoType)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid photo type is required',
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size must be less than 5MB',
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only image files are allowed',
        },
        { status: 400 }
      );
    }
 
    // ✅ Send to your backend (pass formData directly)
    const response = await axios.post(
      "/business/company/photo-upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
	

         return NextResponse.json(response.data);

    

    
  } catch (error: any) {
	  console.error("❌ Error updating product:", error.message);
    if (error.response?.data) {
      console.error("❌ Backend error:", error.response.data);
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      error.message ||
      "Failed to update product";

    return NextResponse.json(
      { status: "failed", error: { message: errorMessage } },
      { status: error.response?.status || 500 }
    );
  }
}