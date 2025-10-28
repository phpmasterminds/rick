'use client';

import React, { useEffect, useState } from "react";
import { Menu, Bell, User, Settings, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";

interface TopBarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function TopBar({ isMobileOpen, setIsMobileOpen }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [fullname, setFullname] = useState<string | null>(null);
  const [initials, setInitials] = useState("U"); 

	const router = useRouter();
	
	useEffect(() => {
		// ✅ Fetch and parse saved user info
		const userData = localStorage.getItem("user");

		if (userData) {
		  try {
			const user = JSON.parse(userData);
			setFullname(user.data.full_name || null);
			setEmail(user.data.email || null);
			
			if (user.data.full_name.trim() !== "") {
			  // ✅ Split name and take first letters of first + last name
			  const nameParts = user.data.full_name.trim().split(" ");
			  const firstInitial = nameParts[0]?.[0] || "";
			  const secondInitial = nameParts.length > 1 ? nameParts[1]?.[0] : nameParts[0]?.[1] || "";
			  setInitials((firstInitial + secondInitial).toUpperCase());
			}
		  } catch (err) {
			console.error("Invalid user data in localStorage:", err);
		  }
		}
	 }, []);
	  
  return (
    <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 transition-colors duration-300">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center space-x-2">
          <Link href="/home">
			<div className="flex items-center gap-2">
				<img
				src="/images/natures-high-logo.png"
				alt="Nature's High"
				className="h-9 w-9 rounded-full object-cover shadow-md"
				/>
				<span className="font-semibold">Nature's High</span>
			</div>
		</Link>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 relative"
          >
            <Bell size={18} className="text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
              <h3 className="font-semibold mb-3">Notifications</h3>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm">Campaign "Summer Sale" is performing well! 🎉</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm">New team member joined your workspace.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300"
          >
            <span className="text-white font-semibold text-sm">{initials}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-sm">{fullname}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <User size={18} />
                <span className="text-sm font-medium">Profile</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Settings size={18} />
                <span className="text-sm font-medium">Settings</span>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

              <button
                onClick={() => {
					localStorage.removeItem('token');
					localStorage.removeItem('user');
					Cookies.remove("access_token", { path: "/" });
Cookies.remove("user_id", { path: "/" });

					router.push('/');
                }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left text-red-600 dark:text-red-400"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
