"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  image?: string;
  dispensary_id: string;
  dispensary_name: string;
}

interface CartGroup {
  [dispensary_id: string]: {
    dispensary_name: string;
    items: CartItem[];
  };
}

export default function GuestTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.data?.user_group_id) {
          setLoggedIn(true);
        }
      } catch {}
    }

    // ✅ Load cart from localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch {}
    }

    // ✅ Listen for cart updates from custom event (same tab)
    const handleCartUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setCartItems(customEvent.detail);
      }
    };

    // ✅ Listen for localStorage changes (different tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "cart" && event.newValue) {
        try {
          setCartItems(JSON.parse(event.newValue));
        } catch {}
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // ✅ Save cart to localStorage whenever it changes (for persistence)
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const menuItems = [
    { name: "Shop", href: "/shop" },
    { name: "Deals", href: "/deals" },
    { name: "Featured", href: "/featured" },
    { name: "Strains", href: "/strains" },
    { name: "Learn", href: "/learn" },
    { name: "Dispensary", href: "/dispensary" },
  ];

  const groupCartByDispensary = (): CartGroup => {
    return cartItems.reduce((acc, item) => {
      if (!acc[item.dispensary_id]) {
        acc[item.dispensary_id] = {
          dispensary_name: item.dispensary_name,
          items: [],
        };
      }
      acc[item.dispensary_id].items.push(item);
      return acc;
    }, {} as CartGroup);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Item removed from cart");
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty");
      return;
    }

    // ✅ Check user_id cookie (more reliable than loggedIn state)
    const userId = Cookies.get("user_id");
    if (!userId) {
      toast.warning("Please login to proceed to checkout", {
        position: "bottom-right",
        autoClose: 3000,
      });
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      // Store cart data in session
      sessionStorage.setItem("checkout_cart", JSON.stringify(cartItems));
      router.push("/checkout");
      setShowCartPreview(false);
    } catch (error) {
      toast.error("Failed to proceed to checkout");
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      setCartItems([]);
      toast.success("Cart cleared");
    }
  };

  const cartGroups = groupCartByDispensary();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/home">
          <div className="flex items-center gap-2 cursor-pointer">
            <img
              src="/images/natures-high-logo.png"
              alt="Nature's High"
              className="h-9 w-9 rounded-full object-cover shadow-md"
            />
            <span className="font-semibold text-slate-800">Nature's High</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700 ml-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              className={`hover:text-slate-900 transition-colors ${
                pathname === item.href ? "font-semibold text-slate-900" : ""
              }`}
              href={item.href}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="flex items-center gap-4 ml-6">
          {/* Cart Icon */}
          <button
            onClick={() => setShowCartPreview(!showCartPreview)}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="w-6 h-6 text-slate-800" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>

          {!loggedIn && (
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

        {/* Mobile Menu Button */}
        {!loggedIn && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && !loggedIn && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 md:hidden">
          <div className="px-4 py-3 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block py-1 transition-colors ${
                  pathname === item.href ? "font-semibold text-slate-900" : ""
                }`}
                href={item.href}
              >
                {item.name}
              </Link>
            ))}

            {!loggedIn && (
              <>
                <hr className="my-2" />
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block transition-colors hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm font-medium shadow text-center transition-colors hover:bg-slate-800"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cart Preview Popup */}
      {showCartPreview && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowCartPreview(false)}
          />

          {/* Cart Panel */}
          <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal-600" />
                Your Cart
              </h2>
              <button
                onClick={() => setShowCartPreview(false)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <ShoppingCart className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-slate-600 text-center text-sm">
                    Your cart is empty. Start shopping to add items.
                  </p>
                  <Link
                    href="/shop"
                    onClick={() => setShowCartPreview(false)}
                    className="mt-4 text-teal-600 hover:text-teal-700 font-medium text-sm"
                  >
                    Continue Shopping →
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(cartGroups).map(([dispensary_id, group]) => (
                    <div key={dispensary_id}>
                      {/* Dispensary Header */}
                      <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">
                        {group.dispensary_name}
                      </h3>

                      {/* Items */}
                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            {/* Item Image */}
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded object-cover bg-slate-200"
                              />
                            )}

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-600">{item.unit}</p>
                              <p className="text-sm font-bold text-teal-600 mt-1">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3 text-slate-600" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3 text-slate-600" />
                              </button>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
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
            {cartItems.length > 0 && (
              <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50">
                {/* Pricing Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax (4.5%)</span>
                    <span>${(totalPrice * 0.045).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span className="text-teal-600">
                      ${(totalPrice * 1.045).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
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
                    onClick={() => setShowCartPreview(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Continue Shopping
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}