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
  PackageCheck,
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
  FileCheck,
  Receipt,
  ArrowLeft,
  Shield,
  ShoppingCart,
  Briefcase,
  LogOut,
  Eye,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { toast } from 'react-toastify';
import { useBusinessData } from "../app/contexts/BusinessContext";
import Cookies from "js-cookie";
import { useThemeContext } from "@/components/ThemeProvider";

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

// User data type from localStorage
interface UserData {
  user_group_id: number;
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
  const [typeId, setTypeId] = useState<string | null>(null);
  const [userGroupId, setUserGroupId] = useState<string | null>(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false); // Toggle for admin to switch between menus
  const [selectedSection, setSelectedSection] = useState<"business" | "pos">("business"); // Track selected section
  const [showSectionDropdown, setShowSectionDropdown] = useState(false); // Toggle section dropdown
  const [currentMode, setCurrentMode] = useState<"admin" | "marketplace" | "business" | "pos">("marketplace"); // Current mode selector
  const [showModeDropdown, setShowModeDropdown] = useState(false); // Toggle mode dropdown
  const [showBusinessOption, setShowBusinessOption] = useState(true); // Show/hide Business option
  const [showPosOption, setShowPosOption] = useState(true); // Show/hide POS option
  const [showMarketplaceOption, setShowMarketplaceOption] = useState(true); // Show/hide Marketplace option
  const router = useRouter();
  const pathname = usePathname();
  
  // Get context to share business data with other components
  const { setBusinessData: setContextBusinessData } = useBusinessData();

  // Check business_variants localStorage and set dropdown option visibility
  const checkVariantsVisibility = useCallback(() => {
    try {
      const businessVariantsStr = localStorage.getItem("business_variants");
      
      if (!businessVariantsStr) {
        // Default: show all options if no variants
        setShowBusinessOption(true);
        setShowPosOption(true);
        setShowMarketplaceOption(true);
        return;
      }

      const variants = JSON.parse(businessVariantsStr);
      
      if (!Array.isArray(variants)) {
        setShowBusinessOption(true);
        setShowPosOption(true);
        setShowMarketplaceOption(true);
        return;
      }

      // Initialize visibility flags
      let businessVisible = false;
      let posVisible = false;
      let marketplaceVisible = false;

      // Check each variant
      variants.forEach((variant: any) => {
        const moduleId = variant?.module_id?.toLowerCase();
        const variantName = variant?.variant_name?.toLowerCase();

	  
        // Brand Marketplace - Controls Business option
        if (moduleId === "brands_marketplace") {
          if (variantName === "without business page") {
			marketplaceVisible = true;
            businessVisible = false;
            posVisible = false;
          } else if (variantName === "with business page") {
			marketplaceVisible = true;
            businessVisible = true;
			posVisible = false;
          }
        }

        // POS - Controls POS option
        if (moduleId === "pos") {
          if (variantName === "without business page") {
			marketplaceVisible = false;
            posVisible = true;
			businessVisible = false;
          } else if (variantName === "with business page") {
            marketplaceVisible = true;
			posVisible = true;
			businessVisible = true;
          }
        }

        // Business Page - Controls Marketplace option
        if (moduleId === "business_page") {
          if (variantName === "without inventory") {
            marketplaceVisible = false;
			businessVisible = true;
			posVisible = false;
          } else if (variantName === "with inventory") {
            marketplaceVisible = true;
			businessVisible = true;
			posVisible = false;
          }
        }
      });
      // Set visibility states
      setShowBusinessOption(businessVisible);
      setShowPosOption(posVisible);
      setShowMarketplaceOption(marketplaceVisible);
    } catch (error) {
      console.error("Error checking business_variants:", error);
      // Default: show all options on error
      setShowBusinessOption(true);
      setShowPosOption(true);
      setShowMarketplaceOption(true);
    }
  }, []);

