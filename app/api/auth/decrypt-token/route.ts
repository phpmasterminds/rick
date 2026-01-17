import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/auth/decrypt-token
 * Decrypts the password reset token sent via email
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token is required',
        },
        { status: 400 }
      );
    }

    try {
      // Decode the token
      const decodedToken = decodeURIComponent(token);
      const decrypted = Buffer.from(decodedToken, 'base64').toString('utf-8');

      // Parse the decrypted JSON
      const payload = JSON.parse(decrypted);

      // Validate required fields
      if (!payload.email || !payload.user_id || !payload.time) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid token format',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Token decrypted successfully',
          data: {
            email: payload.email,
            user_id: payload.user_id,
            time: payload.time,
          },
        },
        { status: 200 }
      );
    } catch (decryptError) {
      console.error('Token decryption failed:', decryptError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to decrypt token',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Decrypt token error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing the token',
      },
      { status: 500 }
    );
  }
}