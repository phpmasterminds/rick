// pageContent.tsx
'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Loader2, AlertCircle, ArrowLeft, MapPin, Star, Clock, Phone, Globe, Mail,
  Heart, Share2, Navigation, Verified, Leaf, ChevronRight, ShoppingBag,
  DollarSign, Tag, Filter, Grid, List, ChevronDown, X, Info, MessageSquare,
  Calendar, CreditCard, Car, Accessibility, Shield, Percent, Users, ThumbsUp,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ProductModal from '@/components/ProductModal'; 

// Props interface
interface DispensaryDetailPageProps {
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  category?: string;
  subcategory?: string;
  text_parsed?: string;
  strain_type?: 'indica' | 'sativa' | 'hybrid';
  thc_percentage?: number;
  cbd_percentage?: number;
  price: number;
  original_price?: number;
  unit?: string;
  in_stock?: boolean;
  is_deal?: boolean;
  brand?: string;
}

interface CategoryItem {
  cat_id: string;
  cat_name: string;
  status: string;
  med_type: string;
  parent_id: string;
  contains_thc: string;
  is_default: string;
  product_cat_id: string;
  medicinecount: number;
  medicinearray?: any[];
  bg?: string | null;
}

interface MedicineProduct {
  product_id: string;
  name: string;
  cat_name: string;
  sub_cat_name: string;
  category?: string;
  value1: string; // unit (e.g., "Each")
  value2: string; // price (e.g., "0.25")
  image?: string | null;
  med_image_url?: string | null;
  med_img?: string | null;
  med_type: string;
  med_value: string;
  thc?: string;
  cbd?: string;
  terepenes?: string;
  strain?: string;
  strain_cat?: string;
  org_value1?: string;
  org_value2?: string;
  business_name?: string;
  brand_name?: string | null;
  [key: string]: any;
}

interface Review {
  id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
}

interface Hour {
  day: string;
  open: string | null;
  close: string | null;
  is_closed: boolean;
}

