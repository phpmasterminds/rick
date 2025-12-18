// pageContent.tsx
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Loader2, AlertCircle, ArrowLeft, MapPin, Star, Clock, Phone, Globe, Mail,
  Heart, Share2, Navigation, Verified, Leaf, ChevronRight, ShoppingBag,
  DollarSign, Tag, Filter, Grid, List, ChevronDown, X, Info, MessageSquare,
  Calendar, CreditCard, Car, Accessibility, Shield, Percent, Users, ThumbsUp,
  ChevronLeft, Moon, Sun
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
  med_id: string;
  name: string;
  cat_name: string;
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

// --- Helper: Convert numeric time format (e.g., "800" or "1700") to HH:MM format ---
const normalizeTimeFormat = (time: string): string => {
  if (!time || typeof time !== 'string') return '';
  
  // If already in HH:MM format, return as-is
  if (time.includes(':')) return time;
  
  // If it's a numeric string, convert it
  const num = parseInt(time, 10);
  if (isNaN(num)) return time;
  
  // Pad to 4 digits (e.g., 800 -> 0800, 1700 -> 1700)
  const padded = num.toString().padStart(4, '0');
  
  // Split into hours and minutes
  const hours = padded.substring(0, 2);
  const minutes = padded.substring(2, 4);
  
  return `${hours}:${minutes}`;
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

// --- categories + icons + amenity mapping (unchanged) ---
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [showAllHours, setShowAllHours] = useState(false);
  const [medicineProducts, setMedicineProducts] = useState<MedicineProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<MedicineProduct | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
        /*if (api.pages_image_path) {
          // If contains %s, remove it to get base image (no size suffix)
          const relative = api.pages_image_path.replace('%s', '');
          return `https://www.api.natureshigh.com/PF.Base/file/pic/pages/${relative}`;
        }*/

        // If image_path is already a full URL, use it
        /*if (api.image_path && typeof api.image_path === 'string' && api.image_path.startsWith('http')) {
          return api.image_path;
        }*/

        // If an image server pattern exists (fallback)
        /*if (api.image_path && api.image_path.indexOf('/file/pic/pages/') > -1) {
          // If it's a relative path, try to prefix
          return api.image_path.startsWith('http') ? api.image_path : `https://www.api.natureshigh.com/${api.image_path}`;
        }*/
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

        return {
          day: dayNames[idx],
          open: op && op !== '0' ? normalizeTimeFormat(op) : null,
          close: cl && cl !== '0' ? normalizeTimeFormat(cl) : null,
          is_closed: status !== undefined ? status !== '1' : !(op && op !== '0'),
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
      logo: api.image_path && String(api.image_path).startsWith('http') ? api.image_path : (api.owner_user_image ? `https://www.api.natureshigh.com/PF.Base/file/pic/pages/${api.owner_user_image.replace('%s', '')}` : null),
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
		
		// FETCH PRODUCTS/CATEGORIES
		let categories: CategoryItem[] = [];
		let products: Product[] = [];
		
		try {
		  const productApi = await axios.get(`/api/business/get-business-page-products/?page_id=${api.page_id}&page=1&limit=30`);
		  
		  if (productApi.data?.status === 'success' && productApi.data.data?.products) {
			// Map categories - FILTER OUT CATEGORIES WITH medicinecount = 0
			categories = productApi.data.data.products
			  .filter((cat: any) => cat.medicinecount && parseInt(String(cat.medicinecount)) > 0) // Filter out zero counts
			  .map((cat: any, idx: number) => ({
				cat_id: String(cat.cat_id ?? idx),
				cat_name: cat.cat_name ?? 'Uncategorized',
				status: cat.status ?? '1',
				med_type: cat.med_type ?? '0',
				parent_id: cat.parent_id ?? '0',
				contains_thc: cat.contains_thc ?? '0',
				is_default: cat.is_default ?? '0',
				product_cat_id: cat.product_cat_id ?? '0',
				medicinecount: cat.medicinecount ?? 0,
				medicinearray: cat.medicinearray ?? 0,
				bg: cat.bg ?? null,
			  }));
			
			// Extract actual products from medicinearray within each category
			const allProducts: MedicineProduct[] = [];
			categories.forEach((cat) => {
			  // medicinearray is a 2D array, flatten it to get all medicines
			  if (Array.isArray(cat.medicinearray) && cat.medicinearray.length > 0) {
				const medicinesInCategory = cat.medicinearray.flat(); // Flatten the nested array
				
				medicinesInCategory.forEach((med: any) => {
				  if (med && med.name) { // Only include valid products with names
					allProducts.push({
					  med_id: String(med.med_id ?? med.id ?? ''),
					  name: med.name ?? 'Unknown Product',
					  cat_name: cat.cat_name,
					  value1: String(med.value1 ?? med.org_value1 ?? 'Each'),
					  value2: String(med.value2 ?? med.org_value2 ?? '0'),
					  image: med.med_img_url ?? null,
					  med_image_url: med.med_img_url ?? null,
					  med_img: med.med_img ?? null,
					  med_type: med.med_type ?? '0',
					  med_value: med.med_value ?? '',
					  thc: med.thc ?? med.delta_thc ?? '',
					  cbd: med.cbd ?? '',
					  terepenes: med.terepenes ?? '',
					  strain: med.strain ?? '',
					  strain_cat: med.strain_cat ?? '',
					  org_value1: med.org_value1 ?? med.value1 ?? 'Each',
					  org_value2: med.org_value2 ?? med.value2 ?? '0',
					  business_name: dispensary?.name ?? '',
					  brand_name: med.brand_name ?? null,
					  ...med, // preserve all other fields
					});
				  }
				});
			  }
			});
			
			

			// Store medicine products separately for modal display
			setMedicineProducts(allProducts);

			// Convert products to display-friendly format
			products = allProducts.map((prod: any, idx: number) => ({
			  id: String(prod.med_id ?? prod.id ?? idx),
			  name: prod.name ?? `Product ${idx + 1}`,
			  price: prod.value2 ? parseFloat(String(prod.value2)) : 0,
			  category: prod.cat_name ?? 'Uncategorized',
			  strain_type: prod.strain_type ?? undefined,
			  thc_percentage: prod.thc ? parseFloat(String(prod.thc)) : undefined,
			  cbd_percentage: prod.cbd ? parseFloat(String(prod.cbd)) : undefined,
			  image: prod.med_image_url ?? prod.med_img ?? null,
			  unit: prod.value1 ?? 'Each',
			  in_stock: true,
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
    setSelectedProduct(product);
    setSelectedProductIndex(index);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  const goToPreviousProduct = () => {
    if (selectedProductIndex > 0) {
      const prevProduct = medicineProducts[selectedProductIndex - 1];
      openProductModal(prevProduct, selectedProductIndex - 1);
    }
  };

  const goToNextProduct = () => {
    if (selectedProductIndex < medicineProducts.length - 1) {
      const nextProduct = medicineProducts[selectedProductIndex + 1];
      openProductModal(nextProduct, selectedProductIndex + 1);
    }
  };

  // Filter products by selected category
  const filteredMedicineProducts = useMemo(() => {
    return medicineProducts.filter((product) => {
      if (selectedCategory === 'all') return true;
      // Find the category that matches selectedCategory (cat_id)
      const selectedCat = categories.find(c => c.cat_id === selectedCategory);
      if (!selectedCat) return false;
	  console.log(product);
      // Match products by the category's name (cat_name)
      return product.cat_name === selectedCat.cat_name;
    });
  }, [selectedCategory, categories, medicineProducts]);
			

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
          <p className="text-gray-600 font-medium">Loading dispensary...</p>
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gray-200">
        {dispensary.cover_image ? (
          <img
            src={dispensary.cover_image}
            alt={dispensary.name}
            className="absolute inset-0 w-full h-full object-cover"
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
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-gray-700" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
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
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
                  <Leaf className="w-12 h-12 text-white" />
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
                  onClick={() => setSelectedCategory('all')}
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
                  const count = medicineProducts.filter(p => p.cat_name === category.cat_name).length;
                  return (
                    <button
                      key={category.cat_id}
                      onClick={() => setSelectedCategory(category.cat_id)}
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
                  {filteredMedicineProducts.map((product, idx) => (
                    <div
                      key={product.med_id}
                      onClick={() => openProductModal(product, idx)}
                      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group`}
                    >
                      <div className="relative aspect-square bg-gray-100">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
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
                          <div>
                            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${product.value2}</span>
                          </div>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{product.value1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMedicineProducts.map((product, idx) => (
                    <div
                      key={product.med_id}
                      onClick={() => openProductModal(product, idx)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex gap-4"
                    >
                      <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
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
                            <span className="font-bold text-gray-900">${product.value2}</span>
                            <span className="text-sm text-gray-500 ml-1">/ {product.value1}</span>
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
                        {renderStars(review.rating)}
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mt-3 leading-relaxed`}>{review.comment}</p>
                        <button className={`flex items-center gap-2 text-sm mt-3 transition-colors ${isDarkMode ? 'text-gray-500 hover:text-teal-400' : 'text-gray-500 hover:text-teal-600'}`}>
                          <ThumbsUp className="w-4 h-4" />
                          Helpful ({review.helpful_count})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${
                isDarkMode 
                  ? 'border border-teal-500 text-teal-400 hover:bg-teal-500/10' 
                  : 'border border-teal-600 text-teal-600 hover:bg-teal-50'
              }`}>
                Write a Review
              </button>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="p-6">
              {/* Description */}
              {dispensary.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed">{dispensary.description}</p>
                </div>
              )}

              {/* Hours */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hours</h3>
                <div className="space-y-2">
                  {(showAllHours ? dispensary.hours : dispensary.hours.slice(0, 3)).map((day) => {
                    const isToday = day.day === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
                    const normalizedOpen = day.open ? normalizeTimeFormat(day.open) : null;
                    const normalizedClose = day.close ? normalizeTimeFormat(day.close) : null;
                    const display = normalizedOpen && normalizedClose ? `${convertTo12HourFormat(normalizedOpen)} - ${convertTo12HourFormat(normalizedClose)}` : (day.is_closed ? 'Closed' : 'Hours not available');
                    return (
                      <div key={day.day} className={`flex justify-between text-sm py-2 px-3 rounded ${isToday ? 'bg-teal-50' : ''}`}>
                        <span className={`${isToday ? 'font-semibold text-teal-700' : 'text-gray-600'}`}>
                          {day.day} {isToday && '(Today)'}
                        </span>
                        <span className={`font-medium ${isToday ? 'text-teal-700' : 'text-gray-900'}`}>
                          { (normalizedOpen === '00:00' && normalizedClose === '23:59') ? 'Open 24 hours' : display }
                        </span>
                      </div>
                    );
                  })}
                </div>
                {dispensary.hours.length > 3 && (
                  <button
                    onClick={() => setShowAllHours(!showAllHours)}
                    className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-2"
                  >
                    {showAllHours ? 'Show less' : 'Show all hours'}
                  </button>
                )}
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dispensary.amenities.map((amenity) => {
                    const info = amenityInfo[amenity];
                    if (!info) return null;
                    const Icon = info.icon;
                    return (
                      <div key={amenity} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-teal-600" />
                        </div>
                        <span className="text-gray-700 font-medium">{info.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* License */}
              {dispensary.license_number && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">License Information</h3>
                  <p className="text-gray-700">License #: {dispensary.license_number}</p>
                </div>
              )}

              {/* Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact</h3>
                <div className="space-y-3">
                  {dispensary.phone && (
                    <a href={`tel:${dispensary.phone}`} className="flex items-center gap-3 text-teal-600 hover:text-teal-700 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5" />
                      <span className="font-medium">{dispensary.phone}</span>
                    </a>
                  )}
                  {dispensary.email && (
                    <a href={`mailto:${dispensary.email}`} className="flex items-center gap-3 text-teal-600 hover:text-teal-700 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">{dispensary.email}</span>
                    </a>
                  )}
                  {dispensary.website && (
                    <a href={dispensary.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-teal-600 hover:text-teal-700 p-3 bg-gray-50 rounded-lg">
                      <Globe className="w-5 h-5" />
                      <span className="font-medium">Visit Website</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dispensary Orders Tab - Only visible to Admin and Owner */}
          {activeTab === 'dispensary-orders' && (isAdmin || isDispensaryOwner) && (
            <div className="p-6">
              {/* Orders View Navigation */}
              <div className={`flex gap-2 mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pb-4`}>
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: ShoppingBag },
                  { id: 'orders', label: 'Orders', icon: ShoppingBag },
                  { id: 'customers', label: 'Customers', icon: Users },
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setOrdersView(view.id as any)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                      ordersView === view.id
                        ? 'bg-teal-600 text-white'
                        : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }`}
                  >
                    <view.icon className="w-4 h-4" />
                    {view.label}
                  </button>
                ))}
              </div>

              {/* Dashboard View */}
              {ordersView === 'dashboard' && (
                <div className="space-y-6">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Orders Dashboard
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</p>
                      <p className="text-3xl font-bold text-teal-600 mt-2">{ordersDashboardMetrics.total_orders}</p>
                    </div>
                    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">${ordersDashboardMetrics.total_revenue.toFixed(2)}</p>
                    </div>
                    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Orders</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-2">{ordersDashboardMetrics.pending_orders}</p>
                    </div>
                    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed Orders</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{ordersDashboardMetrics.completed_orders}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders List View */}
              {ordersView === 'orders' && (
                <div className="space-y-6">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Orders
                  </h3>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => {
                            setSelectedOrder({
                              ...order,
                              items: [],
                              customer_email: order.customer_email || '',
                              customer_phone: order.customer_phone || '',
                            } as any);
                            setOrdersView('order-detail');
                          }}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors hover:shadow-md ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Order #{order.order_number}
                              </p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {order.customer_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-teal-600">${order.total_amount.toFixed(2)}</p>
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  order.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.status === 'processing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Order Detail View */}
              {ordersView === 'order-detail' && selectedOrder && (
                <div className="space-y-6">
                  <button
                    onClick={() => setOrdersView('orders')}
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Orders
                  </button>

                  <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Order #{selectedOrder.order_number}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(selectedOrder.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <select
                        defaultValue={selectedOrder.status}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-gray-700 border border-gray-600 text-white'
                            : 'border border-gray-300 bg-white text-gray-900'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-6 pb-6 border-b border-gray-700">
                      <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Customer Info</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Name</p>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedOrder.customer_name}</p>
                        </div>
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                          <a
                            href={`mailto:${selectedOrder.customer_email}`}
                            className="text-teal-600 hover:text-teal-700"
                          >
                            {selectedOrder.customer_email}
                          </a>
                        </div>
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
                          <a href={`tel:${selectedOrder.customer_phone}`} className="text-teal-600 hover:text-teal-700">
                            {selectedOrder.customer_phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Items</h4>
                      <div className="space-y-3">
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex justify-between p-3 rounded-lg ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                              }`}
                            >
                              <div>
                                <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{item.product_name}</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Qty: {item.quantity} x ${item.unit_price.toFixed(2)}
                                </p>
                              </div>
                              <p className="font-semibold text-teal-600">${item.total_price.toFixed(2)}</p>
                            </div>
                          ))
                        ) : (
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No items in order</p>
                        )}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className={`text-right pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className="text-lg font-bold text-teal-600">
                        Total: ${selectedOrder.total_amount.toFixed(2)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                      <button className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors">
                        Mark as Shipped
                      </button>
                      <button className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors">
                        Cancel Order
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customers View */}
              {ordersView === 'customers' && (
                <div className="space-y-6">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Customers
                  </h3>
                  {customers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No customers found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customers.map((customer) => (
                        <div
                          key={customer.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {customer.name}
                              </p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {customer.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {customer.total_orders} orders
                              </p>
                              <p className="font-semibold text-teal-600">
                                ${customer.total_spent.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
    medicineProducts={medicineProducts}
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