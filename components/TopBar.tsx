'use client';

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Menu, Bell, User, Settings, LogOut, ShoppingCart, X, Trash2, ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import axios from "axios";
import { useShopCart } from "@/app/contexts/ShopCartContext";

interface TopBarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface GroupedItems {
  [business: string]: any[];
}

// Business data type from API
interface BusinessData {
  type_id: string;
  vanity_url: string;
  title: string;
  image_path?: string;
  [key: string]: any;
}

export default function TopBar({ isMobileOpen, setIsMobileOpen }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [fullname, setFullname] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  
  // ⭐ Get cart methods from context
  const { 
    cartItems = [], 
    removeFromCart, 
    updateCartItemQuantity,
    getCartTotal,
    getCartItemsCount 
  } = useShopCart();

  const cartItemsCount = getCartItemsCount?.() || 0;
  const cartTotal = getCartTotal?.() || 0;

  // Extract vanity URL from pathname
  const getVanityUrl = useCallback(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    // All possible app routes that are NOT business vanity URLs
    const knownRoutes = [
      "dashboard",
      "login",
      "register",
      "home",
      "auth",
      "shop",
      "buy",
      "orders",
      "reports",
      "settings",
      "dispensary-floor",
      "customers",
      "vendors",
      "deals",
      "inventory",
      "posinventory",
      "wholesaleorder",
      "catalog",
      "order-list",
      "documents",
      "sample-orders",
      "projects",
      "crm",
      "metrc",
      "metrc-audit",
      "register",
      "transactions",
      "vendors-po",
      "cart",
    ];
    const pathVanityUrl =
      pathSegments[0] && !knownRoutes.includes(pathSegments[0])
        ? pathSegments[0]
        : null;
    return pathVanityUrl || null;
  }, [pathname]);

  // Memoize vanity URL
  const vanityUrl = useMemo(() => getVanityUrl(), [getVanityUrl]);

  // Fetch business data only when business changes
  useEffect(() => {
    const fetchBusinessData = async () => {
      // Only fetch if vanity URL exists and is different from current business
      if (!vanityUrl || vanityUrl === currentBusiness) {
        if (!businessData && vanityUrl) {
          // If no data and vanity URL exists, still need to fetch
          setLoading(true);
        } else {
          setIsHydrated(true);
          return;
        }
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/business?business=${vanityUrl}`);
        
        if (response.data?.data) {
          setBusinessData(response.data.data);
          setCurrentBusiness(vanityUrl);
        }
      } catch (error) {
        console.error("Failed to fetch business data:", error);
        // Fallback: set hydrated even on error to show UI
      } finally {
        setLoading(false);
        setIsHydrated(true);
      }
    };

    fetchBusinessData();
  }, [vanityUrl, currentBusiness, businessData]);

  // Get type_id from API response, fallback to cookie if needed
  const typeId = useMemo(() => {
    return businessData?.type_id || null;
  }, [businessData]);

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setFullname(user.data.full_name || null);
        setEmail(user.data.email || null);

        if (user.data.full_name?.trim() !== "") {
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("shopCart");
    Cookies.remove("access_token", { path: "/" });
    Cookies.remove("user_id", { path: "/" });
    Cookies.remove("page_id", { path: "/" });
    Cookies.remove("vanity_url", { path: "/" });
    Cookies.remove("type_id", { path: "/" });
    router.push("/");
  };

  // ⭐ Group items by business
  console.log(cartItems);
  const groupedItems: GroupedItems = cartItems.reduce((acc, item) => {
    const business = item.business || "Nature's High";
    if (!acc[business]) {
      acc[business] = [];
    }
    acc[business].push(item);
    return acc;
  }, {} as GroupedItems);

  const handleRemoveItem = (cartItemId: string) => {
    removeFromCart?.(cartItemId);
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    updateCartItemQuantity?.(cartItemId, newQuantity);
  };

  // Don't render until hydrated to prevent mismatch
  if (!isHydrated || loading) {
    return (
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 transition-colors duration-300">
        <div className="flex items-center space-x-4">
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 transition-colors duration-300">
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

      <div className="flex items-center space-x-3">
        {/* ⭐ CART ICON - ALWAYS SHOWN (regardless of typeId) */}
        <button
          onClick={() => {
            setShowCartDrawer(!showCartDrawer);
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
          className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
        >
          <ShoppingCart size={18} className="text-gray-600 dark:text-gray-300" />
          {cartItemsCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {cartItemsCount > 99 ? "99+" : cartItemsCount}
            </span>
          )}
        </button>

        {/* ⭐ NOTIFICATIONS - ALWAYS VISIBLE FOR ALL SECTIONS */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
              setShowCartDrawer(false);
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

        {/* ⭐ USER MENU - ALWAYS VISIBLE FOR ALL SECTIONS */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
              setShowCartDrawer(false);
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
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left text-red-600 dark:text-red-400"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ⭐ CART DRAWER WITH BUSINESS GROUPING */}
      {showCartDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setShowCartDrawer(false)}
          />

          {/* Cart Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items by Business */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {Object.keys(groupedItems).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <ShoppingCart size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Your cart is empty</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add items to get started</p>
                </div>
              ) : (
                Object.entries(groupedItems).map(([business, items]) => (
                  <div key={business} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    {/* Business Header */}
                    <h3 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">
                      {business}
                    </h3>

                    {/* Items from this business */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          {/* Product Image */}
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          )}

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-white">
                              {item.productName}
                            </h4>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                              ${(item.price || 0).toFixed(2)}
                            </p>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.cartItemId, (item.quantity || 0) - 1)}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={item.quantity || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val)) handleUpdateQuantity(item.cartItemId, val);
                                }}
                                className="w-10 h-6 text-center border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700"
                              />
                              <button
                                onClick={() => handleUpdateQuantity(item.cartItemId, (item.quantity || 0) + 1)}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.cartItemId)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Business Subtotal */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Subtotal:</span>
                        <span>
                          ${items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer - Total & Checkout */}
            {Object.keys(groupedItems).length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 md:p-6 space-y-3">
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCartDrawer(false);
                    router.push("/cart");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Review & Checkout
                </button>

                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 rounded-lg transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}