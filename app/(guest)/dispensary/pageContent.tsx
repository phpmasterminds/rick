'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Loader2, Search, MapPin, Star, Clock, Phone, Filter, ChevronDown,
  Grid, List, Heart, Navigation, Verified, Leaf, X, Truck, Car, 
  Accessibility, BadgePercent, CreditCard
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// API Response interface matching the backend
interface APIDispensaryResponse {
  page_id: string;
  title: string;
  vanity_url: string;
  image_path?: string;
  image_path_url?: string;
  text?: string;
  locs_lon?: string;
  locs_lat?: string;
  locs_id?: string;
  locs_name?: string;
  locs_city?: string;
  locs_zip?: string;
  locs_street?: string;
  locs_phone?: string;
  locs_provides?: string; // "Medical" | "Recreational" | "Both"
  locs_accept_delivery?: string; // "0" | "1"
  locs_accept_pickup?: string; // "0" | "1"
  locs_accept_curbside?: string; // "0" | "1"
  locs_veteran?: string; // "0" | "1"
  locs_wheelchair?: string; // "0" | "1"
  locs_is_atm?: string; // "0" | "1"
  locs_hours_status?: string; // "0" | "1"
  locs_hr_mon_op?: string;
  locs_hr_mon_cl?: string;
  locs_hr_tue_op?: string;
  locs_hr_tue_cl?: string;
  locs_hr_wed_op?: string;
  locs_hr_wed_cl?: string;
  locs_hr_thu_op?: string;
  locs_hr_thu_cl?: string;
  locs_hr_fri_op?: string;
  locs_hr_fri_cl?: string;
  locs_hr_sat_op?: string;
  locs_hr_sat_cl?: string;
  locs_hr_sun_op?: string;
  locs_hr_sun_cl?: string;
  locs_mon_status?: string;
  locs_tue_status?: string;
  locs_wed_status?: string;
  locs_thu_status?: string;
  locs_fri_status?: string;
  locs_sat_status?: string;
  locs_sun_status?: string;
  store_hours?: string;
  average_rating?: number;
  rating_number?: number;
  medicine_count?: string;
  is_featured?: string;
  is_claimed?: string;
  feature_type?: string;
  country_iso?: string;
  user_group_id?: string;
  full_name?: string;
  link?: string;
}

interface Dispensary {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  cover_image?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  rating: number;
  review_count: number;
  is_open: boolean;
  opening_time?: string;
  closing_time?: string;
  store_hours?: string;
  license_number?: string;
  business_type: 'dispensary' | 'delivery' | 'both';
  amenities: string[];
  is_verified: boolean;
  is_medical: boolean;
  is_recreational: boolean;
  distance?: number;
  featured?: boolean;
  medicine_count?: number;
  latitude?: number;
  longitude?: number;
}

