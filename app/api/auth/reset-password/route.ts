import { NextRequest, NextResponse } from 'next/server';
import axiosClient from "@/lib/axiosClient";

interface ResetPasswordRequest {
  user_id: string;
  email: string;
  password: string;
}

/**
 * POST /api/auth/reset-password
 * Resets user password via PHPFox backend
 */
export async function POST(request: NextRequest) {
  try {
	  
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

    const { user_id, email, password }: ResetPasswordRequest = await request.json();

    // Validate input
    if (!user_id || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Password validation failed: ${passwordValidation.message}`,
        },
        { status: 400 }
      );
    }

    try {
      // Make request to PHPFox API
     const response = await axiosClient.post(
  "/business/user/reset-password",
  {
    user_id,
    email,
    password,
  },
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }
);

      if (response.data.success) {
        return NextResponse.json(
          {
            success: true,
            message: 'Password reset successfully',
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            message: response.data.error.message || 'Failed to reset password',
          },
          { status: 400 }
        );
      }
    } catch (apiError:any) {
		console.log(apiError);
        const status = apiError.response?.status || 500;
        const message =
          apiError.response?.data?.message || 'Failed to communicate with backend';

        return NextResponse.json(
          {
            success: false,
            message: message,
          },
          { status: status < 500 ? status : 500 }
        );
    }
  } catch (error:any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }

  return { valid: true, message: 'Password is valid' };
}