interface Dispensary {
  id: string;
  name: string;
  slug?: string;
  logo?: string | null;
  cover_image?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  rating: number;
  review_count: number;
  is_open: boolean;
  hours: Hour[];
  license_number?: string | null;
  business_type?: 'dispensary' | 'delivery' | 'both';
  amenities: string[];
  is_verified: boolean;
  is_medical: boolean;
  is_recreational: boolean;
  followers: number;
  latitude?: number | null;
  longitude?: number | null;
  locs_provides?: string | null;
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items_count: number;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderDetail {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  shipping_address?: string;
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
}

// ===== API Response Interfaces and Mapping Functions =====
/**
 * API Product response from PHPFox (new flat structure)
 */
interface APIProduct {
  product_id: string;
  page_id: string;
  user_id: string;
  name: string;
  name_url: string;
  cat_id: string;
  cat_name: string;
  sub_cat_id: string;
  sub_cat_name: string;
  med_value: string;
  med_image: string;
  med_image_path?: string;
  text: string;
  text_parsed?: string;
  thc: string;
  cbd: string;
  strain: string;
  strain_cat: string;
  i_onhand: string;
  i_price: string;
  i_par?: string;
  p_i_price: string;
  quantity: string;
  enable_product: string;
  enable_catalog: string;
  flavors?: string | string[];
  bus_title: string;
  user_name: string;
  full_name: string;
  business_url: string;
  value1?: string;
  value2?: string;
  p_offer_price?: string;
  [key: string]: any;
}

/**
 * API Response wrapper
 */
interface APIProductResponse {
  status: string;
  data: {
    total: number;
    page: number;
    limit: number;
    products: APIProduct[];
  };
  message: string;
  error: string | null;
}

/**
 * Convert single API product to Product interface
 * Handles field mapping and type conversions
 */
const mapAPIProductToProduct = (apiProduct: APIProduct): Product => {
  const price = parseFloat(apiProduct.i_price || '0');
  const originalPrice = parseFloat(apiProduct.p_i_price || apiProduct.i_price || '0');
  const inStock = parseInt(apiProduct.i_onhand || '0') > 0;
  
  // Parse med_value to extract unit (format: "Each,10.00,,,")
  const medValueParts = apiProduct.med_value?.split(',') || [];
  const unit = medValueParts[0] || 'unit';
  return {
    id: apiProduct.product_id,
    name: apiProduct.name,
    slug: apiProduct.name_url,
    image: apiProduct.med_image || apiProduct.med_image_path,
    category: apiProduct.cat_name,
    subcategory: apiProduct.sub_cat_name,
    thc_percentage: parseFloat(apiProduct.thc || '0'),
    cbd_percentage: parseFloat(apiProduct.cbd || '0'),
    price: isNaN(price) ? 0 : price,
    original_price: isNaN(originalPrice) ? undefined : originalPrice,
    unit: unit,
    in_stock: inStock,
    brand: apiProduct.bus_title,
  };
};

/**
 * Convert array of API products to Product array
 */
const mapAPIProductsToProducts = (apiProducts: APIProduct[]): Product[] => {
  return apiProducts.map(mapAPIProductToProduct);
};

/**
 * Process API response and extract products
 */
const processProductsResponse = (response: APIProductResponse): Product[] => {
  if (response.status === 'success' && response.data?.products) {
    return mapAPIProductsToProducts(response.data.products);
  }
  return [];
};

// --- sample fallback data (kept small) ---
const sampleDispensary: Dispensary = {
  id: '1',
  name: 'The Green Solution',
  slug: 'the-green-solution',
  logo: 'https://images.unsplash.com/photo-1589484535988-f7d6cc6e0d5e?w=200&h=200&fit=crop',
  cover_image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&h=600&fit=crop',
  description: 'Sample dispensary description.',
  address: '2601 W Alameda Ave',
  city: 'Denver',
  state: 'CO',
  zip_code: '80219',
  phone: '(303) 990-9723',
  email: 'info@tgscolorado.com',
  website: 'https://tgscolorado.com',
  rating: 4.8,
  review_count: 1245,
  is_open: true,
  hours: [
    { day: 'Monday', open: '08:00', close: '21:45', is_closed: false },
    { day: 'Tuesday', open: '08:00', close: '21:45', is_closed: false },
    { day: 'Wednesday', open: '08:00', close: '21:45', is_closed: false },
    { day: 'Thursday', open: '08:00', close: '21:45', is_closed: false },
    { day: 'Friday', open: '08:00', close: '21:45', is_closed: false },
    { day: 'Saturday', open: '09:00', close: '21:45', is_closed: false },
    { day: 'Sunday', open: '09:00', close: '20:00', is_closed: false },
  ],
  license_number: 'MED-403R-0012',
  business_type: 'dispensary',
  amenities: ['atm', 'parking', 'wheelchair', 'veteran_discount', 'first_time_discount'],
  is_verified: true,
  is_medical: true,
  is_recreational: true,
  followers: 12456,
  latitude: 39.7092,
  longitude: -105.0235,
  locs_provides: 'Medical & Recreational',
};

const sampleProducts: Product[] = [
  { id: 's1', name: 'Sample Flower A', price: 45, unit: '3.5g', in_stock: true, category: 'flower' },
  { id: 's2', name: 'Sample Edible B', price: 22, unit: '100mg', in_stock: true, category: 'edible' },
];

const sampleReviews: Review[] = [
  { id: 'r1', user_name: 'Michael R.', user_avatar: '', rating: 5, comment: 'Great place!', created_at: '2024-01-15', helpful_count: 10 },
  { id: 'r2', user_name: 'Sarah K.', user_avatar: '', rating: 4, comment: 'Nice staff.', created_at: '2024-01-12', helpful_count: 4 },
];

// --- Helper: Convert numeric time format (e.g., "8", "800", "1700") to HH:MM format ---

const normalizeCloseTimePM = (time: string): string => {
  const normalized = normalizeTimeFormat(time); // HH:MM

  if (!normalized || !normalized.includes(':')) return normalized;

  let [hour, minute] = normalized.split(':').map(Number);

  // If hour is between 1–11, force PM
  if (hour >= 1 && hour <= 11) {
    hour += 12;
  }

  // 12 stays 12 (12 PM)
  // 13–23 stays as-is (already 24-hour PM)

  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
};


const normalizeTimeFormat = (time: string): string => {
  if (!time || typeof time !== 'string') return '';

  // If already in HH:MM format, return as-is
  if (time.includes(':')) return time;

  // Remove spaces
  const clean = time.trim();

  // If only hour is given (e.g., "8", "9")
  if (/^\d{1,2}$/.test(clean)) {
    const hour = clean.padStart(2, '0');
    return `${hour}:00`;
  }

  // If numeric time like 800, 930, 1700
  if (/^\d{3,4}$/.test(clean)) {
    const padded = clean.padStart(4, '0');
    const hours = padded.substring(0, 2);
    const minutes = padded.substring(2, 4);
    return `${hours}:${minutes}`;
  }

  return time;
};


// --- Helper: Convert 24-hour format to 12-hour format with AM/PM ---
const convertTo12HourFormat = (time24: string): string => {
  if (!time24 || typeof time24 !== 'string') return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// --- Helper: Sanitize and extract plain text from HTML description ---
const sanitizeDescription = (html: string): string => {
  if (!html) return '';
  
  // Remove HTML tags using regex
  let text = String(html).replace(/<[^>]*>/g, '');
  
  // Decode most common HTML entities
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&#39;/g, "'");
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

const categories = [
  { id: 'all', label: 'All Products', icon: ShoppingBag },
  { id: 'flower', label: 'Flower', icon: Leaf },
  { id: 'concentrate', label: 'Concentrates', icon: DollarSign },
  { id: 'edible', label: 'Edibles', icon: ShoppingBag },
  { id: 'cartridge', label: 'Cartridges', icon: ShoppingBag },
  { id: 'preroll', label: 'Pre-Rolls', icon: ShoppingBag },
  { id: 'tincture', label: 'Tinctures', icon: ShoppingBag },
];

const amenityInfo: Record<string, { label: string; icon: React.ElementType }> = {
  atm: { label: 'ATM', icon: CreditCard },
  parking: { label: 'Parking', icon: Car },
  wheelchair: { label: 'ADA Accessible', icon: Accessibility },
  veteran_discount: { label: 'Veteran Discount', icon: Shield },
  curbside: { label: 'Curbside Pickup', icon: Car },
  delivery: { label: 'Delivery', icon: Navigation },
  first_time_discount: { label: 'First Time Discount', icon: Percent },
  loyalty_program: { label: 'Loyalty Program', icon: Users },
};

export default function DispensaryDetailPage({ slug }: DispensaryDetailPageProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dispensary, setDispensary] = useState<Dispensary | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews' | 'about' | 'dispensary-orders'>('menu');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [showAllHours, setShowAllHours] = useState(false);
  const [medicineProducts, setMedicineProducts] = useState<MedicineProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<MedicineProduct | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [businessTypeId, setBusinessTypeId] = useState<number | null>(null);

  // Infinite scroll pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [allFetchedProducts, setAllFetchedProducts] = useState<MedicineProduct[]>([]);
  const observerRef = useRef<HTMLDivElement>(null);

  // Detect dark mode from app-level (document or parent provider)
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if app uses dark mode class on html or body element
    const isDark = 
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setIsDarkMode(isDark);

    // Watch for changes to dark mode class
    const observer = new MutationObserver(() => {
      const isDarkNow = 
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark');
      setIsDarkMode(isDarkNow);
    });

    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => observer.disconnect();
  }, []);