interface FilterState {
  type: string; // 'all' | 'medical' | 'recreational'
  amenities: string[];
  open_now: boolean;
  rating: number;
  // API filter fields
  locs_provides: string; // 'all' | 'Medical' | 'Recreational'
  locs_accept_delivery: boolean;
  locs_accept_pickup: boolean;
  locs_accept_curbside: boolean;
  locs_veteran: boolean;
  locs_wheelchair: boolean;
  locs_is_atm: boolean;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Sample Data for fallback
const sampleDispensaries: Dispensary[] = [
  {
    id: '1',
    name: 'The Green Solution',
    slug: 'the-green-solution',
    logo: 'https://images.unsplash.com/photo-1589484535988-f7d6cc6e0d5e?w=200&h=200&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=400&fit=crop',
    address: '2601 W Alameda Ave',
    city: 'Denver',
    state: 'CO',
    zip_code: '80219',
    phone: '(303) 990-9723',
    rating: 4.8,
    review_count: 1245,
    is_open: true,
    opening_time: '8:00 AM',
    closing_time: '9:45 PM',
    license_number: 'MED-403R-0012',
    business_type: 'dispensary',
    amenities: ['atm', 'parking', 'wheelchair', 'veteran_discount'],
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 0.8,
    featured: true,
  },
  {
    id: '2',
    name: 'Native Roots',
    slug: 'native-roots',
    logo: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=200&h=200&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1587754557659-4aebb7bc0650?w=800&h=400&fit=crop',
    address: '1536 Wazee St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80202',
    phone: '(720) 458-9663',
    rating: 4.6,
    review_count: 892,
    is_open: true,
    opening_time: '9:00 AM',
    closing_time: '9:00 PM',
    license_number: 'MED-403R-0045',
    business_type: 'both',
    amenities: ['atm', 'parking', 'delivery', 'curbside'],
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 1.2,
    featured: true,
  },
  {
    id: '3',
    name: 'LivWell Enlightened Health',
    slug: 'livwell-enlightened-health',
    logo: 'https://images.unsplash.com/photo-1571942676516-bcab84649e44?w=200&h=200&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1585063560314-dab87cc48ac5?w=800&h=400&fit=crop',
    address: '1538 Wazee St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80202',
    phone: '(303) 455-4430',
    rating: 4.5,
    review_count: 756,
    is_open: false,
    opening_time: '10:00 AM',
    closing_time: '7:00 PM',
    license_number: 'MED-403R-0078',
    business_type: 'dispensary',
    amenities: ['atm', 'wheelchair', 'veteran_discount'],
    is_verified: true,
    is_medical: true,
    is_recreational: false,
    distance: 1.5,
    featured: false,
  },
  {
    id: '4',
    name: 'Starbuds',
    slug: 'starbuds',
    logo: 'https://images.unsplash.com/photo-1585063560314-dab87cc48ac5?w=200&h=200&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1589484535988-f7d6cc6e0d5e?w=800&h=400&fit=crop',
    address: '4690 Brighton Blvd',
    city: 'Denver',
    state: 'CO',
    zip_code: '80216',
    phone: '(720) 379-5948',
    rating: 4.7,
    review_count: 623,
    is_open: true,
    opening_time: '8:00 AM',
    closing_time: '11:00 PM',
    license_number: 'REC-403R-0156',
    business_type: 'dispensary',
    amenities: ['parking', 'wheelchair', 'curbside', 'delivery'],
    is_verified: true,
    is_medical: false,
    is_recreational: true,
    distance: 2.3,
    featured: false,
  },
  {
    id: '5',
    name: 'Medicine Man Denver',
    slug: 'medicine-man-denver',
    logo: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=200&h=200&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=400&fit=crop',
    address: '4750 Nome St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80239',
    phone: '(303) 373-0752',
    rating: 4.9,
    review_count: 1567,
    is_open: true,
    opening_time: '8:00 AM',
    closing_time: '9:45 PM',
    license_number: 'MED-403R-0023',
    business_type: 'both',
    amenities: ['atm', 'parking', 'wheelchair', 'veteran_discount', 'delivery'],
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 3.1,
    featured: true,
  },
  {
    id: '6',
    name: 'Diego Pellicer',
    slug: 'diego-pellicer',
    logo: 'https://images.unsplash.com/photo-1571942676516-bcab84649e44?w=200&h=200&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1587754557659-4aebb7bc0650?w=800&h=400&fit=crop',
    address: '2949 W Alameda Ave',
    city: 'Denver',
    state: 'CO',
    zip_code: '80219',
    phone: '(303) 955-0186',
    rating: 4.4,
    review_count: 412,
    is_open: true,
    opening_time: '9:00 AM',
    closing_time: '8:00 PM',
    license_number: 'REC-403R-0234',
    business_type: 'dispensary',
    amenities: ['parking', 'wheelchair'],
    is_verified: false,
    is_medical: false,
    is_recreational: true,
    distance: 3.5,
    featured: false,
  },
  {
    id: '7',
    name: 'Green Dragon Cannabis',
    slug: 'green-dragon-cannabis',
    logo: 'https://images.unsplash.com/photo-1589484535988-f7d6cc6e0d5e?w=200&h=200&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1585063560314-dab87cc48ac5?w=800&h=400&fit=crop',
    address: '1517 N Marion St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80218',
    phone: '(720) 328-4420',
    rating: 4.3,
    review_count: 289,
    is_open: false,
    opening_time: '10:00 AM',
    closing_time: '7:00 PM',
    license_number: 'MED-403R-0189',
    business_type: 'delivery',
    amenities: ['delivery', 'curbside'],
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 4.2,
    featured: false,
  },
  {
    id: '8',
    name: 'Kind Love',
    slug: 'kind-love',
    logo: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=200&h=200&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=400&fit=crop',
    address: '2369 S Delaware St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80223',
    phone: '(720) 252-4387',
    rating: 4.8,
    review_count: 934,
    is_open: true,
    opening_time: '9:00 AM',
    closing_time: '9:50 PM',
    license_number: 'MED-403R-0067',
    business_type: 'dispensary',
    amenities: ['atm', 'parking', 'wheelchair', 'veteran_discount', 'curbside'],
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 4.8,
    featured: true,
  },
];

const amenityOptions = [
  { id: 'atm', label: 'ATM', icon: '🏧', apiField: 'locs_is_atm' },
  { id: 'parking', label: 'Parking', icon: '🅿️', apiField: null },
  { id: 'wheelchair', label: 'ADA Accessible', icon: '♿', apiField: 'locs_wheelchair' },
  { id: 'veteran_discount', label: 'Veteran Discount', icon: '🎖️', apiField: 'locs_veteran' },
  { id: 'curbside', label: 'Curbside Pickup', icon: '🚗', apiField: 'locs_accept_curbside' },
  { id: 'delivery', label: 'Delivery', icon: '🚚', apiField: 'locs_accept_delivery' },
  { id: 'pickup', label: 'In-Store Pickup', icon: '🏪', apiField: 'locs_accept_pickup' },
];

// Helper function to format time from "800" to "8:00 AM"
const formatTime = (time?: string): string => {
  if (!time) return '';
  const hours = parseInt(time.slice(0, -2) || '0');
  const minutes = time.slice(-2);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes} ${period}`;
};

// Helper function to validate image URL
const isValidImageUrl = (url?: string): boolean => {
  if (!url || url.trim() === '') return false;
  
  // Check if it's a valid URL format
  try {
    new URL(url);
  } catch {
    return false;
  }
  
  // Check for common image extensions or known image URL patterns
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowerUrl = url.toLowerCase();
  
  // Check if URL has image extension
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
  
  // Check if URL contains common image path patterns
  const hasImagePath = lowerUrl.includes('/pic/') || 
                       lowerUrl.includes('/image/') || 
                       lowerUrl.includes('/images/') || 
                       lowerUrl.includes('/photo/') ||
                       lowerUrl.includes('/file/');
  
  return hasImageExtension || hasImagePath;
};

// Helper function to get the best available image
const getBestImageUrl = (imagePathUrl?: string, imagePath?: string): string | undefined => {
  // First try image_path_url
  if (isValidImageUrl(imagePathUrl)) {
    return imagePathUrl;
  }
  
  // Then try image_path
  if (isValidImageUrl(imagePath)) {
    return imagePath;
  }
  
  // Return undefined if no valid image
  return undefined;
};

// Helper function to check if store is currently open
const isStoreOpen = (apiData: APIDispensaryResponse): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const dayMap: { [key: number]: { status: string; open: string; close: string } } = {
    0: { status: apiData.locs_sun_status || '0', open: apiData.locs_hr_sun_op || '', close: apiData.locs_hr_sun_cl || '' },
    1: { status: apiData.locs_mon_status || '0', open: apiData.locs_hr_mon_op || '', close: apiData.locs_hr_mon_cl || '' },
    2: { status: apiData.locs_tue_status || '0', open: apiData.locs_hr_tue_op || '', close: apiData.locs_hr_tue_cl || '' },
    3: { status: apiData.locs_wed_status || '0', open: apiData.locs_hr_wed_op || '', close: apiData.locs_hr_wed_cl || '' },
    4: { status: apiData.locs_thu_status || '0', open: apiData.locs_hr_thu_op || '', close: apiData.locs_hr_thu_cl || '' },
    5: { status: apiData.locs_fri_status || '0', open: apiData.locs_hr_fri_op || '', close: apiData.locs_hr_fri_cl || '' },
    6: { status: apiData.locs_sat_status || '0', open: apiData.locs_hr_sat_op || '', close: apiData.locs_hr_sat_cl || '' },
  };
  
  const todayHours = dayMap[dayOfWeek];
  
  // If the day is marked as closed
  if (todayHours.status === '1') return false;
  
  const openTime = parseInt(todayHours.open) || 0;
  const closeTime = parseInt(todayHours.close) || 0;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

// Transform API response to Dispensary interface
const transformAPIResponse = (apiData: APIDispensaryResponse): Dispensary => {
  const amenities: string[] = [];
  
  if (apiData.locs_is_atm === '1') amenities.push('atm');
  if (apiData.locs_wheelchair === '1') amenities.push('wheelchair');
  if (apiData.locs_veteran === '1') amenities.push('veteran_discount');
  if (apiData.locs_accept_curbside === '1') amenities.push('curbside');
  if (apiData.locs_accept_delivery === '1') amenities.push('delivery');
  if (apiData.locs_accept_pickup === '1') amenities.push('pickup');
  
  const provides = apiData.locs_provides?.toLowerCase() || '';
  const isMedical = provides === 'medical' || provides === 'both';
  const isRecreational = provides === 'recreational' || provides === 'both';
  
  let businessType: 'dispensary' | 'delivery' | 'both' = 'dispensary';
  if (apiData.locs_accept_delivery === '1' && apiData.locs_accept_pickup !== '1') {
    businessType = 'delivery';
  } else if (apiData.locs_accept_delivery === '1' && apiData.locs_accept_pickup === '1') {
    businessType = 'both';
  }
  
  // Get today's hours
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayKeys: { [key: number]: { open: string; close: string } } = {
    0: { open: apiData.locs_hr_sun_op || '', close: apiData.locs_hr_sun_cl || '' },
    1: { open: apiData.locs_hr_mon_op || '', close: apiData.locs_hr_mon_cl || '' },
    2: { open: apiData.locs_hr_tue_op || '', close: apiData.locs_hr_tue_cl || '' },
    3: { open: apiData.locs_hr_wed_op || '', close: apiData.locs_hr_wed_cl || '' },
    4: { open: apiData.locs_hr_thu_op || '', close: apiData.locs_hr_thu_cl || '' },
    5: { open: apiData.locs_hr_fri_op || '', close: apiData.locs_hr_fri_cl || '' },
    6: { open: apiData.locs_hr_sat_op || '', close: apiData.locs_hr_sat_cl || '' },
  };
  
  const todayHours = dayKeys[dayOfWeek];
  
  // Get the best available image URL
  const bestImage = getBestImageUrl(apiData.image_path_url, apiData.image_path);
  
  return {
    id: apiData.page_id,
    name: apiData.title,
    slug: apiData.vanity_url,
    logo: bestImage,
    cover_image: bestImage,
    address: apiData.locs_street || '',
    city: apiData.locs_city || '',
    state: apiData.country_iso || 'OK',
    zip_code: apiData.locs_zip || '',
    phone: apiData.locs_phone,
    rating: apiData.average_rating || 0,
    review_count: apiData.rating_number || 0,
    is_open: isStoreOpen(apiData),
    opening_time: formatTime(todayHours.open),
    closing_time: formatTime(todayHours.close),
    store_hours: apiData.store_hours,
    business_type: businessType,
    amenities,
    is_verified: apiData.is_claimed === '1',
    is_medical: isMedical,
    is_recreational: isRecreational,
    featured: apiData.is_featured === '1' || apiData.feature_type === '1',
    medicine_count: parseInt(apiData.medicine_count || '0'),
    latitude: parseFloat(apiData.locs_lat || '0'),
    longitude: parseFloat(apiData.locs_lon || '0'),
  };
};

export default function DispensaryListingPage() {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [filteredDispensaries, setFilteredDispensaries] = useState<Dispensary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [useSampleData, setUseSampleData] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 12,
    total: 0,
    hasMore: true,
  });

  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    amenities: [],
    open_now: false,
    rating: 0,
    locs_provides: 'all',
    locs_accept_delivery: false,
    locs_accept_pickup: false,
    locs_accept_curbside: false,
    locs_veteran: false,
    locs_wheelchair: false,
    locs_is_atm: false,
  });

  // Build API filter params
  const buildFilterParams = useCallback(() => {
    const params: Record<string, string | number> = {
      page: pagination.page,
      limit: pagination.limit,
    };

    // Type filter (Medical/Recreational)
    if (filters.locs_provides !== 'all') {
      params.locs_provides = filters.locs_provides;
    }

    // Amenity filters
    if (filters.locs_accept_delivery) params.locs_accept_delivery = '1';
    if (filters.locs_accept_pickup) params.locs_accept_pickup = '1';
    if (filters.locs_accept_curbside) params.locs_accept_curbside = '1';
    if (filters.locs_veteran) params.locs_veteran = '1';
    if (filters.locs_wheelchair) params.locs_wheelchair = '1';
    if (filters.locs_is_atm) params.locs_is_atm = '1';

    // Search query
    if (searchQuery) {
      params.search = searchQuery;
    }

    // Sort
    if (sortBy) {
      params.sort = sortBy;
    }

    return params;
  }, [filters, pagination.page, pagination.limit, searchQuery, sortBy]);

  // Fetch dispensaries with pagination
  const fetchDispensaries = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = buildFilterParams();
      params.page = page;

      const response = await axios.get('/api/business/dispensaries', { params });
      
      if (response.data.status === 'success' && response.data.data) {
        const apiData = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data.business || [];
        
        if (apiData.length > 0) {
          const transformedData = apiData.map(transformAPIResponse);
          
          if (append) {
            setDispensaries(prev => [...prev, ...transformedData]);
          } else {
            setDispensaries(transformedData);
          }
          
          // Update pagination state
          const total = response.data.data.total || response.data.total || apiData.length;
          const hasMore = page * pagination.limit < total;
          
          setPagination(prev => ({
            ...prev,
            page,
            total,
            hasMore,
          }));
          
          setUseSampleData(false);
        } else if (page === 1) {
          // No data from API, use sample data
          setDispensaries(sampleDispensaries);
          setPagination(prev => ({
            ...prev,
            page: 1,
            total: sampleDispensaries.length,
            hasMore: false,
          }));
          setUseSampleData(true);
        } else {
          // No more data to load
          setPagination(prev => ({ ...prev, hasMore: false }));
        }
      } else if (page === 1) {
        // Use sample data on initial load failure
        setDispensaries(sampleDispensaries);
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: sampleDispensaries.length,
          hasMore: false,
        }));
        setUseSampleData(true);
      }
    } catch (error) {
      console.error('Error fetching dispensaries:', error);
      if (page === 1) {
        // Use sample data on error
        setDispensaries(sampleDispensaries);
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: sampleDispensaries.length,
          hasMore: false,
        }));
        setUseSampleData(true);
      } else {
        toast.error('Failed to load more dispensaries');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildFilterParams, pagination.limit]);

  // Load more dispensaries
  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.hasMore && !useSampleData) {
      fetchDispensaries(pagination.page + 1, true);
    }
  }, [loadingMore, pagination.hasMore, pagination.page, fetchDispensaries, useSampleData]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && pagination.hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, pagination.hasMore, loadingMore, loading]);

  // Apply client-side filters and search (for sample data or additional filtering)
  useEffect(() => {
    let result = [...dispensaries];

    // Client-side search filter (always apply for immediate feedback)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.city.toLowerCase().includes(query) ||
          d.address.toLowerCase().includes(query)
      );
    }

    // Type filter (client-side for sample data)
    if (useSampleData && filters.type !== 'all') {
      if (filters.type === 'medical') {
        result = result.filter((d) => d.is_medical);
      } else if (filters.type === 'recreational') {
        result = result.filter((d) => d.is_recreational);
      } else if (filters.type === 'delivery') {
        result = result.filter((d) => d.business_type === 'delivery' || d.business_type === 'both');
      }
    }

    // Open now filter
    if (filters.open_now) {
      result = result.filter((d) => d.is_open);
    }

    // Rating filter
    if (filters.rating > 0) {
      result = result.filter((d) => d.rating >= filters.rating);
    }

    // Amenities filter (client-side for sample data)
    if (useSampleData && filters.amenities.length > 0) {
      result = result.filter((d) =>
        filters.amenities.every((amenity) => d.amenities.includes(amenity))
      );
    }

    // Sort
    switch (sortBy) {
      case 'distance':
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result.sort((a, b) => b.review_count - a.review_count);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredDispensaries(result);
  }, [dispensaries, searchQuery, filters, sortBy, useSampleData]);

  // Re-fetch when filters change (for API data)
  useEffect(() => {
    if (!useSampleData) {
      // Debounce the API call
      const timeoutId = setTimeout(() => {
        fetchDispensaries(1, false);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [filters.locs_provides, filters.locs_accept_delivery, filters.locs_accept_pickup, 
      filters.locs_accept_curbside, filters.locs_veteran, filters.locs_wheelchair, 
      filters.locs_is_atm, sortBy]);

  // Initialize
  useEffect(() => {
    fetchDispensaries(1, false);
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('dispensary_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem('dispensary_favorites', JSON.stringify(newFavorites));
  };

  // Toggle amenity filter (API-based)
  const toggleAmenityFilter = (amenityId: string, apiField: string | null) => {
    if (apiField) {
      const filterKey = apiField as keyof FilterState;
      setFilters((prev) => ({
        ...prev,
        [filterKey]: !prev[filterKey],
      }));
    }
    
    // Also update the amenities array for UI state
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: 'all',
      amenities: [],
      open_now: false,
      rating: 0,
      locs_provides: 'all',
      locs_accept_delivery: false,
      locs_accept_pickup: false,
      locs_accept_curbside: false,
      locs_veteran: false,
      locs_wheelchair: false,
      locs_is_atm: false,
    });
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDispensaries(1, false);
  };

  // Handle search with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (!useSampleData) {
      // Reset pagination and fetch with new search
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [useSampleData]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.type !== 'all' || 
    filters.amenities.length > 0 || 
    filters.open_now || 
    filters.rating > 0 || 
    filters.locs_provides !== 'all' ||
    filters.locs_accept_delivery ||
    filters.locs_accept_pickup ||
    filters.locs_accept_curbside ||
    filters.locs_veteran ||
    filters.locs_wheelchair ||
    filters.locs_is_atm ||
    searchQuery;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Finding dispensaries near you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Find Dispensaries Near You</h1>
          <p className="text-teal-100 text-lg mb-8">
            Discover licensed cannabis dispensaries, delivery services, and more
          </p>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, city, or address..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <button
              onClick={() => router.push('/map')}
              className="px-6 py-4 bg-white text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              View Map
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter - Medical/Recreational */}
              <select
                value={filters.locs_provides}
                onChange={(e) => setFilters((prev) => ({ ...prev, locs_provides: e.target.value, type: e.target.value === 'Medical' ? 'medical' : e.target.value === 'Recreational' ? 'recreational' : 'all' }))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Types</option>
                <option value="Medical">Medical</option>
                <option value="Recreational">Recreational</option>
              </select>

              {/* Delivery Filter */}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, locs_accept_delivery: !prev.locs_accept_delivery }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filters.locs_accept_delivery
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Truck className="w-4 h-4" />
                Delivery
              </button>

              {/* Pickup Filter */}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, locs_accept_pickup: !prev.locs_accept_pickup }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filters.locs_accept_pickup
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Car className="w-4 h-4" />
                Pickup
              </button>

              {/* Open Now Toggle */}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, open_now: !prev.open_now }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filters.open_now
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                Open Now
              </button>

              {/* Rating Filter */}
              <select
                value={filters.rating}
                onChange={(e) => setFilters((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={0}>Any Rating</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>

              {/* More Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                More Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="distance">Nearest</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
                <option value="name">Name A-Z</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amenities */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {amenityOptions.map((amenity) => {
                      const isActive = amenity.apiField 
                        ? filters[amenity.apiField as keyof FilterState] === true
                        : filters.amenities.includes(amenity.id);
                      
                      return (
                        <button
                          key={amenity.id}
                          onClick={() => toggleAmenityFilter(amenity.id, amenity.apiField)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                            isActive
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{amenity.icon}</span>
                          {amenity.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Quick Filters */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Quick Filters</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Veteran Discount */}
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, locs_veteran: !prev.locs_veteran }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        filters.locs_veteran
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <BadgePercent className="w-4 h-4" />
                      Veteran Discount
                    </button>

                    {/* Wheelchair Accessible */}
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, locs_wheelchair: !prev.locs_wheelchair }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        filters.locs_wheelchair
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Accessibility className="w-4 h-4" />
                      ADA Accessible
                    </button>

                    {/* ATM Available */}
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, locs_is_atm: !prev.locs_is_atm }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        filters.locs_is_atm
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      ATM Available
                    </button>

                    {/* Curbside */}
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, locs_accept_curbside: !prev.locs_accept_curbside }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        filters.locs_accept_curbside
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      Curbside Pickup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredDispensaries.length}</span> 
            {pagination.total > 0 && !useSampleData && (
              <span> of <span className="font-semibold text-gray-900">{pagination.total}</span></span>
            )} dispensaries
          </p>
          {useSampleData && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Showing sample data
            </span>
          )}
        </div>

        {/* Dispensary Grid/List */}
        {filteredDispensaries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No dispensaries found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDispensaries.map((dispensary) => (
              <div
                key={dispensary.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/${dispensary.slug}`)}
              >
                {/* Cover Image */}
                <div className="relative h-48 bg-gray-200">
                  {dispensary.cover_image ? (
                    <img
                      src={dispensary.cover_image}
                      alt={dispensary.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
                      <Leaf className="w-16 h-16 text-white/50" />
                    </div>
                  )}

                  {/* Featured Badge */}
                  {dispensary.featured && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                      FEATURED
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(dispensary.id);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(dispensary.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'
                      }`}
                    />
                  </button>

                  {/* Open/Closed Badge */}
                  <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
                    dispensary.is_open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {dispensary.is_open ? 'Open Now' : dispensary.store_hours || 'Closed'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                        {dispensary.name}
                      </h3>
                      {dispensary.is_verified && (
                        <Verified className="w-5 h-5 text-teal-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {renderStars(dispensary.rating)}
                    <span className="text-sm font-semibold text-gray-900">{dispensary.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({dispensary.review_count} reviews)</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{dispensary.address}, {dispensary.city}</span>
                  </div>

                  {dispensary.distance && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                      <Navigation className="w-4 h-4 flex-shrink-0" />
                      <span>{dispensary.distance} mi away</span>
                    </div>
                  )}

                  {/* Medicine Count */}
                  {dispensary.medicine_count && dispensary.medicine_count > 0 && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                      <Leaf className="w-4 h-4 flex-shrink-0" />
                      <span>{dispensary.medicine_count} products available</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {dispensary.is_medical && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Medical</span>
                    )}
                    {dispensary.is_recreational && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Recreational</span>
                    )}
                    {dispensary.business_type === 'delivery' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">Delivery</span>
                    )}
                    {dispensary.amenities.includes('curbside') && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">Curbside</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDispensaries.map((dispensary) => (
              <div
                key={dispensary.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/${dispensary.slug}`)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="relative w-full md:w-64 h-48 md:h-auto bg-gray-200 flex-shrink-0">
                    {dispensary.cover_image ? (
                      <img
                        src={dispensary.cover_image}
                        alt={dispensary.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
                        <Leaf className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    {dispensary.featured && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                        FEATURED
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-900 hover:text-teal-600 transition-colors">
                            {dispensary.name}
                          </h3>
                          {dispensary.is_verified && (
                            <Verified className="w-5 h-5 text-teal-600" />
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            dispensary.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {dispensary.is_open ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(dispensary.rating)}
                          <span className="text-sm font-semibold text-gray-900">{dispensary.rating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({dispensary.review_count} reviews)</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(dispensary.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            favorites.includes(dispensary.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{dispensary.address}, {dispensary.city}, {dispensary.state}</span>
                      </div>
                      {dispensary.phone && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{dispensary.phone}</span>
                        </div>
                      )}
                      {dispensary.distance && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Navigation className="w-4 h-4 flex-shrink-0" />
                          <span>{dispensary.distance} mi away</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{dispensary.store_hours || `${dispensary.opening_time} - ${dispensary.closing_time}`}</span>
                      </div>
                      {dispensary.medicine_count && dispensary.medicine_count > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Leaf className="w-4 h-4 flex-shrink-0" />
                          <span>{dispensary.medicine_count} products</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {dispensary.is_medical && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Medical</span>
                      )}
                      {dispensary.is_recreational && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Recreational</span>
                      )}
                      {dispensary.amenities.slice(0, 4).map((amenity) => {
                        const amenityInfo = amenityOptions.find((a) => a.id === amenity);
                        return amenityInfo ? (
                          <span key={amenity} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {amenityInfo.icon} {amenityInfo.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Loader */}
        <div 
          ref={loadMoreRef}
          className="mt-8 flex justify-center"
        >
          {loadingMore && (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
              <span className="text-gray-600">Loading more dispensaries...</span>
            </div>
          )}
          
          {!loadingMore && pagination.hasMore && !useSampleData && filteredDispensaries.length > 0 && (
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Load More
            </button>
          )}
          
          {!pagination.hasMore && filteredDispensaries.length > 0 && (
            <p className="text-gray-500 py-4">
              You&apos;ve reached the end of the list
            </p>
          )}
        </div>
      </div>
    </div>
  );
}