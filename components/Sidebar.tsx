"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Home,
  Megaphone,
  Folder,
  Package,
  CreditCard,
  Users,
  Settings,
  FileText,
  BarChart,
  ClipboardList,
  Store,
  ShoppingBag,
  FileSpreadsheet,
  Building,
  Box,
  Layers,
  ChevronDown,
  ChevronRight,
  Menu,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { toast } from 'react-toastify';

// Sidebar Props
interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

// Menu Item Type
interface MenuItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  path?: string;
  submenu?: MenuItem[];
}

// Business data type from API
interface BusinessData {
  type_id: string;
  vanity_url: string;
  title: string;
  image_path?: string;
  [key: string]: any;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const [popoutMenu, setPopoutMenu] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

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
        toast.error("Failed to load business data");
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

  // Build final path helper - only prepend vanityUrl if it exists
  const buildPath = useCallback(
    (basePath: string) => {
      return vanityUrl ? `/${vanityUrl}${basePath}` : basePath;
    },
    [vanityUrl]
  );

  // Load menu items based on type_id from API
  useEffect(() => {
    if (!isHydrated) return;

    const items: MenuItem[] =
      typeId === "36"
        ? [
            { id: "dashboard", icon: Home, label: "Overview", path: "/dashboard" },
            { id: "inventory", icon: Package, label: "Products", path: "/inventory" },
            {
              id: "marketplace",
              icon: Megaphone,
              label: "Marketplace",
              submenu: [
                { id: "place_order", label: "Place Order", path: "/wholesaleorder" },
                { id: "product_catalog", label: "Product Catalog", path: "/catalog" },
                { id: "order_history", label: "Order History", path: "/order-list" },
              ],
            },
            { id: "open_orders", icon: ClipboardList, label: "Open Orders", path: "/order-list" },
            { id: "reports", icon: BarChart, label: "Reports", path: "/reports" },
            { id: "documents", icon: FileText, label: "Documents", path: "/documents" },
            { id: "samples", icon: ShoppingBag, label: "Samples", path: "/sample-orders" },
            {
              id: "metrc",
              icon: Folder,
              label: "Metrc",
              submenu: [
                { id: "interface", label: "Interface", path: "/projects" },
                { id: "sync", label: "Sync", path: "/projects/archived" },
              ],
            },
            { id: "customers", icon: Users, label: "Customers", path: "/customers" },
            { id: "crm", icon: CreditCard, label: "CRM", path: "/crm" },
            {
              id: "settings",
              icon: Settings,
              label: "Settings",
              submenu: [
                { id: "profile", label: "Members", path: "/settings/profile" },
                { id: "user_permission", label: "User Permission", path: "/settings/user-permission" },
                { id: "notification", label: "Notification", path: "/settings/notification" },
                { id: "settings_marketplace", label: "Marketplace", path: "/settings/marketplace" },
                { id: "product_categories", label: "Product Categories", path: "/settings/product-categories" },
              ],
            },
          ]
        : typeId === "20"
        ? [
            { id: "dashboard", icon: Home, label: "Overview", path: "/dashboard" },
            { id: "register", icon: FileSpreadsheet, label: "Register", path: "/register" },
            { id: "dispensary-floor", icon: Store, label: "Dispensary Floor", path: "/dispensary-floor" },
            { id: "transactions", icon: CreditCard, label: "Transactions", path: "/transactions" },
            { id: "inventory", icon: Box, label: "Inventory", path: "/posinventory" },
            { id: "deals", icon: Megaphone, label: "Deals", path: "/deals" },
            { id: "customers", icon: Users, label: "Customers", path: "/customers" },
            { id: "vendors", icon: Building, label: "Vendors", path: "/vendors" },
            { id: "vendors-po", icon: Layers, label: "Vendor PO's", path: "/vendors-po" },
            { id: "metrc", icon: Folder, label: "Metrc", path: "/metrc" },
            { id: "metrc-audit", icon: ClipboardList, label: "Metrc Audit", path: "/metrc-audit" },
            { id: "reports", icon: BarChart, label: "Reports", path: "/reports" },
            { id: "documents", icon: FileText, label: "Documents", path: "/documents" },
          ]
        : [
            { id: "dashboard", icon: Home, label: "Dashboard", path: "/dashboard" },
            { id: "buy", icon: ShoppingBag, label: "Buy", path: "/buy" },
            { id: "orders", icon: ClipboardList, label: "Orders", path: "/orders" },
            { id: "reports", icon: BarChart, label: "Reports", path: "/reports" },
            {
              id: "settings",
              icon: Settings,
              label: "Settings",
              submenu: [
                { id: "profile", label: "Profile", path: "/settings/profile" },
                { id: "notification", label: "Notification", path: "/settings/notification" },
              ],
            },
          ];

    setMenuItems(items);
  }, [typeId, isHydrated]);