  // Order management state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDispensaryOwner, setIsDispensaryOwner] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ordersDashboardMetrics, setOrdersDashboardMetrics] = useState({
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    completed_orders: 0,
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersView, setOrdersView] = useState<'dashboard' | 'orders' | 'order-detail' | 'customers'>('dashboard');

  // --- Helper: gracefully replace hyphens if slug maybe undefined somewhere else ---
  const readableName = (slug || '').replace(/-/g, ' ');

  // --- Map your API response to UI-friendly Dispensary shape ---
  const mapApiBusinessToDispensary = (api: any): Dispensary => {
    // Helper for cover image resolution
    const tryResolveCover = (): string | null => {
      // Prefer pages_image_path if it's a relative path with %s placeholder
      // pages_image_path example: "2021/07/ae7e70ee9ec61e5ff82c4de20776d35f%s.png"
      try {
        // If cover_photo_id given, attempt to construct (best-effort)
        if (api.cover_photo_url) {
          // This is a best-effort guess; you said you'll update actual cover photo API later
          return api.cover_photo_url;
        }
      } catch (e) {
        // ignore and fallback to null
      }
      return null;
    };

    // Parse hours: try to build from locs_hr_* fields, otherwise use store_hours string
    const buildHours = (): Hour[] => {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      let hasHrFields = false;
      const hours: Hour[] = days.map((d, idx) => {
        const op = api[`locs_hr_${d}_op`];
        const cl = api[`locs_hr_${d}_cl`];
        const status = api[`locs_${d}_status`]; // '0' or '1'
        if ((op && op !== '0') || (cl && cl !== '0')) hasHrFields = true;

        /*return {
          day: dayNames[idx],
          open: op && op !== '0' ? normalizeTimeFormat(op) : null,
          close: cl && cl !== '0' ? normalizeCloseTimePM(cl) : null,
          is_closed: status !== undefined ? status !== '2' : !(op && op !== '0'),
        };*/
		
		return {
			day: dayNames[idx],
			open: status !== '2' && op && op !== '0' ? normalizeTimeFormat(op) : null,
			close: status !== '2' && cl && cl !== '0' ? normalizeCloseTimePM(cl) : null,
			is_closed: status === '2',
		  };
      });
	  
      // If no hr fields populated, handle store_hours like "Open 24hours"
      if (!hasHrFields) {
        const sh = api.store_hours ? String(api.store_hours).toLowerCase() : '';
        if (sh.includes('24') || sh.includes('open 24')) {
          return dayNames.map((d) => ({ day: d, open: '00:00', close: '23:59', is_closed: false }));
        }
        // as fallback, return simple closed/open based on is_opened
        const opened = api.is_opened === true || api.is_opened === '1';
        return dayNames.map((d) => ({ day: d, open: opened ? '09:00' : null, close: opened ? '21:00' : null, is_closed: !opened }));
      }

      return hours;
    };

    // Convert numeric-ish strings to numbers safely
    const safeFloat = (v: any) => {
      const n = parseFloat(String(v || '0'));
      return isNaN(n) ? 0 : n;
    };
    const safeInt = (v: any) => {
      const n = parseInt(String(v || '0'), 10);
      return isNaN(n) ? 0 : n;
    };

    const mapped: Dispensary = {
      id: String(api.page_id ?? api.locs_id ?? api.claim_id ?? Math.random().toString(36).slice(2, 9)),
      name: api.title ?? api.full_name ?? api.locs_name ?? 'Unknown',
      slug: api.vanity_url ?? (api.title ? String(api.title).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') : undefined),
      logo: api.pages_image_path && String(api.pages_image_path).startsWith('https') ? api.pages_image_path : (api.owner_user_image ? `https://www.api.natureshigh.com/PF.Base/file/pic/pages/${api.owner_user_image.replace('%s', '')}` : null),
      cover_image: tryResolveCover(),
      description: sanitizeDescription(api.text_parsed || api.text_parsed || ''),
      address: api.locs_street || null,
      city: api.locs_city || null,
      state: api.locs_state || null,
      zip_code: api.locs_zip || api.locs_postal_code || null,
      phone: api.locs_phone || api.claim_phone || null,
      email: api.locs_email || null,
      website: api.info_website ? (api.info_website.startsWith('http') ? api.info_website : `https://${api.info_website}`) : null,
      rating: safeFloat(api.locs_rating ?? api.locs_rating ?? 0),
      review_count: safeInt(api.locs_ratings ?? api.medicine_count ?? 0),
      is_open: api.is_opened === true || api.is_opened === '1' || api.is_opened === 'true' || api.is_opened === true || api.is_opened === 'opened' || api.is_opened === 'Open' || false,
      hours: buildHours(),
      locs_provides: api.locs_provides || null,
      license_number: api.license_number || null,
      business_type: 'dispensary',
      amenities: [
        api.locs_is_atm === '1' || api.business_atm_on_premises === '1' ? 'atm' : null,
        api.locs_accept_pickup === '1' || api.business_accept_pickups === '1' ? 'pickup' : null,
        api.locs_accept_curbside === '1' || api.business_accept_curbside === '1' ? 'curbside' : null,
        api.locs_accept_delivery === '1' || api.business_accept_delivery === '1' ? 'delivery' : null,
        api.locs_wheelchair || api.business_wheel_chair_accesiable === '1' ? 'wheelchair' : null,
        api.business_show_vetaran === '1' ? 'veteran_discount' : null,
      ].filter(Boolean) as string[],
      is_verified: !!api.claimed_business || !!api.is_claimed || false,
      is_medical: api.medicine_feature ? true : (api.is_medical ? !!api.is_medical : true),
      is_recreational: true,
      followers: safeInt(api.followers ?? 0),
      latitude: api.locs_lat ? safeFloat(api.locs_lat) : (api.locs_lat_int ? safeFloat(api.locs_lat_int) : null),
      longitude: api.locs_lon ? safeFloat(api.locs_lon) : (api.locs_lon_int ? safeFloat(api.locs_lon_int) : null),
    };

    return mapped;
  };

  // --- fetch dispensary and optionally products+reviews ---
  const fetchDispensary = useCallback(async () => {
    setLoading(true);
    try {
      // If your API needs a slug param, keep this; adapt if necessary
      const response = await axios.get(`/api/business/?business=${encodeURIComponent(slug)}`);
	  
      
      if (response.data?.status === 'success' && response.data.data) {
        const api = response.data.data;
		
		// Store business type_id for filtering display
		if (api.type_id) {
		  setBusinessTypeId(parseInt(String(api.type_id), 10));
		}
		
		// FETCH PRODUCTS/CATEGORIES
		let categories: CategoryItem[] = [];
		let products: Product[] = [];
		
		try {
		  const productApi = await axios.get(`/api/business/get-business-page-products/?page_id=${api.page_id}&page=1&limit=30`);
		  
		  if (productApi.data?.status === 'success' && productApi.data.data?.products) {
						// New API returns a flat array of products with cat_id and cat_name
						const apiProducts: APIProduct[] = productApi.data.data.products;
						const totalProducts = productApi.data.data.total || 0;

						// Check if there are more products to load
						setHasMoreProducts(totalProducts > 30);
						setCurrentPage(1);

						// Build unique categories from the products
						const categoryMap = new Map<string, CategoryItem>();
						apiProducts.forEach((prod) => {
						  // Normalize cat_id: treat null/undefined/empty as "uncategorized"
						  const catId = prod.cat_id && String(prod.cat_id).trim() ? String(prod.cat_id).trim() : 'uncategorized';
						  const catName = prod.cat_name && String(prod.cat_name).trim() ? String(prod.cat_name).trim() : 'Uncategorized';
						  
						  if (!categoryMap.has(catId)) {
							categoryMap.set(catId, {
							  cat_id: catId,
							  cat_name: catName,
							  status: '1',
							  med_type: prod.med_type ?? '0',
							  parent_id: '0',
							  contains_thc: (prod.thc && parseInt(String(prod.thc)) > 0) ? '1' : '0',
							  is_default: '0',
							  product_cat_id: '0',
							  medicinecount: 0,
							  bg: null,
							});
						  }
						  // Increment medicine count for this category
						  const cat = categoryMap.get(catId);
						  if (cat) cat.medicinecount += 1;
						});

						// Convert map to array and sort (keep all categories for counting)
						categories = Array.from(categoryMap.values());
						// Sort: Uncategorized first, then by name
						categories.sort((a, b) => {
						  if (a.cat_id === 'uncategorized') return -1;
						  if (b.cat_id === 'uncategorized') return 1;
						  return a.cat_name.localeCompare(b.cat_name);
						});

						// Convert API products to MedicineProduct interface
						const allProducts = apiProducts
						  .filter((prod) => prod.enable_product === '1' && prod.name)
						  .map((prod) => ({
							product_id: String(prod.product_id ?? ''),
							name: prod.name ?? 'Unknown Product',
							cat_name: (prod.cat_name && String(prod.cat_name).trim() ? String(prod.cat_name).trim() : 'Uncategorized'),
							sub_cat_name: (prod.sub_cat_name && String(prod.sub_cat_name).trim() ? String(prod.sub_cat_name).trim() : 'Uncategorized'),
							sub_cat_id: String(prod.sub_cat_id ?? ''),
							value1: String(prod.value1 ?? prod.med_value?.split(',')[0] ?? 'Each'),
							value2: String(prod.value2 ?? prod.i_price ?? prod.p_offer_price ?? '0'),
							image: prod.med_image_path ?? prod.med_image ?? null,
							med_image_url: prod.med_image_path ?? prod.med_image ?? null,
							med_img: prod.med_image_path ?? prod.med_image ?? null,
							med_type: String(prod.med_type ?? '0'),
							med_value: prod.med_value ?? '',
							thc: String(prod.thc ?? ''),
							cbd: String(prod.cbd ?? ''),
							terepenes: String(prod.terepenes ?? ''),
							text_parsed: String(prod.text_parsed ?? ''),
							strain: prod.strain ?? '',
							strain_cat: prod.strain_cat ?? '',
							org_value1: String(prod.value1 ?? 'Each'),
							org_value2: String(prod.value2 ?? prod.i_price ?? '0'),
							business_name: dispensary?.name ?? '',
							brand_name: null,
							flavors: prod.flavors ?? [],
							quantity: prod.quantity ?? prod.i_onhand ?? '0',
							in_stock: prod.enable_product === '1',
						  })) as MedicineProduct[];

						// Store medicine products separately for modal display
						setAllFetchedProducts(allProducts);
						setMedicineProducts(allProducts);

						// Convert products to display-friendly format
						products = allProducts.map((prod: any, idx: number) => ({
						  id: String(prod.product_id ?? prod.id ?? idx),
						  name: prod.name ?? `Product ${idx + 1}`,
						  price: prod.value2 ? parseFloat(String(prod.value2)) : 0,
						  category: prod.cat_name ?? 'Uncategorized',
						  strain_type: prod.strain_cat?.toLowerCase() as any ?? undefined,
						  thc_percentage: prod.thc ? parseFloat(String(prod.thc)) : undefined,
						  cbd_percentage: prod.cbd ? parseFloat(String(prod.cbd)) : undefined,
						  image: prod.med_image_url ?? prod.med_img ?? null,
						  unit: prod.value1 ?? 'Each',
						  in_stock: prod.in_stock ?? true,
						  is_deal: false,
						  brand: prod.brand_name ?? undefined,
						}));
						// Set categories state
						setCategories(categories);
		  }
		} catch (productError) {
		  console.warn('Error fetching products/categories:', productError);
		  // Continue with empty products if API fails
		}
		
        // Map business -> UI dispensary
        const mapped = mapApiBusinessToDispensary(api);
        setDispensary(mapped);

        // PRODUCTS
        if (products.length > 0) {
          setProducts(products);
        } else if (Array.isArray(api.products) && api.products.length > 0) {
          // Fallback: use api.products if available
          const mappedProducts: Product[] = api.products.map((p: any, idx: number) => ({
            id: String(p.id ?? p.prod_id ?? idx),
            name: p.name ?? p.title ?? p.product_name ?? `Product ${idx + 1}`,
            slug: p.slug ?? undefined,
            image: p.image ?? p.product_image ?? null,
            category: p.category ?? p.type ?? 'flower',
            strain_type: p.strain_type ?? undefined,
            thc_percentage: p.thc_percentage ? parseFloat(String(p.thc_percentage)) : undefined,
            cbd_percentage: p.cbd_percentage ? parseFloat(String(p.cbd_percentage)) : undefined,
            price: p.price ? parseFloat(String(p.price)) : (p.price_int ? parseFloat(String(p.price_int)) : 0),
            original_price: p.original_price ? parseFloat(String(p.original_price)) : undefined,
            unit: p.unit ?? p.size ?? undefined,
            in_stock: p.in_stock === false ? false : true,
            is_deal: !!p.is_deal,
            brand: p.brand ?? p.vendor ?? undefined,
          }));
          setProducts(mappedProducts);
        } else if (api.medicine_count && Number(api.medicine_count) > 0) {
          // create placeholder products using medicine_count
          const n = Math.min(20, Number(api.medicine_count)); // limit to 20 for UI
          const placeholders: Product[] = Array.from({ length: n }).map((_, i) => ({
            id: `med-${i + 1}`,
            name: `Product ${i + 1}`,
            price: 10 + i * 2,
            unit: 'unit',
            in_stock: true,
            category: 'flower',
          }));
          setProducts(placeholders);
        } else {
          // fallback: keep sample products
          //setProducts(sampleProducts);
        }

        // REVIEWS
        if (Array.isArray(api.reviews) && api.reviews.length > 0) {
          const mappedReviews: Review[] = api.reviews.map((r: any, idx: number) => ({
            id: String(r.id ?? idx),
            user_name: r.user_name ?? r.name ?? r.author ?? 'Anonymous',
            user_avatar: r.user_avatar ?? r.avatar ?? '',
            rating: r.rating ? Number(r.rating) : 4,
            comment: r.comment ?? r.text ?? '',
            created_at: r.created_at ?? r.date ?? new Date().toISOString().slice(0, 10),
            helpful_count: r.helpful_count ? Number(r.helpful_count) : 0,
          }));
          setReviews(mappedReviews);
        } else {
          setReviews(sampleReviews);
        }
      } else {
        // unexpected response; fallback to sample
        setDispensary(sampleDispensary);
        //setProducts(sampleProducts);
        setReviews(sampleReviews);
      }
    } catch (error) {
      console.error('Error fetching dispensary:', error);
      setDispensary(sampleDispensary);
      setProducts(sampleProducts);
      setReviews(sampleReviews);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Fetch next page of products for infinite scroll
  const fetchMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMoreProducts || !dispensary?.id) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const productApi = await axios.get(
        `/api/business/get-business-page-products/?page_id=${dispensary.id}&page=${nextPage}&limit=30`
      );

      if (productApi.data?.status === 'success' && productApi.data.data?.products) {
        const apiProducts: APIProduct[] = productApi.data.data.products;
        const totalProducts = productApi.data.data.total || 0;
        const currentTotal = allFetchedProducts.length;

        // Check if more products available
        setHasMoreProducts(currentTotal + apiProducts.length < totalProducts);
        setCurrentPage(nextPage);

        // Convert new products to MedicineProduct
        const newProducts = apiProducts
          .filter((prod) => prod.enable_product === '1' && prod.name)
          .map((prod) => ({
            product_id: String(prod.product_id ?? ''),
            name: prod.name ?? 'Unknown Product',
            cat_name: (prod.cat_name && String(prod.cat_name).trim() 
              ? String(prod.cat_name).trim() 
              : 'Uncategorized'),
            sub_cat_name: (prod.sub_cat_name && String(prod.sub_cat_name).trim()
              ? String(prod.sub_cat_name).trim()
              : 'Uncategorized'),
            value1: String(prod.value1 ?? prod.med_value?.split(',')[0] ?? 'Each'),
            value2: String(prod.value2 ?? prod.i_price ?? prod.p_offer_price ?? '0'),
            image: prod.med_image_path ?? prod.med_image ?? null,
            med_image_url: prod.med_image_path ?? prod.med_image ?? null,
            med_img: prod.med_image_path ?? prod.med_image ?? null,
            med_type: String(prod.med_type ?? '0'),
            med_value: prod.med_value ?? '',
            thc: String(prod.thc ?? ''),
            cbd: String(prod.cbd ?? ''),
            terepenes: String(prod.terepenes ?? ''),
            text_parsed: String(prod.text_parsed ?? ''),
            strain: prod.strain ?? '',
            strain_cat: prod.strain_cat ?? '',
            org_value1: String(prod.value1 ?? 'Each'),
            org_value2: String(prod.value2 ?? prod.i_price ?? '0'),
            business_name: dispensary?.name ?? '',
            brand_name: null,
            flavors: prod.flavors ?? [],
            quantity: prod.quantity ?? prod.i_onhand ?? '0',
            in_stock: prod.enable_product === '1',
          })) as MedicineProduct[];

        // Combine old + new products
        const combinedMedicineProducts = [...allFetchedProducts, ...newProducts];
        setAllFetchedProducts(combinedMedicineProducts);
        setMedicineProducts(combinedMedicineProducts);
      }
    } catch (error) {
      console.error('Error fetching more products:', error);
      toast.error('Failed to load more products');
    } finally {
      setIsLoadingMore(false);
    }
  }, [dispensary?.id, currentPage, isLoadingMore, hasMoreProducts, allFetchedProducts]);

  // Infinite scroll - observe when reaching bottom
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreProducts && !isLoadingMore) {
          fetchMoreProducts();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before reaching bottom
        threshold: 0.1,
      }
    );

    observer.observe(observerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreProducts, isLoadingMore, fetchMoreProducts]);

  useEffect(() => {
    if (slug) fetchDispensary();
  }, [slug, fetchDispensary]);

  // Check admin and owner access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if admin from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
			if(user.data.user_group_id === '1'){
				setIsAdmin(true);
			}
          } catch (e) {
            setIsAdmin(false);
          }
        }

        // Check if dispensary owner
        try {
          const response = await axios.get(`/api/business/?business=${encodeURIComponent(slug)}`);
          if (response.data?.data?.user_id) {
            const userCookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith('user_id='))
              ?.split('=')[1];
            const userId = localStorage.getItem('user_id');
            const dispensaryOwnerId = String(response.data.data.user_id);
            setIsDispensaryOwner(
              (userCookie === dispensaryOwnerId || userId === dispensaryOwnerId) && !!userCookie || !!userId
            );
          }
        } catch (e) {
          setIsDispensaryOwner(false);
        }
      } catch (error) {
        console.error('Error checking access:', error);
      }
    };

    checkAccess();
  }, [slug]);

  useEffect(() => {
    // Check if favorited (store as array of ids)
    try {
      const favorites = JSON.parse(localStorage.getItem('dispensary_favorites') || '[]');
      setIsFavorite(Boolean(dispensary && favorites.includes(dispensary.id)));
    } catch (e) {
      setIsFavorite(false);
    }
  }, [dispensary]);

  const toggleFavorite = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('dispensary_favorites') || '[]');
      let newFavorites;
      if (isFavorite && dispensary) {
        newFavorites = favorites.filter((f: string) => f !== dispensary.id);
      } else if (dispensary) {
        newFavorites = [...favorites, dispensary.id];
      } else {
        newFavorites = favorites;
      }
      localStorage.setItem('dispensary_favorites', JSON.stringify(newFavorites));
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites', {
        position: 'bottom-center',
        autoClose: 2000,
      });
    } catch (e) {
      console.error('Favorite toggle error', e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: dispensary?.name,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard', {
        position: 'bottom-center',
        autoClose: 2000,
      });
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getStrainColor = (type?: string) => {
    switch (type) {
      case 'indica': return 'bg-purple-100 text-purple-700';
      case 'sativa': return 'bg-orange-100 text-orange-700';
      case 'hybrid': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Product modal handlers
  const openProductModal = (product: MedicineProduct, index: number) => {
	  console.log(product);
    setSelectedProduct(product);
    setSelectedProductIndex(index);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  const goToPreviousProduct = () => {
    if (selectedProductIndex > 0) {
      const prevProduct = filteredMedicineProducts[selectedProductIndex - 1];
      openProductModal(prevProduct, selectedProductIndex - 1);
    }
  };

  const goToNextProduct = () => {
    if (selectedProductIndex < filteredMedicineProducts.length - 1) {
      const nextProduct = filteredMedicineProducts[selectedProductIndex + 1];
      openProductModal(nextProduct, selectedProductIndex + 1);
    }
  };

  // FIX: Filter products by selected category using normalized cat_id and cat_name matching
  const filteredMedicineProducts = useMemo(() => {
    let filtered = medicineProducts;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      const selectedCategoryObj = categories.find(c => c.cat_id === selectedCategory);
      
      if (!selectedCategoryObj) {
        return [];
      }
      
      filtered = filtered.filter(product => {
        const normalizedProductCatName = product.cat_name && String(product.cat_name).trim() 
          ? String(product.cat_name).trim() 
          : 'Uncategorized';
        
        const normalizedSelectedCatName = selectedCategoryObj.cat_name && String(selectedCategoryObj.cat_name).trim()
          ? String(selectedCategoryObj.cat_name).trim()
          : 'Uncategorized';
        
        return normalizedProductCatName.toLowerCase() === normalizedSelectedCatName.toLowerCase();
      });
    }
    
    // Filter by subcategory (only if a specific category is selected and subcategory is not 'all')
    if (selectedCategory !== 'all' && selectedSubCategory !== 'all') {
      filtered = filtered.filter(product => {
        const productSubCatId = product.sub_cat_id ? String(product.sub_cat_id).trim() : '';
        return productSubCatId === String(selectedSubCategory).trim();
      });
    }
    
    return filtered;
  }, [selectedCategory, selectedSubCategory, categories, medicineProducts]);

  // FIX: Sort products based on sortBy selection
  const sortedAndFilteredProducts = useMemo(() => {
    const sorted = [...filteredMedicineProducts];
    
    switch (sortBy) {
      case 'price_low':
        sorted.sort((a, b) => {
          const priceA = parseFloat(String(a.value2 || '0'));
          const priceB = parseFloat(String(b.value2 || '0'));
          return priceA - priceB;
        });
        break;
      case 'price_high':
        sorted.sort((a, b) => {
          const priceA = parseFloat(String(a.value2 || '0'));
          const priceB = parseFloat(String(b.value2 || '0'));
          return priceB - priceA;
        });
        break;
      case 'thc':
        sorted.sort((a, b) => {
          const thcA = parseFloat(String(a.thc || '0'));
          const thcB = parseFloat(String(b.thc || '0'));
          return thcB - thcA; // Highest THC first
        });
        break;
      case 'popular':
      default:
        // Keep default order (API order is typically popularity)
        break;
    }
    
    return sorted;
  }, [filteredMedicineProducts, sortBy]);

  const getTodayHours = () => {
    if (!dispensary) return null;
    // If hours indicate open 24/7
    if (dispensary.hours.length > 0 && dispensary.hours.every(h => h.open === '00:00' && h.close === '23:59')) {
      return { is_24: true, display: 'Open 24 hours' } as any;
    }
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const h = dispensary.hours.find((x) => x.day === today);
    if (!h) return null;
    return {
      is_24: false,
      is_closed: h.is_closed,
      open: h.open,
      close: h.close,
      display: h.is_closed ? 'Closed' : (h.open && h.close ? `${h.open} - ${h.close}` : 'Hours not available'),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading {businessTypeId === 20 ? 'dispensary' : 'Products'}...</p>
        </div>
      </div>
    );
  }

  if (!dispensary) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Dispensary Not Found</h2>
          <p className="text-gray-600 mb-6">The dispensary you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dispensary')}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
          >
            Browse Dispensaries
          </button>
        </div>
      </div>
    );
  }

  const todayHours = getTodayHours();
