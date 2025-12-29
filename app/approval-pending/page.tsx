'use client';

import React, { useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useApprovalStatus } from '@/hooks/useApprovalStatus';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

export default function ApprovalPendingPage() {
  const router = useRouter();
  const { userGroupId, isApproved, isLoading } = useApprovalStatus();

  // ===== HANDLERS =====
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("shopCart");
    const cartKey = `shopCart_${localStorage.getItem("user_id")}`;
    localStorage.removeItem(cartKey);
    Cookies.remove("access_token", { path: "/" });
    Cookies.remove("user_id", { path: "/" });
    Cookies.remove("user_group_id", { path: "/" });
    Cookies.remove("page_id", { path: "/" });
    Cookies.remove("vanity_url", { path: "/" });
    Cookies.remove("type_id", { path: "/" });
    router.push("/");
  };

  // Redirect if user is approved (group ID changed)
  useEffect(() => {
    if (!isLoading && isApproved) {
      router.push('/home');
    }
  }, [isApproved, isLoading, router]);
	
	useEffect(() => {
		const interval = setInterval(async () => {
		const response = await fetch('/api/user/approval-status');
		const data = await response.json();
		if (data.data.user_group_id !== '2'){
			router.push('/dashboard');
			toast.success('Successfully Approved!', {
			  position: 'bottom-center',
			  autoClose: 3000,
			});
		}
		}, 60000); // Every 10 seconds

		return () => clearInterval(interval);
	}, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Account Under Review
          </h1>

          {/* Subtitle */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Your account is awaiting admin approval
          </p>

          {/* Message Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  We're reviewing your dispensary information. This typically takes 24-48 hours. 
                  You'll be notified via email once your account is approved.
                </p>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Pending Review
                </span>
              </span>
            </div>

            {userGroupId && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Account Type</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Dispensary
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <p className="text-xs text-green-900 dark:text-green-300">
              <strong>What's next?</strong> An administrator will review your application and either 
              approve or request additional information. You'll receive an email notification either way.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Have questions?{' '}
              <a
                href="mailto:support@natureshigh.com"
                className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
              >
                Contact support
              </a>
            </p>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't refresh this page manually - you'll be notified when approved
          </p>
        </div>
      </div>
    </div>
  );
}