'use client';

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Menu,
  Bell,
  User,
  Settings,
  LogOut,
  ShoppingCart,
  X,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { useShopCart } from "@/app/contexts/ShopCartContext";
import { useThemeContext } from "@/components/ThemeProvider";

interface TopBarProps {
  // Optional: allow parent to control mobile menu if needed
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

// ===== CART TYPES =====
interface ShopCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  image?: string;
  dispensary_id: string;
  dispensary_name: string;
}

interface ShopCartGroup {
  [dispensary_id: string]: {
    dispensary_name: string;
    items: ShopCartItem[];
  };
}

interface CheckoutCartItem {
  cartItemId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  business: string;
}

interface CheckoutGroupedItems {
  [business: string]: CheckoutCartItem[];
}

interface GroupedItems {
  [business: string]: any[];
}

interface BusinessData {
  type_id: string;
  vanity_url: string;
  title: string;
  image_path?: string;
  page_id?: string;
  trade_name?: string;
  [key: string]: any;
}

export default function UnifiedTopBar({ isMobileOpen: propIsMobileOpen, setIsMobileOpen: propSetIsMobileOpen }: TopBarProps) {
  // ===== STATE MANAGEMENT =====
  const [internalIsMobileOpen, setInternalIsMobileOpen] = useState(false);
  
  // Use prop values if provided, otherwise use internal state
  const isMobileOpen = propIsMobileOpen !== undefined ? propIsMobileOpen : internalIsMobileOpen;
  const setIsMobileOpen = propSetIsMobileOpen || setInternalIsMobileOpen;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCartPanel, setShowCartPanel] = useState(false);
  
  // User data
  const [email, setEmail] = useState<string | null>(null);
  const [fullname, setFullname] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userImage, setuserImage] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_SITE_URL;
  
  // Business data
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Business switching and theme
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // ===== SHOP CART (CART PANEL) =====
  const [shopCartItems, setShopCartItems] = useState<ShopCartItem[]>([]);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

  // ===== CHECKOUT CART (CART DRAWER) =====
  const {
    cartItems = [],
    removeFromCart,
    updateCartItemQuantity,
    getCartTotal,
    getCartItemsCount,
  } = useShopCart();

  const cartItemsCount = getCartItemsCount?.() || 0;
  const cartTotal = getCartTotal?.() || 0;

  // ===== ROUTING & PATHNAME =====
  const pathname = usePathname();
  const router = useRouter();
  
  // ===== EXTRACT VANITY URL =====
  const getVanityUrl = useCallback(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const knownRoutes = [
      "dashboard", "login", "register", "home", "auth", "shop", "buy",
      "orders", "reports", "settings", "dispensary-floor", "customers",
      "vendors", "deals", "inventory", "posinventory", "wholesaleorder",
      "catalog", "order-list", "documents", "sample-orders", "projects",
      "crm", "metrc", "metrc-audit", "transactions", "vendors-po", "cart",
      "checkout", "featured", "strains", "learn", "dispensary",
    ];
    const pathVanityUrl =
      pathSegments[0] && !knownRoutes.includes(pathSegments[0])
        ? pathSegments[0]
        : null;
    return pathVanityUrl || null;
  }, [pathname]);

  const vanityUrl = useMemo(() => getVanityUrl(), [getVanityUrl]);

  // ===== FETCH BUSINESS DATA =====
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!vanityUrl || vanityUrl === currentBusiness) {
        if (!businessData && vanityUrl) {
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
      } finally {
        setLoading(false);
        setIsHydrated(true);
      }
    };

    fetchBusinessData();
  }, [vanityUrl, currentBusiness, businessData]);

  // ===== LOAD BUSINESSES FROM LOCALSTORAGE =====
  useEffect(() => {
    try {
      const businessStr = localStorage.getItem("business");
      if (businessStr) {
        const businessList = JSON.parse(businessStr);
        if (Array.isArray(businessList)) {
          setBusinesses(businessList);
        }
      }
    } catch (error) {
      console.error("Failed to load businesses from localStorage:", error);
    }
  }, []);
  
	const { theme, setTheme, accentColor, setAccentColor } = useThemeContext();


  // Get current type_id from cookie
  const currentTypeId = Cookies.get("type_id");

  // ===== SAVE THEME TO API =====
  const saveThemeToApi = useCallback(async (newTheme: string) => {
    try {
      const userId = Cookies.get("user_id");
      if (userId) {
        await axios.post("/api/user/theme", {
          theme: newTheme,
          user_id: userId,
        });
		Cookies.set("user_theme", newTheme);
      }
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  }, []);
  
	// ✅ ADD: Save accent color to API and cookie
	const saveAccentColorToApi = useCallback(async (colorName: string) => {
		try {
		const userId = Cookies.get("user_id");
		if (userId) {
		  await axios.post("/api/user/theme", {
			accent_color: colorName,
			user_id: userId,
		  });
		  // Save to cookie immediately
		  Cookies.set("accent_color", colorName);
		}
		} catch (error) {
		// Still update cookie even if API fails
		Cookies.set("accent_color", colorName);
		}
	}, []);


  // ===== HANDLE THEME CHANGE =====
	const handleThemeChange = (newTheme: string) => {
		setTheme(newTheme);           // ✅ instant UI update
		setShowThemeMenu(false);
		saveThemeToApi(newTheme);     // API + cookie
	};
  //setTheme
  // ✅ ADD: Handle accent color change
	const handleColorChange = (colorName: string) => {
		setAccentColor(colorName);    // ✅ instant UI update
		saveAccentColorToApi(colorName);
	};


  // ===== HANDLE BUSINESS SWITCH =====
  const handleBusinessSwitch = useCallback(async (business: BusinessData) => {
    try {
      // Set all the required cookies
      Cookies.set("page_id", business.page_id || "");
      Cookies.set("vanity_url", business.vanity_url || "");
      Cookies.set("type_id", business.type_id || "");
      Cookies.set("business_title", business.title || "");
      Cookies.set("trade_name", business.trade_name || "");
      Cookies.set("business_logo", business.image_path || "");

      // Update state
      setBusinessData(business);
      setCurrentBusiness(business.vanity_url || null);
      setShowBusinessDropdown(false);

      // Navigate to business vanity URL
      if (business.vanity_url) {
        router.push(`/dashboard`);
      }

      toast.success(`Switched to ${business.title}`);
    } catch (error) {
      console.error("Failed to switch business:", error);
      toast.error("Failed to switch business");
    }
  }, [router]);
  const getCartStorageKey = useCallback(() => {
    const userId = Cookies.get("user_id");
    return userId ? `cart_${userId}` : "cart";
  }, []);

  // ===== LOAD SHOP CART FROM LOCALSTORAGE =====
  useEffect(() => {
    const cartKey = getCartStorageKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        setShopCartItems(JSON.parse(savedCart));
      } catch {}
    }

    const handleCartUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setShopCartItems(customEvent.detail);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === cartKey && event.newValue) {
        try {
          setShopCartItems(JSON.parse(event.newValue));
        } catch {}
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [getCartStorageKey]);

  useEffect(() => {
    const cartKey = getCartStorageKey();
    localStorage.setItem(cartKey, JSON.stringify(shopCartItems));
  }, [shopCartItems, getCartStorageKey]);

  // ===== LOAD USER DATA =====
  useEffect(() => {
    // Check if user is logged in via user_id cookie
    const userId = Cookies.get("user_id");
    setLoggedIn(!!userId);

    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setFullname(user.data.full_name || null);
        setEmail(user.data.email || null);
		
		if (user.data.user_image) {
			const image120 = user.data.user_image.replace('%s', '_120_square');
			setuserImage(`${apiUrl}user/${image120}`);
		}

        if (user.data.full_name?.trim() !== "") {
			
          const nameParts = user.data.full_name.trim().split(/[,\s]+/).filter(Boolean);
		  
          const firstInitial = nameParts[0]?.[0] || "";
          const secondInitial =
							  nameParts[2]?.[0] ??
							  nameParts[1]?.[0] ??
							  nameParts[0]?.[1] ??
							  '';
							  
          setInitials((firstInitial + secondInitial).toUpperCase());
        }
      } catch (err) {
        console.error("Invalid user data in localStorage:", err);
      }
    }
  }, []);

  // ===== LISTEN FOR USER DATA CHANGES (from profile update) =====
  useEffect(() => {
    const handleUserDataChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const userData = customEvent.detail;
        console.log('User data changed event received:', userData);

        // Update user image if present
        if (userData.data?.user_image) {
          const image120 = userData.data.user_image.replace('%s', '_120_square');
          const newImageUrl = `${apiUrl}user/${image120}`;
          setuserImage(newImageUrl);
          console.log('User image updated to:', newImageUrl);
        }

        // Update email if changed
        if (userData.data?.email) {
          setEmail(userData.data.email);
        }

        // Update fullname and initials if changed
        if (userData.data?.full_name) {
          setFullname(userData.data.full_name);
          
          const nameParts = userData.data.full_name.trim().split(" ");
          const firstInitial = nameParts[0]?.[0] || "";
          const secondInitial =
            nameParts.length > 1 ? nameParts[2]?.[0] : nameParts[0]?.[1] || "";
          setInitials((firstInitial + secondInitial).toUpperCase());
        }
      }
    };

    window.addEventListener('userDataChanged', handleUserDataChange);

    return () => {
      window.removeEventListener('userDataChanged', handleUserDataChange);
    };
  }, [apiUrl]);

  // ===== HANDLERS =====
  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("shopCart");
    localStorage.removeItem("business_variants");
    const cartKey = getCartStorageKey();
    //localStorage.removeItem(cartKey);
    Cookies.remove("access_token", { path: "/" });
    Cookies.remove("user_id", { path: "/" });
    Cookies.remove("user_group_id", { path: "/" });
    Cookies.remove("page_id", { path: "/" });
    Cookies.remove("vanity_url", { path: "/" });
    Cookies.remove("type_id", { path: "/" });
    Cookies.remove("trade_name", { path: "/" });
    Cookies.remove("business_logo", { path: "/" });
    Cookies.remove("business_title", { path: "/" });
    router.push("/");
  };

  // ===== SHOP CART (CART PANEL) FUNCTIONS =====
  const groupShopCartByDispensary = (): ShopCartGroup => {
    return shopCartItems.reduce((acc, item) => {
      if (!acc[item.dispensary_id]) {
        acc[item.dispensary_id] = {
          dispensary_name: item.dispensary_name,
          items: [],
        };
      }
      acc[item.dispensary_id].items.push(item);
      return acc;
    }, {} as ShopCartGroup);
  };

  const updateShopQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeShopFromCart(id);
      return;
    }
    setShopCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeShopFromCart = (id: string) => {
    setShopCartItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Item removed from cart");
  };

  const getShopTotalPrice = () => {
    return shopCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getShopTotalItems = () => {
    return shopCartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleShopCheckout = async () => {
    if (shopCartItems.length === 0) {
      toast.warning("Your cart is empty");
      return;
    }

    const userId = Cookies.get("user_id");
    if (!userId) {
      toast.warning("Please login to proceed to checkout", {
        position: "bottom-right",
        autoClose: 3000,
      });
      router.push("/login");
      return;
    }

    setIsLoadingCheckout(true);
    try {
      sessionStorage.setItem("checkout_cart", JSON.stringify(shopCartItems));
      router.push("/checkout");
      setShowCartPanel(false);
    } catch (error) {
      toast.error("Failed to proceed to checkout");
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  const clearShopCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      setShopCartItems([]);
      toast.success("Cart cleared");
    }
  };

  // ===== CHECKOUT CART (CART DRAWER) FUNCTIONS =====
  const groupedCheckoutItems: CheckoutGroupedItems = cartItems.reduce((acc, item) => {
    const business = item.business || "Nature's High";
    if (!acc[business]) {
      acc[business] = [];
    }
    acc[business].push({
      ...item,
      business, // Ensure business is always defined as string
    });
    return acc;
  }, {} as CheckoutGroupedItems);

  const handleRemoveCheckoutItem = (cartItemId: string) => {
    removeFromCart?.(cartItemId);
  };

  const handleUpdateCheckoutQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCheckoutItem(cartItemId);
      return;
    }
    updateCartItemQuantity?.(cartItemId, newQuantity);
  };

  // ===== CART TOTALS =====
  const shopTotalItems = getShopTotalItems();
  const shopTotalPrice = getShopTotalPrice();
  const shopCartGroups = groupShopCartByDispensary();
  const totalCheckoutCartItems = cartItemsCount;


  // Don't render until hydrated
  if (!isHydrated || loading) {
    return (
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
	  style={theme === 'light' ? {
		background: `linear-gradient(to bottom, #eefdf6, #f8fdfc)`,
	  } : {
	  }}
	 >
        <div className="flex items-center justify-between h-16 px-4 ">
          {/* Left Section - Logo & Menu */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setIsMobileOpen(!isMobileOpen);
                setShowUserMenu(false);
                setShowNotifications(false);
                setShowCartDrawer(false);
                setShowCartPanel(false);
              }}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              <Menu size={24} className="text-gray-900 dark:text-white" />
            </button>

            {/* Logo */}
            <Link href="/home" className="flex items-center gap-2 cursor-pointer">
              <img
                src="/images/natures-high-logo.png"
                alt="Nature's High"
                className="h-9 w-9 rounded-full object-cover shadow-md"
              />
              <span className="hidden sm:block font-semibold text-gray-900 dark:text-white">
                Nature's High
              </span>
            </Link>
          </div>

          {/* Center Section - Navigation (Desktop) - Only show when NOT logged in */}
          {!loggedIn && (
            <nav className="hidden items-center gap-6 text-sm text-slate-700 md:flex ml-auto">
              {[
                { name: "Shop", href: "/shop" },
                { name: "Deals", href: "/deals" },
                { name: "Featured", href: "/featured" },
                { name: "Strains", href: "/strains" },
                { name: "Learn", href: "/learn" },
                { name: "Dispensary", href: "/dispensary" },
              ].map((item) => (
                <Link
                  key={item.href}
                  className={`hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap px-1 ${
                    pathname === item.href
                      ? "font-semibold text-gray-900 dark:text-white"
                      : ""
                  }`}
                  href={item.href}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Right Section - Notifications & Cart & User (Logged In) / Login & Signup (Not Logged In) */}
          <div className="flex items-center gap-1.5">
            {loggedIn ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                      setShowCartDrawer(false);
                      setShowCartPanel(false);
                    }}
                    className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Bell size={20} className="text-gray-900 dark:text-white" />
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        No notifications yet
                      </div>
                    </div>
                  )}
                </div>

                {/* Business Switcher - Show if more than one business */}
                {businesses.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowBusinessDropdown(!showBusinessDropdown);
                        setShowNotifications(false);
                        setShowUserMenu(false);
                        setShowCartDrawer(false);
                        setShowCartPanel(false);
                      }}
                      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Switch Business"
                    >
                      <div className="flex items-center gap-2">
                        {Cookies.get("business_logo") && (
                          <img 
                            src={Cookies.get("business_logo")} 
                            alt="Business Logo"
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                          {Cookies.get("business_title") || "Switch Business"}
                        </span>
                        <ChevronDown size={16} className="text-gray-900 dark:text-white" />
                      </div>
                    </button>

                    {showBusinessDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Switch Business
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {businesses.map((business) => (
                            <button
                              key={business.page_id}
                              onClick={() => handleBusinessSwitch(business)}
                              className={`w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                                currentBusiness === business.vanity_url
                                  ? "bg-teal-50 dark:bg-teal-900/20 border-l-2 border-teal-600"
                                  : ""
                              }`}
                            >
                              {business.image_path && (
                                <img
                                  src={business.image_path}
                                  alt={business.title}
                                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {business.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {business.vanity_url}
                                </p>
                              </div>
                              {currentBusiness === business.vanity_url && (
                                <div className="w-2 h-2 bg-teal-600 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {currentTypeId !== "36" && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowCartDrawer(!showCartDrawer);
                        setShowUserMenu(false);
                        setShowNotifications(false);
                        setShowCartPanel(false);
                      }}
                      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      aria-label="Cart drawer"
                    >
                      <ShoppingCart size={20} className="text-gray-900 dark:text-white" />
                      {totalCheckoutCartItems > 0 && (
                        <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {totalCheckoutCartItems}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Cart Panel Button (Shop Cart) - Hide if processor (type_id 36) */}
                {currentTypeId !== "36" && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowCartPanel(!showCartPanel);
                        setShowUserMenu(false);
                        setShowNotifications(false);
                        setShowCartDrawer(false);
                      }}
                      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      aria-label="Shop cart"
                    >
                      <ShoppingCart size={20} className="text-gray-900 dark:text-white" />
                      {shopTotalItems > 0 && (
                        <span className="absolute top-0 right-0 bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {shopTotalItems}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                      setShowCartDrawer(false);
                      setShowCartPanel(false);
                    }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300"
                  >
				  {userImage ? (
						<img
						  src={userImage}
						  className="w-full h-full object-cover"
						  onError={() => setuserImage(null)} // fallback if image fails
						/>
					  ) : (
						<span className="text-white font-semibold text-sm">
						  {initials}
						</span>
					  )}
					  					
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{fullname}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
                  </div>
				  
				  <Link href="/settings/profile">
				  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left text-gray-900 dark:text-white"
                  >
                    <User size={18} />
                    <span className="text-sm font-medium">Profile</span>
                  </button>
                  </Link>

                  {/* ✅ UPDATED: Theme Toggle Section with Cookie Persistence */}
					<div className="px-4 py-3 space-y-3 border-t border-gray-200 dark:border-gray-700">
					  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
						Appearance
					  </p>

					  {/* Light/Dark Toggle */}
					  <div className="flex items-center gap-2">
						<button
						  onClick={() => handleThemeChange("light")}
						  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
							theme === "light"
							  ? "bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
							  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
						  }`}
						  title="Light mode"
						>
						  <Sun size={16} />
						  <span className="text-xs font-medium">Light</span>
						</button>
						<button
						  onClick={() => handleThemeChange("dark")}
						  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
							theme === "dark"
							  ? "bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
							  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
						  }`}
						  title="Dark mode"
						>
						  <Moon size={16} />
						  <span className="text-xs font-medium">Dark</span>
						</button>
					  </div>

					  {/* ✅ ADD: Accent Color Selector */}
					  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
						<p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
						  Accent Color
						</p>
						<div className="grid grid-cols-4 gap-2">
						  {[
							{ name: "teal", color: "#14B8A6" },
							{ name: "blue", color: "#3B82F6" },
							{ name: "purple", color: "#A855F7" },
							{ name: "pink", color: "#EC4899" },
							{ name: "green", color: "#10B981" },
							{ name: "orange", color: "#F97316" },
							{ name: "red", color: "#EF4444" },
							{ name: "indigo", color: "#6366F1" },
						  ].map((color) => (
							<button
							  key={color.name}
							  onClick={() => handleColorChange(color.name)}
							  className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
								accentColor === color.name
								  ? "ring-2 ring-gray-900 dark:ring-gray-100 ring-offset-2"
								  : ""
							  }`}
							  style={{ backgroundColor: color.color }}
							  title={color.name}
							/>
						  ))}
						</div>
					  </div>
					</div>

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
              </>
            ) : (
              // Show Login & Sign Up buttons when not logged in
              <div className="hidden md:flex items-center gap-4 ml-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium shadow transition-colors hover:bg-slate-800"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== MOBILE MENU DROPDOWN - Only show when NOT logged in ===== */}
      {isMobileOpen && !loggedIn && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md z-50">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Menu</span>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Close menu"
            >
              <X size={20} className="text-gray-900 dark:text-white" />
            </button>
          </div>
          <nav className="flex flex-col px-4 py-2">
            {[
              { name: "Shop", href: "/" },
              { name: "Featured", href: "/featured" },
              { name: "Strains", href: "/strains" },
              { name: "Learn", href: "/learn" },
              { name: "Dispensary", href: "/dispensary" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                  pathname === item.href
                    ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* ===== CART DRAWER (CHECKOUT CART) ===== */}
      {showCartDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setShowCartDrawer(false)}
          />

          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Checkout Cart
              </h2>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-900 dark:text-white" />
              </button>
            </div>

            {/* Cart Items by Business */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {Object.keys(groupedCheckoutItems).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <ShoppingCart
                    size={48}
                    className="text-gray-300 dark:text-gray-600 mb-3"
                  />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Your cart is empty
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Add items to get started
                  </p>
                </div>
              ) : (
                Object.entries(groupedCheckoutItems).map(([business, items]) => (
                  <div
                    key={business}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h3 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">
                      {business}
                    </h3>

                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-white">
                              {item.productName}
                            </h4>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                              ${(item.price || 0).toFixed(2)}
                            </p>

                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() =>
                                  handleUpdateCheckoutQuantity(
                                    item.cartItemId,
                                    (item.quantity || 0) - 1
                                  )
                                }
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={item.quantity || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val))
                                    handleUpdateCheckoutQuantity(item.cartItemId, val);
                                }}
                                className="w-10 h-6 text-center border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                              />
                              <button
                                onClick={() =>
                                  handleUpdateCheckoutQuantity(
                                    item.cartItemId,
                                    (item.quantity || 0) + 1
                                  )
                                }
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveCheckoutItem(item.cartItemId)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm font-semibold text-gray-900 dark:text-white">
                        <span>Subtotal:</span>
                        <span>
                          $
                          {items
                            .reduce(
                              (sum, item) =>
                                sum + (item.price || 0) * (item.quantity || 0),
                              0
                            )
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {Object.keys(groupedCheckoutItems).length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 md:p-6 space-y-3">
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between font-semibold text-lg text-gray-900 dark:text-white">
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

      {/* ===== CART PANEL (SHOP CART) ===== */}
      {showCartPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowCartPanel(false)}
          />

          <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-slate-50 dark:from-teal-900/20 dark:to-slate-900/20">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal-600" />
                Your Cart
              </h2>
              <button
                onClick={() => setShowCartPanel(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {shopCartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <ShoppingCart className="w-16 h-16 text-slate-300 dark:text-gray-600 mb-4" />
                  <p className="text-slate-600 dark:text-gray-400 text-center text-sm">
                    Your cart is empty. Start shopping to add items.
                  </p>
                  <Link
                    href="/shop"
                    onClick={() => setShowCartPanel(false)}
                    className="mt-4 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium text-sm"
                  >
                    Continue Shopping →
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(shopCartGroups).map(([dispensary_id, group]) => (
                    <div key={dispensary_id}>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-gray-700">
                        {group.dispensary_name}
                      </h3>

                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded object-cover bg-slate-200 dark:bg-gray-700"
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-gray-400">
                                {item.unit}
                              </p>
                              <p className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-1">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateShopQuantity(item.id, item.quantity - 1)
                                }
                                className="p-1 hover:bg-slate-200 dark:hover:bg-gray-600 rounded transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3 text-slate-600 dark:text-gray-400" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold text-slate-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateShopQuantity(item.id, item.quantity + 1)
                                }
                                className="p-1 hover:bg-slate-200 dark:hover:bg-gray-600 rounded transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3 text-slate-600 dark:text-gray-400" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeShopFromCart(item.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {shopCartItems.length > 0 && (
              <div className="border-t border-slate-200 dark:border-gray-700 p-4 space-y-4 bg-slate-50 dark:bg-gray-800">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-gray-400">
                    <span>Subtotal ({shopTotalItems} items)</span>
                    <span>${shopTotalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-gray-400">
                    <span>Tax (4.5%)</span>
                    <span>${(shopTotalPrice * 0.045).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-300 dark:border-gray-600 pt-2 flex justify-between text-base font-bold text-slate-900 dark:text-white">
                    <span>Total</span>
                    <span className="text-teal-600 dark:text-teal-400">
                      ${(shopTotalPrice * 1.045).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleShopCheckout}
                    disabled={isLoadingCheckout}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 dark:bg-teal-700 dark:hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoadingCheckout ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowCartPanel(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Continue Shopping
                  </button>

                  <button
                    onClick={clearShopCart}
                    className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}