console.log(filteredMedicineProducts);
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gray-200">
        {dispensary.cover_image ? (
          <img
            src={dispensary.cover_image}
            alt={dispensary.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-700" />
        )}
        <div className="absolute inset-0 bg-black/30" />

        {/* Back Button */}
        <button
          onClick={() => router.push('/dispensary')}
          className="absolute top-4 left-4 p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
		{/*<button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-gray-700" /> : <Moon className="w-5 h-5 text-gray-700" />}
		</button>*/}
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={toggleFavorite}
            className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
          </button>
        </div>
      </div>

      {/* Dispensary Header */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-lg p-6 transition-colors duration-200`}>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border-4 border-white shadow-md">
              {dispensary.logo ? (
                <img
                  src={dispensary.logo}
                  alt={dispensary.name}
                  className="object-cover w-full h-full hover:scale-105 transition"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
                 {dispensary.logo} <Leaf className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{dispensary.name}</h1>
                {dispensary.is_verified && (
                  <Verified className="w-6 h-6 text-teal-600" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(dispensary.rating, 'md')}
                  <span className="font-bold text-gray-900">{dispensary.rating}</span>
                  <span className="text-gray-500">({dispensary.review_count.toLocaleString()} reviews)</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">{dispensary.followers.toLocaleString()} followers</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">{dispensary.locs_provides}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${dispensary.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {dispensary.is_open ? 'Open Now' : 'Closed'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>{dispensary.address ? `${dispensary.address}, ${dispensary.city}, ${dispensary.state} ${dispensary.zip_code ?? ''}` : 'Address not available'}</span>
                </div>
                {dispensary.phone && (
                  <a href={`tel:${dispensary.phone}`} className="flex items-center gap-2 text-teal-600 hover:text-teal-700">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{dispensary.phone}</span>
                  </a>
                )}
                {todayHours && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span>{todayHours.is_24 ? 'Open 24 hours' : (todayHours.is_closed ? 'Closed' : todayHours.display)}</span>
                  </div>
                )}
                {dispensary.website && (
                  <a href={dispensary.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-teal-600 hover:text-teal-700">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span>Visit Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <a
                href={`https://maps.google.com/?q=${dispensary.latitude ?? ''},${dispensary.longitude ?? ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Get Directions
              </a>
              {dispensary.phone && (
                <a
                  href={`tel:${dispensary.phone}`}
                  className="px-6 py-3 border border-teal-600 text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm transition-colors duration-200`}>
          <div className={`flex ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
            {[
              { id: 'menu', label: 'Menu', icon: ShoppingBag, count: products.length },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare, count: dispensary.review_count },
              { id: 'about', label: 'About', icon: Info },
              //...(isAdmin || isDispensaryOwner ? [{ id: 'dispensary-orders', label: 'Dispensary Orders', icon: ShoppingBag, count: undefined }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 md:flex-none px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : `${isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700'}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                    {tab.count.toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Menu Tab */}
          {activeTab === 'menu' && (
            <div className="p-6">
              {/* Category Pills */}
              <div className="flex overflow-x-auto gap-2 pb-4 mb-6 -mx-6 px-6 scrollbar-hide">
                {/* All Products button - always shown first */}
                <button
                  key="all-products"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSubCategory('all');
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    selectedCategory === 'all'
                      ? 'bg-teal-600 text-white'
                      : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  All Products
                  <span className={`text-xs ${selectedCategory === 'all' ? 'text-teal-200' : `${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}`}>
                    ({medicineProducts.length})
                  </span>
                </button>
                
                {/* Render all categories from API */}
                {categories.map((category) => {
                  const count = medicineProducts.filter(p => {
                    const normalizedProductCatName = p.cat_name && String(p.cat_name).trim() 
                      ? String(p.cat_name).trim() 
                      : 'Uncategorized';
                    const normalizedCategoryCatName = category.cat_name && String(category.cat_name).trim()
                      ? String(category.cat_name).trim()
                      : 'Uncategorized';
                    return normalizedProductCatName.toLowerCase() === normalizedCategoryCatName.toLowerCase();
                  }).length;
                  return (
                    <button
                      key={category.cat_id}
                      onClick={() => {
                        setSelectedCategory(category.cat_id);
                        setSelectedSubCategory('all');
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                        selectedCategory === category.cat_id
                          ? 'bg-teal-600 text-white'
                          : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                      }`}
                    >
                      {category.cat_name}
                      <span className={`text-xs ${selectedCategory === category.cat_id ? 'text-teal-200' : `${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}`}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Subcategory Pills - Show when a specific category is selected */}
              {selectedCategory !== 'all' && (
                <div className="flex overflow-x-auto gap-2 pb-4 mb-6 -mx-6 px-6 scrollbar-hide">
                  {/* All Subcategories button for selected category */}
                  <button
                    key="all-subcats"
                    onClick={() => setSelectedSubCategory('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                      selectedSubCategory === 'all'
                        ? 'bg-amber-600 text-white'
                        : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }`}
                  >
                    All Subcategories
                  </button>

                  {/* Get unique subcategories for selected category */}
                  {Array.from(
                    new Map(
                      filteredMedicineProducts
                        .filter(p => p.sub_cat_id && String(p.sub_cat_id).trim()) // ← Only products WITH sub_cat_id
                        .map(p => [p.sub_cat_id, {
                          id: p.sub_cat_id,
                          name: p.sub_cat_name || p.sub_cat_id // ← Use ID as fallback, not "Uncategorized"
                        }])
                    ).values()
                  ).map((subCat) => {
                    const subCatCount = filteredMedicineProducts.filter(p => 
                      p.sub_cat_id && String(p.sub_cat_id).trim() === String(subCat.id).trim()
                    ).length;
                    
                    return (
                      <button
                        key={subCat.id}
                        onClick={() => setSelectedSubCategory(subCat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                          selectedSubCategory === subCat.id
                            ? 'bg-amber-600 text-white'
                            : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                        }`}
                      >
                        {subCat.name}
                        <span className={`text-xs ${selectedSubCategory === subCat.id ? 'text-amber-200' : `${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}`}>
                          ({subCatCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Filters Bar */}
              <div className="flex items-center justify-between mb-6">
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{filteredMedicineProducts.length}</span> products
                </p>
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border border-gray-600 text-white' 
                        : 'border border-gray-300 bg-white text-gray-900'
                    }`}
                  >
                    <option value="popular">Most Popular</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="thc">Highest THC</option>
                  </select>
                  <div className={`flex items-center rounded-lg overflow-hidden ${isDarkMode ? 'border border-gray-600' : 'border border-gray-300'} transition-colors`}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-teal-600 text-white' : `${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-600'}`}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-teal-600 text-white' : `${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-600'}`}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {filteredMedicineProducts.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No products in this category</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedAndFilteredProducts.map((product, idx) => (
                    <div
                      key={product.product_id}
                      onClick={() => openProductModal(product, idx)}
                      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group`}
                    >
                      <div className="relative aspect-square bg-gray-100">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-contain hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Leaf className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                        {product.is_deal && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">DEAL</div>
                        )}
                        {!product.in_stock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        {product.strain_type && (
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${getStrainColor(product.strain_type)}`}>
                            {product.strain_type.charAt(0).toUpperCase() + product.strain_type.slice(1)}
                          </span>
                        )}
                        <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} text-sm group-hover:text-teal-600 transition-colors line-clamp-2`}>
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{product.brand}</p>
                        )}
                        <div className={`flex items-center gap-2 mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {product.thc && (
                            <span className="text-xs">THC: {product.thc}%</span>
                          )}
                          {product.cbd && (
                            <span className="text-xs">CBD: {product.cbd}%</span>
                          )}
                        </div>
                        <div className={`flex items-center justify-between mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
							{/*<div>
                            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${product.value2}</span>
                          </div>
							<span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{product.value1}</span>*/}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedAndFilteredProducts.map((product, idx) => (
                    <div
                      key={product.product_id}
                      onClick={() => openProductModal(product, idx)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex gap-4"
                    >
                      <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-contain hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Leaf className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 hover:text-teal-600 transition-colors">
                              {product.name}
                            </h3>
                            {product.brand && (
                              <p className="text-sm text-gray-500">{product.brand}</p>
                            )}
                          </div>
                          <div className="text-right">
						  {/*<span className="font-bold text-gray-900">${product.value2}</span>
						  <span className="text-sm text-gray-500 ml-1">/ {product.value1}</span>*/}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {product.strain_type && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStrainColor(product.strain_type)}`}>
                              {product.strain_type.charAt(0).toUpperCase() + product.strain_type.slice(1)}
                            </span>
                          )}
                          {product.thc && (
                            <span className="text-xs text-gray-600">THC: {product.thc}%</span>
                          )}
                          {product.cbd && (
                            <span className="text-xs text-gray-600">CBD: {product.cbd}%</span>
                          )}
                          {product.is_deal && (
                            <span className="text-xs text-red-600 font-medium">DEAL</span>
                          )}
                          {!product.in_stock && (
                            <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Infinite Scroll Loading Indicator & Observer Target */}
              <div ref={observerRef} className="w-full py-8 flex justify-center">
                {isLoadingMore && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Loading more products...
                    </p>
                  </div>
                )}
                {!hasMoreProducts && sortedAndFilteredProducts.length > 30 && (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    All products loaded ({sortedAndFilteredProducts.length} total)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="p-6">
              {/* Rating Summary */}
              <div className={`flex flex-col md:flex-row gap-8 mb-8 pb-8 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                <div className="text-center md:text-left">
                  <div className={`text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{dispensary.rating}</div>
                  {renderStars(dispensary.rating, 'md')}
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>{dispensary.review_count.toLocaleString()} reviews</p>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => Math.floor(r.rating) === stars).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 mb-2">
                        <span className={`text-sm w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stars} ★</span>
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className={`text-sm w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className={`pb-6 last:border-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                        {review.user_avatar ? (
                          <img src={review.user_avatar} alt={review.user_name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <span className="text-gray-600 font-semibold text-lg">{review.user_name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{review.user_name}</span>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{review.created_at}</span>
                        </div>
                        <div className="mb-2">
                          {renderStars(review.rating, 'sm')}
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{review.comment}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <button className={`flex items-center gap-1 text-sm ${isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}>
                            <ThumbsUp className="w-4 h-4" />
                            Helpful ({review.helpful_count})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="p-6">
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {/* Description */}
                <div>
                  <h3 className={`font-semibold text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    About
                  </h3>
                  <p>{dispensary.description || 'No description available'}</p>
                </div>

                {/* Hours */}
                <div>
                  <h3 className={`font-semibold text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Hours
                  </h3>
                  <div className="space-y-2">
                    {dispensary.hours.slice(0, showAllHours ? undefined : 3).map((hour) => (
                      <div key={hour.day} className="flex justify-between">
                        <span>{hour.day}</span>
                        <span>
                          {hour.is_closed
                            ? 'Closed'
                            : hour.open && hour.close
                            ? `${convertTo12HourFormat(hour.open)} - ${convertTo12HourFormat(hour.close)}`
                            : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {dispensary.hours.length > 3 && (
                    <button
                      onClick={() => setShowAllHours(!showAllHours)}
                      className="text-teal-600 font-semibold text-sm mt-3"
                    >
                      {showAllHours ? 'Show Less' : 'Show All'}
                    </button>
                  )}
                </div>

                {/* Contact */}
                <div>
                  <h3 className={`font-semibold text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Contact
                  </h3>
                  <div className="space-y-2">
                    {dispensary.phone && (
                      <p>
                        <strong>Phone:</strong>{' '}
                        <a href={`tel:${dispensary.phone}`} className="text-teal-600 hover:text-teal-700">
                          {dispensary.phone}
                        </a>
                      </p>
                    )}
                    {dispensary.email && (
                      <p>
                        <strong>Email:</strong>{' '}
                        <a href={`mailto:${dispensary.email}`} className="text-teal-600 hover:text-teal-700">
                          {dispensary.email}
                        </a>
                      </p>
                    )}
                    {dispensary.website && (
                      <p>
                        <strong>Website:</strong>{' '}
                        <a
                          href={dispensary.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700"
                        >
                          Visit
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                {dispensary.amenities.length > 0 && (
                  <div>
                    <h3 className={`font-semibold text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Amenities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {dispensary.amenities.map((amenity) => {
                        const info = amenityInfo[amenity];
                        return info ? (
                          <div
                            key={amenity}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                          >
                            <info.icon className="w-4 h-4" />
                            <span className="text-sm">{info.label}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
  <ProductModal
    selectedProduct={selectedProduct}
    dispensary={{
      id: dispensary.id,
      name: dispensary.name,
      address: dispensary.address || '',
    }}
    medicineProducts={filteredMedicineProducts}
	isPreview='1'
    selectedProductIndex={selectedProductIndex}
    onClose={closeProductModal}
    onNext={goToNextProduct}
    onPrevious={goToPreviousProduct}
  />
)}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className={`${isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'} border rounded-lg p-4 transition-colors duration-200`}>
          <p className={`text-xs ${isDarkMode ? 'text-amber-200' : 'text-amber-800'} text-center`}>
            <strong>Disclaimer:</strong> Marijuana is for use by qualified patients only. Keep out of reach of children. 
            Marijuana use during pregnancy or breastfeeding poses potential harms. Marijuana is not approved by the FDA 
            to treat, cure, or prevent any disease. Do not operate a vehicle or machinery under the influence of marijuana.
          </p>
        </div>
      </div>
    </div>
  );
}