  // Extract vanity URL from pathname (first segment)
  const getVanityUrlFromPath = useCallback(() => {
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
	  "cart",
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
      "invoice",
      "admin",
      "pos",
	  "preview-catalog",
	  "preview-business",
	  "place-order",
	  "new-orders",
	  "production-packing",
	  "order-history",
	  "buy-again",
	  "open-orders",
	  "messages"
    ];
    
    // First segment that is not a known route is the vanity URL
    const pathVanityUrl =
      pathSegments[0] && !knownRoutes.includes(pathSegments[0])
        ? pathSegments[0]
        : null;
    return pathVanityUrl || null;
  }, [pathname]);

  // Memoize vanity URL from path
  const vanityUrl = useMemo(() => getVanityUrlFromPath(), [getVanityUrlFromPath]);

  // Check if user is admin
  const isAdmin = useMemo(() => userGroupId === '1', [userGroupId]);

  // Check if we're on a business vanity URL
  const isOnBusinessPage = useMemo(() => !!vanityUrl, [vanityUrl]);

  // Get user_group_id from localStorage
  const getUserGroupIdFromLocalStorage = useCallback(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData: UserData = JSON.parse(userStr);
        return userData.data?.user_group_id?.toString() || null;
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
    return null;
  }, []);

  // Initialize user_group_id on mount
  useEffect(() => {
    const localStorageUserGroupId = getUserGroupIdFromLocalStorage();
    setUserGroupId(localStorageUserGroupId);
    setIsHydrated(true);
    
    // Check variants visibility on mount
    checkVariantsVisibility();
  }, [getUserGroupIdFromLocalStorage, checkVariantsVisibility]);

  // Fetch business data using vanity URL from path
  useEffect(() => {
    const fetchBusinessData = async () => {
      // If no vanity URL in path, load from cookies
      if (!vanityUrl) {
        const vanityUrlFromCookie = Cookies.get("vanity_url");
        //const businessTitleFromCookie = Cookies.get("business_title");
        const businessLogoFromCookie = Cookies.get("business_logo");
		
		const tradeName = Cookies.get("trade_name");
		const businessTitle = Cookies.get("business_title");

		const businessTitleFromCookie =
									  tradeName &&
									  tradeName !== "null" &&
									  tradeName !== "undefined" &&
									  tradeName.trim() !== ""
										? tradeName.trim()
										: businessTitle;


        // Set business data from cookies if available
        if (!isAdmin && (vanityUrlFromCookie || businessTitleFromCookie)) {
          setBusinessData({
            type_id: Cookies.get("type_id") || "",
            vanity_url: vanityUrlFromCookie || "",
            title: businessTitleFromCookie || "Nature's High",
            image_path: businessLogoFromCookie || "/images/natures-high-logo.png",
          });
        } else {
          setBusinessData(null);
        }

        setTypeId(Cookies.get("type_id") || null);
        setCurrentBusiness(null);
        setIsHydrated(true);
        return;
      }

      // Skip if already fetched for this vanity URL
      if (currentBusiness === vanityUrl) {
        setIsHydrated(true);
        return;
      }

      try {
        setLoading(true);
        // Use vanity_url from path to fetch business data
        const response = await axios.get(`/api/business/?business=${vanityUrl}`);

        if (response.data?.data) {
			if(response.data?.error?.message === "Business not found"){
				router.replace(`/${vanityUrl}`);
			}

          const data = response.data.data;
          const fetchedTypeId = data.type_id?.toString() || null;
          
          setBusinessData({
            type_id: fetchedTypeId || "",
            vanity_url: data.vanity_url || vanityUrl || "",
            title: data.title || "Nature's High",
            image_path: data.image_path || "/images/natures-high-logo.png",
            ...data,
          });
          setCurrentBusiness(vanityUrl);
          setTypeId(fetchedTypeId);
          
          // Share with Context for other components (PageHeading, etc.)
          setContextBusinessData({
            type_id: fetchedTypeId || "",
            vanity_url: data.vanity_url || vanityUrl || "",
            title: data.title || "Nature's High",
            image_path: data.image_path || "/images/natures-high-logo.png",
            ...data,
          });
        }else {
          // No business found for this vanity URL
          setBusinessData(null);
          setTypeId(null);
          setCurrentBusiness(vanityUrl);
        }
      } catch (error) {
        console.error("Failed to fetch business data:", error);
        setBusinessData(null);
        setTypeId(null);
        setCurrentBusiness(vanityUrl);
        toast.error("Failed to load business data");
      } finally {
        setLoading(false);
        setIsHydrated(true);
      }
    };

    if (isHydrated) {
      fetchBusinessData();
    }
  }, [vanityUrl, isHydrated, currentBusiness, setContextBusinessData]);

  // Build final path helper - only prepend vanityUrl if it exists and not showing admin menu
  /*const buildPath = useCallback(
    (basePath: string) => {
      // If showing admin menu, don't prepend vanity URL
      if (showAdminMenu) {
        return basePath;
      }
      return vanityUrl ? `/${vanityUrl}${basePath}` : basePath;
    },
    [vanityUrl, showAdminMenu]
  );*/
  const buildPath = useCallback(
 
	  (basePath: string) => {
		// If showing admin menu, skip vanity URL prefix
		if (showAdminMenu) {
		  return basePath;
		}
		if(basePath === '/buy'){
			return basePath;
		}

		// If basePath already contains vanity URL, avoid double prefix
		if (vanityUrl && basePath.startsWith(`/${vanityUrl}/`)) {
		  return basePath;
		}

		// Prepend vanity URL
		return vanityUrl ? `/${vanityUrl}${basePath}` : basePath;
	  },
	  [vanityUrl, showAdminMenu]
	);


  // Get Admin Menu
  const getAdminMenu = useCallback((): MenuItem[] => {
    return [
      { id: "dashboard", icon: Home, label: "Overview", path: "/dashboard" },
      { id: "register_claim", icon: FileCheck, label: "Register/Claim", path: "/admin/registrations" },
      { id: "orders", icon: ClipboardList, label: "Orders", path: "/orders" },
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
  }, []);

  // ============ PROCESSOR MENUS ============
  // Get Processor POS Menu (when on /pos/dashboard)
  const getProcessorPosMenu = useCallback((): MenuItem[] => {
    return [
      // POS-specific menus
      { id: "pos-dashboard", icon: Home, label: "Overview", path: "/pos/dashboard" },
      { id: "pos-inventory", icon: Package, label: "Products", path: "/pos/inventory" },
      {
        id: "pos-marketplace",
        icon: Megaphone,
        label: "Marketplace",
        submenu: [
          { id: "pos-place_order", label: "Place Order", path: "/pos/wholesaleorder" },
          { id: "pos-product_catalog", label: "Product Catalog", path: "/pos/catalog" },
          { id: "pos-order_history", label: "Order History", path: "/pos/order-list?wholesale=1" },
        ],
      },
      { id: "pos-open_orders", icon: ClipboardList, label: "Open Orders", path: "/pos/order-list" },
      { id: "pos-reports", icon: BarChart, label: "Reports", path: "/pos/reports" },
      { id: "pos-documents", icon: FileText, label: "Documents", path: "/pos/documents" },
      { id: "pos-samples", icon: ShoppingBag, label: "Samples", path: "/pos/sample-orders" },
      {
        id: "pos-metrc",
        icon: Folder,
        label: "Metrc",
        submenu: [
          { id: "pos-interface", label: "Interface", path: "/pos/projects" },
          { id: "pos-sync", label: "Sync", path: "/pos/projects/archived" },
        ],
      },
      { id: "pos-customers", icon: Users, label: "Customers", path: "/pos/customers" },
      { id: "pos-crm", icon: CreditCard, label: "CRM", path: "/pos/crm" },
      {
        id: "pos-settings",
        icon: Settings,
        label: "Settings",
        submenu: [
          { id: "pos-profile", label: "Members", path: "/pos/settings/profile" },
          { id: "pos-user_permission", label: "User Permission", path: "/pos/settings/user-permission" },
          { id: "pos-notification", label: "Notification", path: "/pos/settings/notification" },
          { id: "pos-settings_marketplace", label: "Marketplace", path: "/pos/settings/marketplace" },
          { id: "pos-product_categories", label: "Product Categories", path: "/pos/settings/product-categories" },
        ],
      },
    ];
  }, []);

  // Get Processor Business Menu (main business page)
  const getProcessorBusinessMenu = useCallback((): MenuItem[] => {
	const vanityUrlFromCookie = Cookies.get("vanity_url");

	const finalVanityUrl = vanityUrl
	? vanityUrl        // use cookie if available
	: vanityUrlFromCookie;                 // else use state

    return [
      // Business menus - Based on UI Design
      { id: "dashboard", icon: Home, label: "Dashboard", path: `/${finalVanityUrl}/dashboard` },
      { id: "messages", icon: Megaphone, label: "Messages", path: `/${finalVanityUrl}/messages` },
      { id: "inventory", icon: Package, label: "Inventory", path: `/${finalVanityUrl}/inventory` },
      { id: "orders-received", icon: ClipboardList, label: "Orders Received", path: `/${finalVanityUrl}/orders-received` },
      { id: "metrc", icon: FileSpreadsheet, label: "Metrc", path: `/${finalVanityUrl}/metrc` },
      { id: "reports", icon: BarChart, label: "Reports", path: `/${finalVanityUrl}/reports` },
      { id: "preview", icon: Eye, label: "Preview", path: `/${finalVanityUrl}/preview` },
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        submenu: [
          { id: "company_information", label: "Company Information", path: `/${finalVanityUrl}/settings/company-information` },
          { id: "page_info", label: "Page Info", path: `/${finalVanityUrl}/settings/page-info` },
          { id: "metrc_api_setup", label: "Metrc API setup", path: `/${finalVanityUrl}/settings/metrc-api-setup` },
          { id: "users_permissions", label: "Users& Permissions", path: `/${finalVanityUrl}/settings/users-permissions` },
          { id: "notifications", label: "Notifications", path: `/${finalVanityUrl}/settings/notifications` },
          { id: "licenses", label: "Licenses", path: `/${finalVanityUrl}/settings/licenses` }
        ],
      },
    ];
  }, []);

  // Get Processor General Menu (for general sellers - no business context)
  const getProcessorGeneralMenu = useCallback((): MenuItem[] => {
    return [
      // General seller menus
      { id: "dashboard", icon: Home, label: "Dashboard", path: "/dashboard" },
	  { id: "messages", icon: Megaphone, label: "Messages", path: "/messages" },
	  { id: "customers", icon: Users, label: "My Customers", path: "/customers" },
	  {
        id: "orders",
        icon: ClipboardList,
        label: "Orders",
        submenu: [
          { id: "place-order", label: "Place Order", path: "/place-order" },/*icon: ShoppingCart,*/
		  { id: "new-orders", label: "New Orders", path: "/new-orders" },/*icon: ClipboardList,*/
		  { id: "production-packing", label: "Packaging", path: "/production-packing" },/*icon: PackageCheck,*/
		  { id: "order-history", label: "Order History", path: "/order-history" },      /*icon: FileText,*/
        ],
      },
	  {
        id: "catalog-inventory",
        icon: Package,
        label: "Catalog & Inventory",
        submenu: [
          { id: "inventory", label: "Inventory", path: "/inventory" },/*icon: Package,*/
		  { id: "promotion-discount", label: "Promotions and Discount", path: "/promotion-discount" },/*icon: CreditCard,*/
		  { id: "preview-catalog", label: "My Marketplace", path: "/preview-catalog" },      /*icon: Box,*/
        ],
      },
      { id: "metrc", icon: Folder, label: "Metrc", path: "/metrc" },
      { id: "reports", icon: BarChart, label: "Reports & Analytics", path: "/reports" },
      { id: "preview-business", icon: Briefcase, label: "My Public Page", path: "/preview-business" },
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        submenu: [
          { id: "company_profile", label: "Company Profile", path: "/settings/company-profile" },
          { id: "license_information", label: "License Information", path: "/settings/license-information" },
          { id: "users_permissions", label: "Users Permissions", path: "/settings/users-permissions" },
          { id: "business_info", label: "Business Info", path: "/settings/business-info" },
          { id: "payment-methods", label: "Payment Methods", path: "/settings/payment-methods" },
          { id: "notification", label: "Notifications", path: "/settings/notifications" },
          { id: "preferences", label: "Preferences", path: "/settings/preferences" }
        ],
      },
    ];
  }, []);

  // Get Processor Menu (type_id: 36) - Router function
  const getProcessorMenu = useCallback((): MenuItem[] => {
    const isOnPOS = pathname.includes("/pos/");
    const hasVanityUrl = vanityUrl || Cookies.get("vanity_url");
    
    // Three scenarios:
    if (isOnPOS) {
      return getProcessorPosMenu(); // /pos/* path
    } else if (hasVanityUrl) {
      return getProcessorBusinessMenu(); // /{vanity_url}/* path
    } else {
      return getProcessorGeneralMenu(); // General seller menu (no business context)
    }
  }, [pathname, vanityUrl, getProcessorPosMenu, getProcessorBusinessMenu, getProcessorGeneralMenu]);

  // ============ DISPENSARY MENUS ============
  // Get Dispensary POS Menu (when on /pos/dashboard)
  const getDispensaryPosMenu = useCallback((): MenuItem[] => {
    return [
      // POS-specific menus
	  { id: "pos-dashboard", icon: Home, label: "Overview", path: "/pos/dashboard" },
      { id: "pos-register", icon: FileSpreadsheet, label: "Register", path: "/pos/register" },
      { id: "pos-dispensary-floor", icon: Store, label: "Dispensary Floor", path: "/pos/dispensary-floor" },
      { id: "pos-transactions", icon: CreditCard, label: "Transactions", path: "/pos/transactions" },
      { id: "pos-inventory", icon: Box, label: "Inventory", path: "/pos/posinventory" },
      { id: "pos-vendors", icon: Building, label: "Vendors", path: "/pos/vendors" },
      { id: "pos-vendors-po", icon: Layers, label: "Vendor PO's", path: "/pos/vendors-po" },
      { id: "pos-metrc", icon: Folder, label: "Metrc", path: "/pos/metrc" },
      { id: "pos-metrc-audit", icon: ClipboardList, label: "Metrc Audit", path: "/pos/metrc-audit" },
      { id: "pos-reports", icon: BarChart, label: "Reports", path: "/pos/reports" },
      { id: "pos-documents", icon: FileText, label: "Documents", path: "/pos/documents" },
    ];
  }, []);

  // Get Dispensary Business Menu (main business page)
  const getDispensaryBusinessMenu = useCallback((): MenuItem[] => {
	const vanityUrlFromCookie = Cookies.get("vanity_url");

	const finalVanityUrl = vanityUrl
	? vanityUrl        // use cookie if available
	: vanityUrlFromCookie;                 // else use state
	return [
      // Business menus - Based on UI Design
      { id: "dashboard", icon: Home, label: "Dashboard", path: `/${finalVanityUrl}/dashboard` },
      { id: "messages", icon: Megaphone, label: "Messages", path: `/${finalVanityUrl}/messages` },
      { id: "inventory", icon: Package, label: "Inventory", path: `/${finalVanityUrl}/inventory` },
      { id: "orders-received", icon: ClipboardList, label: "Orders Received", path: `/${finalVanityUrl}/orders-received` },
      { id: "metrc", icon: FileSpreadsheet, label: "Metrc", path: `/${finalVanityUrl}/metrc` },
      { id: "reports", icon: BarChart, label: "Reports", path: `/${finalVanityUrl}/reports` },
      { id: "preview", icon: Eye, label: "Preview", path: `/${finalVanityUrl}/preview` },
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        submenu: [
          { id: "company_information", label: "Company Information", path: `/${finalVanityUrl}/settings/company-information` },
          { id: "page_info", label: "Page Info", path: `/${finalVanityUrl}/settings/page-info` },
          { id: "metrc_api_setup", label: "Metrc API setup", path: `/${finalVanityUrl}/settings/metrc-api-setup` },
          { id: "users_permissions", label: "Users& Permissions", path: `/${finalVanityUrl}/settings/users-permissions` },
          { id: "notifications", label: "Notifications", path: `/${finalVanityUrl}/settings/notifications` },
          { id: "licenses", label: "Licenses", path: `/${finalVanityUrl}/settings/licenses` }
        ],
      },
    ];
    /*return [
      // Business menus
      { id: "dashboard", icon: Home, label: "Overview", path: `/${finalVanityUrl}/dashboard` },
      { id: "messages", icon: Megaphone, label: "Messages", path: `/${finalVanityUrl}/message` },
      { id: "go-shopping", icon: Store, label: "Go Shopping", path: `/buy` },
      { id: "buy-again", icon: Store, label: "Buy Again", path: `/${finalVanityUrl}/buy-again` },
      { id: "open_orders", icon: ClipboardList, label: "Open Orders", path: `/${finalVanityUrl}/order-list` },
      { id: "order_history", icon: FileText, label: "Order History", path: `/${finalVanityUrl}/order-history` },
      { id: "vendors", icon: Building, label: "My Vendors", path: `/${finalVanityUrl}/vendors` },
      { id: "reports", icon: BarChart, label: "Reports", path: `/${finalVanityUrl}/reports` },
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        submenu: [
          { id: "company_profile", label: "Company Profile", path: `/${finalVanityUrl}/settings/company-profile` },
          { id: "metrc-api-setup", label: "Metrc Api Setup", path: `/${finalVanityUrl}/settings/metrc-api-setup` },
          { id: "user-permission", label: "User & Permission", path: `/${finalVanityUrl}/settings/user-permission` },
          { id: "notification", label: "Notification", path: `/${finalVanityUrl}/settings/notification` },
          { id: "licenses", label: "Licenses", path: `/${finalVanityUrl}/settings/licenses` }
        ],
      },
    ];*/
  }, []);

  // Get Dispensary General Menu (for general buyers - no business context)
  const getDispensaryGeneralMenu = useCallback((): MenuItem[] => {
	  return [
		  // Business menus
		  { id: "dashboard", icon: Home, label: "Overview", path: `/dashboard` },
		  { id: "messages", icon: Megaphone, label: "Messages", path: `/messages` },
		  { id: "go-shopping", icon: Store, label: "Go Shopping", path: `/buy` },
		  { id: "buy-again", icon: Store, label: "Buy Again", path: `/buy-again` },
		  { id: "open-orders", icon: ClipboardList, label: "Open Orders", path: `/open-orders` },
		  { id: "order_history", icon: FileText, label: "Order History", path: `/order-history` },
		  { id: "vendors", icon: Building, label: "My Vendors", path: `/vendors` },
		  { id: "reports", icon: BarChart, label: "Reports", path: `/reports` },
		  {
			id: "settings",
			icon: Settings,
			label: "Settings",
			submenu: [
			  { id: "company_profile", label: "Company Profile", path: `/settings/company-profile` },
			  { id: "metrc-api-setup", label: "Metrc Api Setup", path: `/settings/metrc-api-setup` },
			  { id: "user-permission", label: "User & Permission", path: `/settings/user-permission` },
			  { id: "notification", label: "Notification", path: `/settings/notification` },
			  { id: "licenses", label: "Licenses", path: `/settings/licenses` }
			],
		  },
		];
    /*return [
      // General buyer menus
      { id: "dashboard", icon: Home, label: "Dashboard", path: "/dashboard" },
      { id: "marketplace", icon: Store, label: "Marketplace", path: "/buy" },
      { id: "my-orders", icon: ClipboardList, label: "My Orders", path: "/orders" },
      { id: "order-history", icon: FileText, label: "Order History", path: "/order-history" },
      { id: "my-invoices", icon: Receipt, label: "My Invoices", path: "/invoices" },
      { id: "favorites", icon: ShoppingBag, label: "Favorites", path: "/favorites" },
      { id: "cart", icon: ShoppingCart, label: "Shopping Cart", path: "/cart" },
      { id: "reports", icon: BarChart, label: "Reports", path: "/reports" },
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        submenu: [
          { id: "profile", label: "My Profile", path: "/settings/profile" },
          { id: "address", label: "Addresses", path: "/settings/addresses" },
          { id: "payment-methods", label: "Payment Methods", path: "/settings/payment-methods" },
          { id: "notification", label: "Notifications", path: "/settings/notifications" },
          { id: "preferences", label: "Preferences", path: "/settings/preferences" }
        ],
      },
    ];*/
  }, []);

  // Get Dispensary Menu (type_id: 20) - Router function
  const getDispensaryMenu = useCallback((): MenuItem[] => {
    const isOnPOS = pathname.includes("/pos/");
    const hasVanityUrl = vanityUrl || Cookies.get("vanity_url");
    
    // Three scenarios:
    if (isOnPOS) {
      return getDispensaryPosMenu(); // /pos/* path
    } else if (hasVanityUrl) {
      return getDispensaryBusinessMenu(); // /{vanity_url}/* path
    } else {
      return getDispensaryGeneralMenu(); // General buyer menu (no business context)
    }
  }, [pathname, vanityUrl, getDispensaryPosMenu, getDispensaryBusinessMenu, getDispensaryGeneralMenu]);

  // Get Default/Customer Menu
  const getDefaultMenu = useCallback((): MenuItem[] => {
    return [
      { id: "dashboard", icon: Home, label: "Dashboard", path: "/dashboard" },
      { id: "buy", icon: ShoppingBag, label: "Buy", path: "/buy" },
      { id: "orders", icon: ClipboardList, label: "Orders", path: "/orders" },
      { id: "invoice", icon: Receipt, label: "Invoices", path: "/invoice" },
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
  }, []);

  // Auto-detect current mode based on pathname
  useEffect(() => {
    if (!isHydrated) return;

    if(isAdmin){
		setCurrentMode("admin");
	}else if (pathname.includes("/pos/")) {
      setCurrentMode("pos");
    } else if (isOnBusinessPage && vanityUrl) {
      setCurrentMode("business");
    } else {
      setCurrentMode("marketplace");
    }
  }, [pathname, isOnBusinessPage, vanityUrl, isHydrated]);

  // Load menu items based on currentMode and typeId
  useEffect(() => {
    if (!isHydrated) return;

    let items: MenuItem[] = [];
	
    // Admin mode - show admin menu
    if (isAdmin && currentMode === "admin") {
      items = getAdminMenu();
    }
    // Processor (type 36)
    else if (typeId === "36" || typeId === "33") {
      if (currentMode === "pos") {
        items = getProcessorPosMenu();
      } else if (currentMode === "business") {
        items = getProcessorBusinessMenu();
      } else {
        // Marketplace mode - general menu
        items = getProcessorGeneralMenu();
      }
    }
    // Dispensary (type 20)
    else if (typeId === "20") {
      if (currentMode === "pos") {
        items = getDispensaryPosMenu();
      } else if (currentMode === "business") {
        items = getDispensaryBusinessMenu();
      } else {
        // Marketplace mode - general menu
        items = getDispensaryGeneralMenu();
      }
    }
    // Fallback to default
    else {
      items = getDefaultMenu();
    }

    setMenuItems(items);
  }, [
    currentMode,
    typeId,
    isHydrated,
    isAdmin,
    loading,
    getAdminMenu,
    getProcessorMenu,
    getProcessorPosMenu,
    getProcessorBusinessMenu,
    getProcessorGeneralMenu,
    getDispensaryMenu,
    getDispensaryPosMenu,
    getDispensaryBusinessMenu,
    getDispensaryGeneralMenu,
    getDefaultMenu,
  ]);

  // Handle "Go back to main menu" / "View Business Menu" - just toggle, no redirect
  const handleMenuToggle = useCallback(() => {
    setShowAdminMenu((prev) => !prev);
  }, []);

  // Handle mode change (Marketplace/Business/POS/Admin)
  const handleModeChange = useCallback(
    (mode: "admin" | "marketplace" | "business" | "pos") => {
      setCurrentMode(mode);
      setShowModeDropdown(false);
      
      const vanityUrlFromCookie = Cookies.get("vanity_url");
      const finalVanityUrl = vanityUrl || vanityUrlFromCookie;
      
      if (mode === "admin") {
        router.push("/dashboard");
      } else if (mode === "marketplace") {
        // Marketplace: go to /dashboard (no vanity URL)
        router.push("/dashboard");
      } else if (mode === "business") {
        // Business: go to /{vanityUrl}/dashboard
        router.push(finalVanityUrl ? `/${finalVanityUrl}/dashboard` : "/dashboard");
      } else if (mode === "pos") {
        // POS: go to /{vanityUrl}/pos/dashboard
        router.push(finalVanityUrl ? `/${finalVanityUrl}/pos/dashboard` : "/pos/dashboard");
      }
      
      if (window.innerWidth < 768) setIsMobileOpen(false);
    },
    [vanityUrl, router, setIsMobileOpen]
  );

  const toggleSubmenu = useCallback((id: string) => {
    if (!isCollapsed) {
      setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  }, [isCollapsed]);

  // Check if a path is currently active
  const isActive = useCallback(
    (path: string) => {
      const pathnameWithoutQuery = pathname.split('?')[0];
      return pathnameWithoutQuery === buildPath(path);
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

  // Get section routes based on business type
  const getSectionRoutes = useCallback(() => {
    const vanityUrlFromCookie = Cookies.get("vanity_url");
    const finalVanityUrl = vanityUrl || vanityUrlFromCookie;

    if (typeId === "36" || typeId === "33") {
      // Processor
      return {
        business: finalVanityUrl ? `/${finalVanityUrl}` : "/",
        pos: finalVanityUrl ? `/${finalVanityUrl}/pos/dashboard` : "/pos/dashboard",
      };
    } else {
      // Dispensary
      return {
        business: finalVanityUrl ? `/${finalVanityUrl}` : "/",
        pos: finalVanityUrl ? `/${finalVanityUrl}/pos/dashboard` : "/pos/dashboard",
      };
    }
  }, [typeId, vanityUrl]);

  // Handle section selection
  const handleSectionChange = useCallback(
    (section: "business" | "pos") => {
      setSelectedSection(section);
      setShowSectionDropdown(false);
      
      const routes = getSectionRoutes();
      const targetPath = section === "business" ? routes.business : routes.pos;
      router.push(targetPath);
      
      if (window.innerWidth < 768) setIsMobileOpen(false);
    },
    [getSectionRoutes, router, setIsMobileOpen]
  );
  
  const { theme } = useThemeContext();
  
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
  const businessTitle = showAdminMenu ? "Admin Panel" : (businessData?.title || "Nature's High");
  const businessLogo = showAdminMenu ? "/images/admin-logo.png" : (businessData?.image_path || "/images/natures-high-logo.png");


  return (
    <>
      {/* Mobile Overlay - appears when sidebar is open */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isCollapsed ? "w-24" : "w-64"
        } dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col py-4 transition-all duration-300 ease-in-out fixed md:relative h-full z-40 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
		
		style={theme === 'light' ? {
		background: `linear-gradient(to bottom, #eefdf6, #f8fdfc)`,
	  } : {
	  }}
	  
      
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
        {/* Close button for mobile, collapse button for desktop */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 768) {
                setIsMobileOpen(false);
              } else {
                setIsCollapsed(true);
              }
            }}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={window.innerWidth < 768 ? "Close menu" : "Collapse sidebar"}
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

      {/* Admin Menu Toggle Button - Only show for admin users when on a business page */}
      {isAdmin && isOnBusinessPage && (
        <div className="px-3 mb-3">
          <button
            type="button"
            onClick={handleMenuToggle}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 
              ${showAdminMenu 
                ? "text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800" 
                : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              }
              ${isCollapsed ? "justify-center" : "justify-start"}
            `}
            title={isCollapsed ? (showAdminMenu ? "Back to Business" : "Admin Menu") : ""}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 
              ${showAdminMenu 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {showAdminMenu ? <ArrowLeft size={16} /> : <Shield size={16} />}
            </div>
            {!isCollapsed && (
              <span className="font-medium text-sm whitespace-nowrap">
                {showAdminMenu ? "Back to Business" : "Go to Admin Menu"}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Current Business Indicator when in Admin Menu */}
      {isAdmin && showAdminMenu && isOnBusinessPage && businessData && !isCollapsed && (
        <div className="px-3 mb-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Viewing admin menu for:
            </p>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200 truncate">
              {businessData.title}
            </p>
          </div>
        </div>
      )}

      {/* MODE SELECTOR DROPDOWN - Show for Processor (36) and Dispensary (20) users, NOT for admin */}
      {((typeId === "36" || typeId === "33" || typeId === "20") && !isAdmin) && (
        <div className="px-3 mb-3 relative">
          <button
            type="button"
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 border
              ${currentMode === "business"
                ? "border-accent text-accent"
                : currentMode === "pos"
                ? "text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                : "text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
              }
            `}
            title={isCollapsed ? `Mode: ${currentMode.toUpperCase()}` : ""}
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold">
                {currentMode === "admin" ? "🔐 Admin" : currentMode === "business" ? "🏢 Business" : currentMode === "pos" ? "🛍️ POS" : "🏪 Marketplace"}
              </span>
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  showModeDropdown ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {/* Dropdown Menu */}
          {showModeDropdown && !isCollapsed && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              {showMarketplaceOption && (
                <button
                  type="button"
                  onClick={() => handleModeChange("marketplace")}
                  className={`w-full text-left px-4 py-3 text-sm rounded-t-lg transition-all duration-200 flex items-center space-x-2
                    ${currentMode === "marketplace"
                      ? "accent-bg text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <span>🏪</span>
                  <span>Marketplace</span>
                </button>
              )}
              {showBusinessOption && (
                <button
                  type="button"
                  onClick={() => handleModeChange("business")}
                  className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center space-x-2
                    ${currentMode === "business"
                      ? "accent-bg text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <span>🏢</span>
                  <span>Business</span>
                </button>
              )}
              {showPosOption && (
                <button
                  type="button"
                  onClick={() => handleModeChange("pos")}
                  className={`w-full text-left px-4 py-3 text-sm rounded-b-lg transition-all duration-200 flex items-center space-x-2
                    ${currentMode === "pos"
                      ? "accent-bg text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <span>🛍️</span>
                  <span>POS</span>
                </button>
              )}
            </div>
          )}
        </div>
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
                className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                  isCollapsed ? "justify-center" : "justify-start"
                }`}
                title={isCollapsed ? item.label : ""}
              >
                {item.icon && (
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                      isItemActive
                        ? "accent-bg text-white shadow-md scale-105"
                        : "text-gray-600 dark:text-gray-400 hover:text-accent"
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
                          : "text-gray-600 dark:text-gray-400 hover:text-accent"
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
    </>
  );
}