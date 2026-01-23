'use client';

import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import SellerDashboard from './components/SellerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import { useTheme } from 'next-themes';
import Cookies from "js-cookie";
import { toast } from "react-toastify";

type UserType = 'admin' | 'seller' | 'buyer' | null;

export default function DashboardPage() {
  const { theme } = useTheme();
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const toastData = sessionStorage.getItem("toast");

		if (toastData) {
		  const { type, message } = JSON.parse(toastData);

		  if (type === "success") {
			toast.success(message, {
			  position: "bottom-center",
			  autoClose: 3000,
			});
		  }

		  sessionStorage.removeItem("toast"); // 🔥 important
		}
	}, []);
	  
  useEffect(() => {
    determineUserType();
  }, []);

  const determineUserType = async () => {
    try {
      setLoading(true);

      // Get user info from localStorage
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        setError('User information not found');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userJson);
      const userGroupId = parseInt(user.data.user_group_id, 10);
      // Check if admin (user_group_id is 1)
      if (userGroupId === 1) {
        setUserType('admin');
        setLoading(false);
        return;
      }

      // Get type_id from localStorage (cookie equivalent)
      const typeId = Cookies.get("type_id");

      // Check if buyer (type_id is 20)
      if (typeId === '20') {
        setUserType('buyer');
      } else {
        // Default to seller for all other cases
        setUserType('seller');
      }
    } catch (err) {
      console.error('Error determining user type:', err);
      setError('Failed to determine user type');
      // Default to seller on error
      setUserType('seller');
    } finally {
      setLoading(false);
    }
  };
console.log(userType+'---');
  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              determineUserType();
            }}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {userType === 'admin' && <AdminDashboard />}
      {userType === 'seller' && <SellerDashboard />}
      {userType === 'buyer' && <BuyerDashboard />}
    </>
  );
}