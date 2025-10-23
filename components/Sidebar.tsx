"use client";

import React, { useState } from "react";
import {
  Home,
  Megaphone,
  Folder,
  Package,
  CreditCard,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// 1. SidebarProps Interface (Correct)
interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

// 2. MenuItem Interface (Consolidated and Correct)
interface MenuItem {
  id: string; 
  label: string;
  icon?: React.ElementType; // Made optional since submenu items don't have one
  path?: string; // Made optional since parent items might not have a direct path
  submenu?: MenuItem[]; 
}


export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) { // <-- FIX 1: SidebarProps applied
  
  // 3. ExpandedMenusState Type Definition for Index Signature (Correct)
  type ExpandedMenusState = {
    [key: string]: boolean;
  };

  const [expandedMenus, setExpandedMenus] = useState<ExpandedMenusState>({}); // <-- FIX 3: State type applied
  
  // 4. PopoutMenu State Type (Correct)
  const [popoutMenu, setPopoutMenu] = useState<MenuItem | null>(null); // <-- FIX 4: Union type applied
  const router = useRouter();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [ // Added type assertion for clarity
    { id: "dashboard", icon: Home, label: "Overview", path: "/dashboard" },
    { id: "inventory", icon: Home, label: "Products", path: "/inventory" },
    {
      id: "marketplace",
      icon: Megaphone,
      label: "Marketplace",
      path: "", // Added to satisfy MenuItem interface but optional is better
      submenu: [
        { id: "place_order", label: "Place Order", path: "/campaigns" },
        { id: "product_catalog", label: "Product Catalog", path: "/campaigns/create" },
        { id: "order_history", label: "Order History", path: "/campaigns/analytics" },
      ],
    },
	{ id: "open_orders", icon: Home, label: "Open Orders", path: "/orders" },
	{ id: "reports", icon: Home, label: "Reports", path: "/reports" },
	{ id: "documents", icon: Home, label: "Documents", path: "/documents" },
	{ id: "samples", icon: Home, label: "Samples", path: "/sample_orders" },
    {
      id: "metrc",
      icon: Folder,
      label: "Metrc",
      path: "", // Added to satisfy MenuItem interface but optional is better
      submenu: [
        { id: "interface", label: "Interface", path: "/projects" },
        { id: "sync", label: "Sync", path: "/projects/archived" },
      ],
    },
    { id: "customers", icon: Package, label: "Customers", path: "/customers" },
    { id: "crm", icon: CreditCard, label: "Crm", path: "/crm" },
    {
      id: "settings",
      icon: Users,
      label: "Settings",
      path: "", // Added to satisfy MenuItem interface but optional is better
      submenu: [
        { id: "profile", label: "Members", path: "/settings/profile" },
        { id: "user_permission", label: "User Permission", path: "/settings/user-permission" },
        { id: "notification", label: "Notification", path: "/settings/notification" },
        { id: "settings_marketplace", label: "Marketplace", path: "/settings/marketplace" },
        { id: "product_categories", label: "Product Categories", path: "/settings/product-categories" },
      ],
    },
  ];

  const toggleSubmenu = (id: string) => { // <-- FIX 2: id type applied
    if (!isCollapsed) {
      setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const handleMenuClick = (item: MenuItem) => { // <-- FIX 5: item type applied
    if (item.submenu) {
      if (isCollapsed) {
        setPopoutMenu(item);
      } else {
        toggleSubmenu(item.id);
      }
    } else if (item.path) {
      router.push(item.path);
      if (window.innerWidth < 768) setIsMobileOpen(false);
    }
  };

  const handleSubmenuClick = (subitem: MenuItem) => { // <-- FIX 6: subitem type applied
    router.push(subitem.path as string); // Added type assertion for safety since path is optional
    setPopoutMenu(null);
    if (window.innerWidth < 768) setIsMobileOpen(false);
  };

  const isActive = (path: string) => pathname === path;
  const isParentActive = (submenu: MenuItem[] | undefined) =>
    submenu?.some((sub) => pathname.startsWith(sub.path as string)); // Added type assertion for safety since path is optional

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isCollapsed ? "w-24" : "w-64"
        } bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col py-4 transition-all duration-300 ease-in-out fixed md:relative h-full z-50 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="px-4 mb-4 flex items-center justify-between">
          <div
            className={`flex items-center space-x-3 ${
              isCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <Link href="/home">
				<div className="flex items-center gap-2">
					<img
					src="/images/natures-high-logo.png"
					alt="Nature's High"
					className="h-9 w-9 rounded-full object-cover shadow-md"
					/>
					
				</div>
			</Link>
            {!isCollapsed && (
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg whitespace-nowrap">
                Nature's High
              </span>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors md:block hidden"
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
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
            const isItemActive =
              isActive(item.path || '') || activeParent || pathname.startsWith(item.path || ''); // Added checks for optional path

            return (
              <div key={item.id}>
                <button
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

                {/* Submenu when expanded */}
                {!isCollapsed && item.submenu && expandedMenus[item.id] && (
                  <div className="ml-12 mt-1 space-y-1">
                    {item.submenu.map((subitem) => (
                      <button
                        key={subitem.id}
                        onClick={() => handleSubmenuClick(subitem)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive(subitem.path || '') // Added check for optional path
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

      <AnimatePresence>
  {popoutMenu && (
    <motion.div
      initial={{ x: isCollapsed ? 24 : 64, opacity: 0 }}
      animate={{ x: isCollapsed ? 64 : 256, opacity: 1 }}
      exit={{ x: isCollapsed ? 24 : 64, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl z-50 p-4 flex flex-col"
      style={{
        marginLeft: isCollapsed ? "2rem" : "16rem",
      }}
      onMouseLeave={() => setPopoutMenu(null)} // ✅ hide on mouse out
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {popoutMenu.label}
        </h3>
      </div>

      <div className="space-y-2">
        {popoutMenu.submenu && popoutMenu.submenu.map((subitem) => ( // Added check for submenu existence
          <button
            key={subitem.id}
            onClick={() => handleSubmenuClick(subitem)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
              isActive(subitem.path || '') // Added check for optional path
                ? "accent-bg text-white shadow-md"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {subitem.label}
          </button>
        ))}
      </div>
    </motion.div>
  )}
</AnimatePresence>


    </>
  );
}