  const toggleSubmenu = useCallback((id: string) => {
    if (!isCollapsed) {
      setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  }, [isCollapsed]);

  // Check if a path is currently active
  const isActive = useCallback(
    (path: string) => {
      return pathname === buildPath(path);
    },
    [pathname, buildPath]
  );

  // Check if parent menu has any active children
  const isParentActive = useCallback(
    (submenu: MenuItem[] | undefined) => {
      return submenu?.some((sub) => pathname.startsWith(buildPath(sub.path || "")));
    },
    [pathname, buildPath]
  );

  const handleMenuClick = useCallback(
    (item: MenuItem) => {
      if (item.submenu) {
        if (isCollapsed) setPopoutMenu(item);
        else toggleSubmenu(item.id);
      } else if (item.path) {
        const finalPath = buildPath(item.path);
        router.push(finalPath);
        if (window.innerWidth < 768) setIsMobileOpen(false);
      }
    },
    [isCollapsed, toggleSubmenu, buildPath, router, setIsMobileOpen]
  );

  const handleSubmenuClick = useCallback(
    (subitem: MenuItem) => {
      const finalPath = buildPath(subitem.path || "");
      router.push(finalPath);
      setPopoutMenu(null);
      if (window.innerWidth < 768) setIsMobileOpen(false);
    },
    [buildPath, router, setIsMobileOpen]
  );

  // Don't render until hydrated to prevent mismatch
  if (!isHydrated || loading) {
    return (
      <div
        className={`${
          isCollapsed ? "w-24" : "w-64"
        } bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col py-4 transition-all duration-300 ease-in-out fixed md:relative h-full z-50`}
      >
        {/* Loading skeleton */}
        <div className="px-4 mb-4 flex items-center space-x-3">
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          {!isCollapsed && (
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  // Get business title for logo label
  const businessTitle = businessData?.title || "Nature's High";
  const businessLogo = businessData?.image_path || "/images/natures-high-logo.png";

  return (
    <div
      className={`${
        isCollapsed ? "w-24" : "w-64"
      } bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col py-4 transition-all duration-300 ease-in-out fixed md:relative h-full z-50 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Header */}
      <div className="px-4 mb-4 flex items-center justify-between">
        <div className={`flex items-center space-x-3 ${isCollapsed ? "justify-center w-full" : ""}`}>
          <Link href="/home">
            <div className="flex items-center gap-2">
              <img
                src={businessLogo}
                alt={businessTitle}
                className="h-9 w-9 rounded-full object-cover shadow-md"
              />
            </div>
          </Link>
          {!isCollapsed && (
            <span
              className="font-semibold text-gray-900 dark:text-gray-100 text-lg whitespace-nowrap truncate"
              title={businessTitle}
            >
              {businessTitle}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors md:block hidden"
          >
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="mx-3 mb-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors hidden md:flex justify-center"
        >
          <Menu size={18} className="text-gray-500" />
        </button>
      )}

      {/* Menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const activeParent = isParentActive(item.submenu);
          const isItemActive = isActive(item.path || "") || activeParent;

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isCollapsed ? "justify-center" : "justify-start"
                }`}
                title={isCollapsed ? item.label : ""}
              >
                {item.icon && (
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                      isItemActive
                        ? "accent-bg text-white shadow-md scale-105"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-accent/10 hover:text-accent"
                    }`}
                  >
                    <item.icon size={20} />
                  </div>
                )}

                {!isCollapsed && (
                  <span
                    className={`font-medium whitespace-nowrap transition-all duration-200 ${
                      isItemActive
                        ? "text-accent font-semibold"
                        : "text-gray-700 dark:text-gray-300 hover:text-accent"
                    }`}
                  >
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.submenu && (
                  <ChevronDown
                    size={16}
                    className={`ml-auto transition-transform duration-200 ${
                      expandedMenus[item.id] ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Submenu */}
              {!isCollapsed && item.submenu && expandedMenus[item.id] && (
                <div className="ml-12 mt-1 space-y-1">
                  {item.submenu.map((subitem) => (
                    <button
                      type="button"
                      key={subitem.id}
                      onClick={() => handleSubmenuClick(subitem)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive(subitem.path || "")
                          ? "accent-bg text-white shadow-md"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {subitem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}