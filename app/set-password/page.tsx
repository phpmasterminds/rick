'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface TokenPayload {
  email: string;
  user_id: string;
  time: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  
  // Token data
  const [tokenData, setTokenData] = useState<TokenPayload | null>(null);
  
  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation errors
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Decrypt token on mount
  useEffect(() => {
    const decryptToken = async () => {
      try {
        setIsDecrypting(true);
        const token = searchParams.get('token');
        
        if (!token) {
          setDecryptError('Invalid or missing reset token. Please request a new password reset link.');
          setIsDecrypting(false);
          return;
        }

        // Send token to backend for decryption
        const response = await axios.post<ApiResponse>(
          '/api/auth/decrypt-token',
          { token },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data.success && response.data.data) {
          const payload: TokenPayload = response.data.data;
          
          // Check if token is expired (older than 24 hours)
          const tokenAge = Math.floor(Date.now() / 1000) - payload.time;
          const EXPIRATION_TIME = 24 * 60 * 60; // 24 hours in seconds
console.log(tokenAge+"tokenAge");
          if (tokenAge > EXPIRATION_TIME) {
            setDecryptError('Password reset link has expired. Please request a new one.');
            setIsDecrypting(false);
            return;
          }

          setTokenData(payload);
        } else {
          setDecryptError('Failed to process reset token. Please request a new password reset link.');
        }
      } catch (error) {
        console.error('Token decryption error:', error);
        setDecryptError('Invalid reset token. Please request a new password reset link.');
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptToken();
  }, [searchParams]);

  // Password validation
  const validatePassword = (pwd: string): string => {
    if (!pwd) {
      return 'Password is required';
    }
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(pwd)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return '';
  };

  // Handle password change
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) {
      setPasswordError(validatePassword(value));
    }
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (confirmPasswordError && password) {
      setConfirmPasswordError(value !== password ? 'Passwords do not match' : '');
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenData) {
      toast.error('Token data is missing. Please try again.');
      return;
    }

    // Validate password
    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setPasswordError('');
    setConfirmPasswordError('');

    try {
      const response = await axios.post<ApiResponse>(
        '/api/auth/reset-password',
        {
          user_id: tokenData.user_id,
          email: tokenData.email,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setIsSuccess(true);
        toast.success('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast.error(response.data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('An error occurred while resetting your password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isDecrypting) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div className="text-center">
          <div
            className={`w-12 h-12 rounded-full border-4 border-t-2 animate-spin mx-auto mb-4 ${
              isDark
                ? 'border-gray-700 border-t-blue-500'
                : 'border-gray-200 border-t-blue-600'
            }`}
          ></div>
          <p
            className={`text-lg font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Processing your reset link...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (decryptError) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div
          className={`w-full max-w-md p-8 rounded-lg shadow-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h1 className={`text-2xl font-bold mb-2 text-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Invalid Reset Link
          </h1>
          <p
            className={`text-center mb-6 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {decryptError}
          </p>
          <a
            href="/forgot-password"
            className={`w-full py-2 px-4 rounded-lg font-medium text-center transition ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Request New Reset Link
          </a>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div
          className={`w-full max-w-md p-8 rounded-lg shadow-lg text-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Password Reset Successful!
          </h1>
          <p
            className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Your password has been reset successfully. You will be redirected to login...
          </p>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div
      className={`min-h-screen flex items-center justify-center py-12 px-4 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div
        className={`w-full max-w-md ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } rounded-lg shadow-lg p-8`}
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div
            className={`p-3 rounded-full ${
              isDark ? 'bg-blue-900' : 'bg-blue-100'
            }`}
          >
            <Lock
              className={`w-6 h-6 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}
            />
          </div>
        </div>

        <h1
          className={`text-2xl font-bold text-center mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          Set New Password
        </h1>

        <p
          className={`text-center mb-8 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Enter a strong password to secure your account
        </p>

        {/* Token Info */}
        {tokenData && (
          <div
            className={`mb-6 p-3 rounded ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Email: <span className="font-semibold">{tokenData.email}</span>
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => {
                  if (password && !passwordError) {
                    setPasswordError(validatePassword(password));
                  }
                }}
                placeholder="Enter new password"
                className={`w-full px-4 py-2 pr-10 rounded-lg border transition ${
                  isDark
                    ? `bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none ${
                        passwordError
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`
                    : `bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none ${
                        passwordError
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
            {password && !passwordError && (
              <p className="text-green-500 text-sm mt-1">✓ Password strength: Strong</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                onBlur={() => {
                  if (confirmPassword && password) {
                    setConfirmPasswordError(
                      confirmPassword !== password ? 'Passwords do not match' : ''
                    );
                  }
                }}
                placeholder="Confirm password"
                className={`w-full px-4 py-2 pr-10 rounded-lg border transition ${
                  isDark
                    ? `bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none ${
                        confirmPasswordError
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`
                    : `bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none ${
                        confirmPasswordError
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
            )}
            {confirmPassword && password === confirmPassword && !confirmPasswordError && (
              <p className="text-green-500 text-sm mt-1">✓ Passwords match</p>
            )}
          </div>

          {/* Password Requirements */}
          <div
            className={`p-4 rounded-lg text-sm ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            <p
              className={`font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Password Requirements:
            </p>
            <ul
              className={`space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              <li className={password?.length >= 8 ? 'text-green-500' : ''}>
                {password?.length >= 8 ? '✓' : '○'} At least 8 characters
              </li>
              <li className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
                {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
              </li>
              <li className={/[a-z]/.test(password) ? 'text-green-500' : ''}>
                {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
              </li>
              <li className={/[0-9]/.test(password) ? 'text-green-500' : ''}>
                {/[0-9]/.test(password) ? '✓' : '○'} One number
              </li>
              <li className={/[!@#$%^&*]/.test(password) ? 'text-green-500' : ''}>
                {/[!@#$%^&*]/.test(password) ? '✓' : '○'} One special character (!@#$%^&*)
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className={`w-full py-2 px-4 rounded-lg font-medium transition ${
              isLoading || !password || !confirmPassword
                ? isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span
                  className={`w-4 h-4 rounded-full border-2 border-transparent mr-2 animate-spin ${
                    isDark
                      ? 'border-t-blue-300'
                      : 'border-t-white'
                  }`}
                ></span>
                Resetting Password...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          className={`text-center text-sm mt-6 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Remember your password?{' '}
          <a
            href="/login"
            className={`font-medium transition ${
              isDark
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}