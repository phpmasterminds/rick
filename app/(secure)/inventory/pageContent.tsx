'use client';
import React, { useEffect, useState } from 'react';
import {
  Bell, Home, Megaphone, Package, CreditCard, Settings, HelpCircle,
  Plus, X, Upload, Target, DollarSign, MousePointer, Eye, CheckCircle,
  ChevronDown, ChevronRight, Menu, User, LogOut, Users, Folder, Edit, 
  Loader2, AlertCircle, ChevronLeft, Copy, Trash2, FileText, MoreVertical
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from "@/components/StatCard";
import Link from "next/link";
import axios from "axios";
import { toast } from 'react-toastify';

// Helper function to get product image URL
const getProductImageUrl = (product: any): string => {
  // Try med_image_path first (from API)
  if (product.med_image && typeof product.med_image === 'string') {
    if (product.med_image.trim()) {
      return product.med_image;
    }
  }
  
  // Try image_url
  if (product.image_url && typeof product.image_url === 'string') {
    if (product.image_url.trim()) {
      return product.image_url;
    }
  }
  
  // Default fallback
  return 'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
};

interface Product {
  product_id: string;
  page_id: string;
  name: string;
  cat_name: string;
  sub_cat_name: string;
  strain_cat: string;
  tag_no: string;
  is_safe: string;
  enable_catalog: string; // "0" or "1"
  s_rooms: string | null;
  selected_rooms?: string[]; // Array from API
  enable_product: string; // "0" or "1" for PAGE
  is_sample: string; // "0" or "1" for PAGE
  p_offer_price: string;
  i_price?: string | null;
  i_deals: string | null;
  i_par: string | null;
  i_weight: string;
  i_onhand: string;
  i_safehand?: string | number; 
  i_total_weight: string;
  text_parsed: string;
  thc: string;
  cbd: string;
  bus_title: string;
  strain?: string;
  product_code?: string;
  med_image?: string;
  batch_id?: string;
  cat_id?: string;
  sub_cat_id?: string;
  cat_parent_id?: string; // Parent category ID
  fla_cat_id?: string;
  fle_cat_id?: string;
  fla_sub_cat_id?: string | number; // Subcategory for flavors
  bne_cat_id?: string | number; // Alternative subcategory ID
  fle_sub_cat_id?: string | number; // Alternative subcategory ID
  med_measurements?: string;
  value1?: string | number;
  value2?: string | number;
  value3?: string | number;
  value4?: string | number;
  value5?: string | number;
  value6?: string | number;
  value7?: string | number;
  variant_name?: string; // Product variant name
  flavors?: string; // Comma-separated flavors
}

interface Category {
  cat_id: string;
  cat_name: string;
  sub: Array<{
    cat_id: string;
    cat_name: string;
  }>;
}

interface ApiCategory {
  cat_id: string;
  cat_name: string;
}

interface Flavor {
  flavor_id: string;
  flavor_name: string;
}

interface Feeling {
  feeling_id: string;
  feeling_name: string;
}

interface ShakeSaleTier {
  tire_id: string;
  c_name: string;
  point_5_gram: string;
  gram_1: string;
  gram_2: string;
  gram_3_5: string;
  gram_7: string;
  gram_14: string;
  gram_28: string;
}

interface FlowerTier {
  tire_id: string;
  c_name?: string;
  [key: string]: string | undefined; // For dynamic properties like "1_gram", "3_point_5_gram", etc.
}

interface DealData {
  amount: string;
  percentage: string;
  scope_id: string | number;
  membership_id: string | number;
  type_id: string | number;
  minimum_quantity: string;
  minimum_spending: string;
  quantity_allowed: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_24_hours: boolean;
  days_of_week: string[];
  discount_name: string;
}

// Interfaces for dropdown options
interface DiscountType {
  id: number;
  type_name: string;
}

interface MembershipLevel {
  id: number;
  level_name: string;
}

interface DiscountScope {
  id: number;
  sco_name: string;
}

// Reusable PublishedToggle Component - Toggle Switches
function PublishedToggle({ product, onToggle }: { product: Product, onToggle: (id: string, status: string, type?: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {/* catalog Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Catalog</span>
        <button
          onClick={() => {
            const isCurrentlyPOS = product.enable_catalog === '1';
            onToggle(product.product_id, product.enable_catalog, 'CATALOG');
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
            product.enable_catalog === '1'
              ? 'accent-bg'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              product.enable_catalog === '1' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* PAGE Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Page</span>
        <button
          onClick={() => {
            const isCurrentlyPAGE = product.enable_product === '1';
            onToggle(product.product_id, product.enable_product, 'PAGE');
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
            product.enable_product === '1'
              ? 'accent-bg'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              product.enable_product === '1' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
	  
	  {/* Sample Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wholesale</span>
        <button
          onClick={() => {
            const isCurrentlyPAGE = product.is_sample === '1';
            onToggle(product.product_id, product.is_sample, 'SAMPLE');
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
            product.is_sample === '1'
              ? 'accent-bg'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              product.is_sample === '1' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function PageContent() {

  // Helper function to show error toast
  const showErrorToast = (error: any, defaultMessage: string = 'Something went wrong') => {
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        error.message || 
                        defaultMessage;
    toast.error(errorMessage, {
      position: 'bottom-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedCount, setDisplayedCount] = useState(30); // Initially show 30 products
  const [categoryProductCounts, setCategoryProductCounts] = useState<{[key: string]: number}>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isCloneMode, setIsCloneMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDealsModal, setShowDealsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dealsProduct, setDealsProduct] = useState<Product | null>(null);
  const [globalPageId, setGlobalPageId] = useState<string>('');
  
  // COA Modal State
  const [showCoaModal, setShowCoaModal] = useState(false);
  const [coaProductId, setCoaProductId] = useState<string | null>(null);
  const [coaTitle, setCoaTitle] = useState<string>('');
  const [coaFile, setCoaFile] = useState<File | null>(null);
  const [coaFilePreview, setCoaFilePreview] = useState<string>('');
  const [isUploadingCoa, setIsUploadingCoa] = useState(false);
  
  // Settings Dropdown State
  const [openSettingsDropdown, setOpenSettingsDropdown] = useState<string | null>(null);
  
  const [dealData, setDealData] = useState<DealData>({
    amount: '',
    percentage: '',
    scope_id: '',
    membership_id: '',
    type_id: '',
    minimum_quantity: '',
    minimum_spending: '',
    quantity_allowed: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_24_hours: false,
    days_of_week: [],
    discount_name: ''
  });

  // Dropdown options state
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);
  const [membershipLevels, setMembershipLevels] = useState<MembershipLevel[]>([]);
  const [discountScopes, setDiscountScopes] = useState<DiscountScope[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  
  // Edit Modal dropdown data from API
  const [editModalCategories, setEditModalCategories] = useState<Category[]>([]);
  const [editModalFlavors, setEditModalFlavors] = useState<ApiCategory[]>([]);
  const [editModalFeelings, setEditModalFeelings] = useState<ApiCategory[]>([]);
  const [editModalLoading, setEditModalLoading] = useState(false);
  
  // Form state for edit modal
  const [editFormData, setEditFormData] = useState({
    med_image: '',
    product_id: '',
    page_id: '',
    productName: '',
    description: '',
    variantName: '',
    strainName: '',
    quantityOnHand: '',
    weight: '',
    sku: '',
    batchId: '',
    tagNo: '',
    category: '',
    subcategory: '',
    strainCat: '',
    flavor: '',
    addedFlavors: [] as string[], // Array of selected/manual flavors
    newFlavorInput: '', // Temporary input for manual flavor entry
    feeling: '',
    medMeasurements: 'unit',
    medEachValue: 'Each',
    medEachPrice: '',
    medGramPrice: '',
    medValue: ['', '', '', '', '', '', ''], // For bulk/pounds gram prices
    price1: '',
    price2: '',
    price3: '',
    selectedRoom: [] as string[],
    catalog: false,
    page: false,
    enable_catalog: false,
    is_sample: false,
    thc: '',
    cbd: '',
    value1: '',
    value2: '',
    value3: '',
    value4: '',
    value5: '',
    value6: '',
    value7: ''
  });

  // Form state for add modal
  const [addFormData, setAddFormData] = useState({
    productName: '',
    description: '',
    variantName: '',
    strainName: '',
    quantityOnHand: '',
    weight: '',
    sku: '',
    batchId: '',
    tagNo: '',
    category: '',
    subcategory: '',
    strainCat: '',
    flavor: '',
    addedFlavors: [] as string[],
    newFlavorInput: '',
    feeling: '',
    medMeasurements: 'unit',
    medEachValue: 'Each',
    medEachPrice: '',
    medGramPrice: '',
    medValue: ['', '', '', '', '', '', ''],
    price1: '',
    price2: '',
    price3: '',
    selectedRoom: [] as string[],
    catalog: false,
    page: false,
    thc: '',
    cbd: '',
    value1: '',
    value2: '',
    value3: '',
    value4: '',
    value5: '',
    value6: '',
    value7: ''
  });

  // Add modal dropdown data
  const [addModalCategories, setAddModalCategories] = useState<Category[]>([]);
  const [addModalSubcategories, setAddModalSubcategories] = useState<ApiCategory[]>([]);
  const [addModalFlavors, setAddModalFlavors] = useState<ApiCategory[]>([]);
  const [addModalFeelings, setAddModalFeelings] = useState<ApiCategory[]>([]);
  const [addModalLoading, setAddModalLoading] = useState(false);
  
  // Shake Sale Tier states
  const [shakeSaleTiers, setShakeSaleTiers] = useState<ShakeSaleTier[]>([]);
  const [selectedShakeTier, setSelectedShakeTier] = useState<string>('');
  
  // Image upload states
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string>('');
  
  // Subcategories state
  const [editModalSubcategories, setEditModalSubcategories] = useState<ApiCategory[]>([]);
  
  const [editModalFlowerTier, setEditModalFlowerTier] = useState<FlowerTier[]>([]);
  
  // Strain categories (static options)
  const strainCatOptions = ['Indica', 'Sativa', 'Hybrid', 'Indica Hybrid', 'Sativa Hybrid'];
  
  // Measurement options
  const measurementOptions = ['Unit',  'Pre Package', 'Pound', 'Ounce', 'Kilogram', 'Milligram', 'Gram', 'Milliliter', 'Liter'];
  
  // Each value options
  const eachValueOptions = ['1/10',  '1/8',  '1/6',  '1/5', '1/4', '1/3', '1/2', '3/4', '1', '1 1/4', '1 1/2', '2', '2 1/2','3', '3 1/2', '3 3/4', '4', '5', '6', '7', '8', '10', '14', '28'];
  
  // API data state
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [apiPage, setApiPage] = useState(1);
  const [rooms, setRooms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([{ name: 'All', subcategories: [] }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showSafeModal, setShowSafeModal] = useState(false);
  const [safeProduct, setSafeProduct] = useState<Product | null>(null);
  const [safeValues, setSafeValues] = useState({ onHand: 0, safeStorage: 0, posAvailable: 0 });
  
  // Row editing state for weight
  const [editingRows, setEditingRows] = useState<{ [key: string]: { weight?: string; totalWeight?: string; i_price?: string; i_deals?: string; i_onhand?: string; i_par?: string } }>({});
  
  // Multi-select rooms state
  const [selectedRooms, setSelectedRooms] = useState<{ [productId: string]: string[] }>({});
  const [showRoomDropdown, setShowRoomDropdown] = useState<{ [productId: string]: boolean }>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  // Delete confirmation state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Transform API data: convert selected_rooms array to s_rooms string
  const transformProductsData = (productsData: any[]) => {
    return productsData.map(product => ({
      ...product,
      s_rooms: product.selected_rooms && product.selected_rooms.length > 0 
        ? product.selected_rooms.join(',')
        : null
    }));
  };
  

  // ============================================================
  // FIXED: Single useEffect for inventory loading
  // Prevents infinite loop caused by two interconnected effects
  // ============================================================
  
  const [hasInitialized, setHasInitialized] = useState(false);

  // Helper function to get cookie
  const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  // Define fetchAllInventory outside useEffect so it can be called from handleAddProduct
  const fetchAllInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const vanityUrl = getCookie('vanity_url');
      if (!vanityUrl) {
        throw new Error('Business information not found. Please refresh and try again.');
      }
      
      let allLoadedProducts: Product[] = [];
      let totalProdCount = 0;
      
      // Load first page to get total count and metadata
      const firstResponse = await axios.get(
        `/api/business/posinventory?business=${vanityUrl}&page=1&is_from=product`
      );
      
      if (firstResponse.data.status !== 'success') {
        throw new Error(
          firstResponse.data.error?.message || 
          firstResponse.data.message || 
          'Failed to load inventory'
        );
      }
      
      // Extract metadata from first page
      if (firstResponse.data.data.page_id) {
        setGlobalPageId(firstResponse.data.data.page_id);
      }
      
      const roomsData = firstResponse.data.data.aRooms || [];
      setRooms(roomsData);
      
      totalProdCount = firstResponse.data.data.total || 0;
      const productsPerPage = firstResponse.data.data.products?.length || 10;
      
      // Transform and add products from first page
      const firstPageProducts = transformProductsData(firstResponse.data.data.products || []);
      allLoadedProducts = [...firstPageProducts];
      
      // Calculate total pages needed (this prevents infinite pagination)
      const totalPages = Math.ceil(totalProdCount / productsPerPage);
      
      // Load remaining pages only if there are more than 1 page
      if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page++) {
          const response = await axios.get(
            `/api/business/posinventory?business=${vanityUrl}&page=${page}&is_from=product`
          );
          
          if (response.data.status !== 'success') {
            console.warn(`Failed to load page ${page}, continuing with loaded products`);
            break;
          }
          
          const productsData = response.data.data.products || [];
          const transformedProducts = transformProductsData(productsData);
          allLoadedProducts = [...allLoadedProducts, ...transformedProducts];
          
          // Stop if no more products
          if (productsData.length === 0) {
            break;
          }
        }
      }
      
      // Extract categories and subcategories directly from all loaded products
      const categoryMap = new Map<string, Set<string>>();
      
      allLoadedProducts.forEach(product => {
        const catName = (product.cat_name || '').trim();
        const subCatName = (product.sub_cat_name || '').trim();
        
        if (catName) {
          // Add category
          if (!categoryMap.has(catName)) {
            categoryMap.set(catName, new Set<string>());
          }
          
          // Add subcategory if it exists
          if (subCatName) {
            categoryMap.get(catName)?.add(subCatName);
          }
        }
      });
      
      // Transform the map into our category structure
      const transformedCategories = [
        { name: 'All', subcategories: [] },
        ...Array.from(categoryMap.entries()).map(([catName, subCats]) => ({
          name: catName,
          subcategories: Array.from(subCats)
        }))
      ];
      
      setCategories(transformedCategories);
      
      // Debug: Log category structure extracted from products
      console.log('=== CATEGORIES EXTRACTED FROM PRODUCTS ===');
      console.log('Total products loaded:', allLoadedProducts.length);
      console.log('Categories found:', Array.from(categoryMap.keys()));
      console.log('Transformed categories:', transformedCategories);
      console.log('Sample products with categories:');
      allLoadedProducts.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i}: ${p.name} | cat_name: "${p.cat_name}" | strain_cat: "${p.strain_cat}"`);
      });
      
      // Set all state at once after loading is complete
      setAllProducts(allLoadedProducts);
      setProducts(allLoadedProducts);
      setTotalProducts(totalProdCount);
      
      // Debug logging
      console.log('=== INVENTORY LOADED ===');
      console.log('Total products loaded:', allLoadedProducts.length);
      console.log('Categories:', transformedCategories.map(c => c.name));
      console.log('First 5 products:');
      allLoadedProducts.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i}: ${p.name} | cat_name: "${p.cat_name}" | strain_cat: "${p.strain_cat}"`);
      });
      
      // Show success message
      if (allLoadedProducts.length > 0) {
        toast.success(`Loaded ${allLoadedProducts.length} products successfully`);
      }
      
      // Mark as initialized to prevent re-runs
      setHasInitialized(true);
      
    } catch (error: any) {
      let errorMessage = 'Failed to fetch inventory';
      
      // Extract error message from various sources
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Strip HTML tags if present
      errorMessage = errorMessage.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '');
      
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Guard: only run once on mount
    if (hasInitialized) return;
    
    fetchAllInventory();
    
  }, [hasInitialized]); // Run when hasInitialized changes

  // Calculate product counts for categories and subcategories
  useEffect(() => {
    const counts: {[key: string]: number} = {};
    
    // Count for "All"
    counts['All'] = allProducts.length;
    
    // Count products for each category
    categories.forEach(cat => {
      if (cat.name === 'All') return; // Skip 'All', already handled
      
      // Try multiple matching approaches
      let categoryCount = 0;
      
      // First: Direct exact match (trimmed)
      categoryCount = allProducts.filter(p => {
        const pCatName = (p.cat_name || '').trim();
        const catName = (cat.name || '').trim();
        return pCatName === catName;
      }).length;
      
      // If no match, try case-insensitive
      if (categoryCount === 0) {
        categoryCount = allProducts.filter(p => {
          const pCatName = (p.cat_name || '').trim().toLowerCase();
          const catName = (cat.name || '').trim().toLowerCase();
          return pCatName === catName;
        }).length;
      }
      
      counts[cat.name] = categoryCount;
      
      // Debug log each category
      console.log(`Category "${cat.name}": ${categoryCount} products`);
    });
    
    // Debug: Log all products and their categories
    console.log('=== PRODUCT CATEGORIES DEBUG ===');
    console.log('Total products:', allProducts.length);
    const productCatList = allProducts.map((p, i) => `${i}: ${p.name} → cat_name: "${p.cat_name}"`);
    console.log('Product categories:', productCatList);
    console.log('Filter categories:', categories.map(c => `"${c.name}"`));
    console.log('Category counts:', counts);
    
    setCategoryProductCounts(counts);
  }, [allProducts, categories]);

  // ============================================================
  // REMOVED: The following problematic effects that caused
  // the infinite loop have been replaced by the single effect above:
  //
  // OLD CODE (REMOVED):
  // useEffect(() => {
  //   fetchInventoryDetails(apiPage);
  // }, [apiPage]);
  //
  // useEffect(() => {
  //   if (allProducts.length < totalProducts && !loading) {
  //     setApiPage(prev => prev + 1);
  //   }
  // }, [allProducts.length, totalProducts, loading]);
  //
  // ALSO REMOVED:
  // - const [apiPage, setApiPage] = useState(1);
  // - const fetchInventoryDetails function (lines 428-531)
  // - All references to apiPage and setApiPage
  // ============================================================


  const currentCategory = categories.find(c => c.name === selectedCategory);
  const subcategories = currentCategory?.subcategories || [];

  const filteredProducts = products.filter(p => {
    // Normalize strings for comparison (trim and handle case)
    const productCat = (p.cat_name || '').trim();
    const selectedCat = selectedCategory === 'All' ? null : selectedCategory;
    const productSub = (p.sub_cat_name || '').trim();
    const selectedSub = selectedSubcategory === 'All' ? null : selectedSubcategory;
    const searchLower = searchTerm.toLowerCase();

    // Category filter
    const categoryMatch = !selectedCat || productCat === selectedCat;

    // Subcategory filter
    const subcategoryMatch = !selectedSub || productSub === selectedSub;

    // Search filter
    const searchMatch = !searchTerm || p.name.toLowerCase().includes(searchLower);

    return categoryMatch && subcategoryMatch && searchMatch;
  });

  // Progressive loading: show only displayedCount products
  const displayedProducts = filteredProducts.slice(0, displayedCount);
  
  // Load more products in background if available
  useEffect(() => {
    if (displayedCount < filteredProducts.length) {
      const timer = setTimeout(() => {
        setDisplayedCount(prev => Math.min(prev + 30, filteredProducts.length));
      }, 500); // Load next batch after 500ms
      return () => clearTimeout(timer);
    }
  }, [displayedCount, filteredProducts.length]);
  
  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(30); // Reset to show 30 initially
  }, [selectedCategory, selectedSubcategory, searchTerm]);

  /*// Fetch Shake Sale Tiers from API
  useEffect(() => {
    const fetchShakeSaleTiers = async () => {
      try {
        const response = await axios.get(`/api/business/categories`);
        if (response.data && response.data.shake_sale_tiers) {
          setShakeSaleTiers(response.data.shake_sale_tiers);
        }
      } catch (error) {
        console.error('Error fetching shake sale tiers:', error);
      }
    };
    fetchShakeSaleTiers();
  }, []);*/

  // Handlers
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('All');
  };

  const handleTogglePublish = async (productId: string, currentStatus: string, publishType?: string) => {
    try {
      const newStatus = currentStatus === '1' ? '0' : '1';
      
      const payload: any = {
        product_id: productId,
		publish_type: publishType
      };

      if (publishType === 'POS') {
        payload.is_pos = newStatus;
      } else if (publishType === 'PAGE') {
        payload.enable_product = newStatus;
      }else if (publishType === 'CATALOG') {
        payload.enable_catalog = newStatus;
      }else if (publishType === 'SAMPLE') {
        payload.is_sample = newStatus;
      }
      
      const response = await axios.post('/api/business/toggle-publish', payload);
      
      if (response.data.status === 'success') {
        // Update local state
        const updateFn = (prev: Product[]) => prev.map(p => 
          p.product_id === productId 
            ? { 
                ...p,
                ...(publishType === 'SAMPLE' && { is_sample: newStatus }),
                ...(publishType === 'CATALOG' && { enable_catalog: newStatus }),
                ...(publishType === 'POS' && { is_pos: newStatus }),
                ...(publishType === 'PAGE' && { enable_product: newStatus })
              }
            : p
        );

        setProducts(updateFn);
        setAllProducts(updateFn);
        
        //const typeLabel = publishType === 'POS' ? 'POS' : 'Page';
        const action = newStatus === '1' ? 'enabled for' : 'disabled for';
        toast.success(`Product ${action} ${publishType}!`);
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update product');
    }
  };


  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
    setIsCloneMode(false); // Ensure clone mode is off when editing
    
    // Initialize form data with product values
    setEditFormData({
      product_id: product.product_id || '',
	  med_image: product.med_image || '',
      page_id: product.page_id || '',
      productName: product.name || '',
      description: product.text_parsed || '',
      variantName: product.variant_name || '',
      strainName: product.strain || '',
      quantityOnHand: product.i_onhand || '',
      weight: product.i_weight || '',
      sku: product.product_code || '',
      batchId: product.batch_id || '',
      tagNo: product.tag_no || '',
      category: String(product.cat_id || ''),
      // Try to get subcategory - could be from multiple sources
      //subcategory: String(product.bne_cat_id || product.fla_sub_cat_id || product.fle_sub_cat_id || ''),
      subcategory: String(product.sub_cat_id),
      strainCat: product.strain_cat || '',
      flavor: product.fla_cat_id || '',
      addedFlavors: product.flavors ? product.flavors.split(',').map(f => f.trim()) : [],
      newFlavorInput: '',
      feeling: product.fle_cat_id || '',
      medMeasurements: product.med_measurements || 'unit',
      medEachValue: String(product.value1 || ''),
      medEachPrice: String(product.value2 || ''),
      medGramPrice: '',
      medValue: ['', '', '', '', '', '', ''], // For bulk/pounds gram prices
      price1: '',
      price2: product.p_offer_price || '',
      price3: '',
	  value1: String(product.value1 || ''),
	  value2: String(product.value2 || ''),
	  value3: String(product.value3 || ''),
	  value4: String(product.value4 || ''),
	  value5: String(product.value5 || ''),
	  value6: String(product.value6 || ''),
	  value7: String(product.value7 || ''),
	  thc: product.thc || '',
	  cbd: product.cbd || '',
      selectedRoom: product.selected_rooms || [],
      catalog: product.enable_catalog === '1',
      page: product.enable_product === '1',
      enable_catalog: product.enable_catalog === '1',
      is_sample: product.is_sample === '1'
    });
    
    fetchEditModalDropdowns(product);
  };

  const handleCloneProduct = (product: Product) => {
    // Set clone mode
    setIsCloneMode(true);
    setIsAddMode(true); // Treat clone like add mode
    setEditingProduct(null); // No editing product in clone mode
    
    // Initialize form data with cloned product values
    // Copy all fields, but clear the product name and SKU for uniqueness
    setEditFormData({
      product_id: product.product_id || '',
      med_image: product.med_image || '',
      page_id: product.page_id || '',
      productName: `${product.name} (Clone)`, // Append clone suffix
      description: product.text_parsed || '',
      variantName: product.variant_name || '',
      strainName: product.strain || '',
      quantityOnHand: product.i_onhand || '',
      weight: product.i_weight || '',
      sku: '', // Clear SKU to let system generate new one
      batchId: product.batch_id || '',
      tagNo: '', // Clear tag_no for new product
      category: String(product.cat_id || ''),
      subcategory: String(product.sub_cat_id),
      strainCat: product.strain_cat || '',
      flavor: product.fla_cat_id || '',
      addedFlavors: product.flavors ? product.flavors.split(',').map(f => f.trim()) : [],
      newFlavorInput: '',
      feeling: product.fle_cat_id || '',
      medMeasurements: product.med_measurements || 'unit',
      medEachValue: String(product.value1 || ''),
      medEachPrice: String(product.value2 || ''),
      medGramPrice: '',
      medValue: ['', '', '', '', '', '', ''], // For bulk/pounds gram prices
      price1: '',
      price2: product.p_offer_price || '',
      price3: '',
	  value1: String(product.value1 || ''),
	  value2: String(product.value2 || ''),
	  value3: String(product.value3 || ''),
	  value4: String(product.value4 || ''),
	  value5: String(product.value5 || ''),
	  value6: String(product.value6 || ''),
	  value7: String(product.value7 || ''),
	  thc: product.thc || '',
	  cbd: product.cbd || '',
      selectedRoom: product.selected_rooms || [],
      catalog: product.enable_catalog === '1',
      page: product.enable_product === '1',
      enable_catalog: product.enable_catalog === '1',
      is_sample: product.is_sample === '1'
    });
    
    // Fetch dropdown data for clone mode
    fetchEditModalDropdowns(product);
    
    // Open modal
    setShowEditModal(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setIsDeleting(true);
      const vanityUrl = getCookie('vanity_url');
      if (!vanityUrl) {
        toast.error('Business information not found. Please refresh and try again.');
        setIsDeleting(false);
        return;
      }
      
      // Call delete API with business and product_id
	  
	  const response = await axios.delete(`/api/business/update-product`, {
			data: { id: productToDelete.product_id,business: vanityUrl},
		});
		
	 
      if (response.data.status === 'success') {
        // Remove product from state
        setProducts(products.filter(p => p.product_id !== productToDelete.product_id));
        setAllProducts(allProducts.filter(p => p.product_id !== productToDelete.product_id));
        
        // Close modal and reset
        setShowDeleteConfirmModal(false);
        setProductToDelete(null);
        
        // Show success toast
        toast.success(`Product "${productToDelete.name}" deleted successfully!`, {
          position: 'bottom-center',
          autoClose: 3000,
        });
      } else {
        throw new Error(response.data.message || 'Failed to delete product');
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setProductToDelete(null);
  };

  // COA Modal Handlers
  const handleOpenCoaModal = (productId: string) => {
    setCoaProductId(productId);
    setCoaTitle('');
    setCoaFile(null);
    setCoaFilePreview('');
    setShowCoaModal(true);
    setOpenSettingsDropdown(null); // Close dropdown
    
    // Load existing COAs for this product
    loadProductCoas(productId);
  };

  const loadProductCoas = async (productId: string) => {
    try {
      const response = await axios.get(`/api/business/posinventory/coa?product_id=${productId}`);
      
      // Handle both response structures:
      // 1. New structure: { status, data: { documents: [...] } }
      // 2. Alternative: { status, data: [...] }
      let coaItems = [];
      
      if (response.data && response.data.data) {
        if (Array.isArray(response.data.data)) {
          // Direct array
          coaItems = response.data.data;
        } else if (response.data.data.documents && Array.isArray(response.data.data.documents)) {
          // Nested under documents
          coaItems = response.data.data.documents;
        }
      }
      
      if (coaItems.length > 0) {
        renderCoaList(coaItems);
      } else {
        renderCoaList([]);
      }
    } catch (error) {
      console.error('Error loading COAs:', error);
      // Silently fail - show empty state
      renderCoaList([]);
    }
  };

  const renderCoaList = (coaItems: any[]) => {
    const container = document.getElementById('coaListContainer');
    if (!container) return;

    if (!coaItems || coaItems.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg class="mx-auto mb-2 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <p class="text-sm text-gray-600 dark:text-gray-400">No documents uploaded yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = coaItems.map((item: any, index: number) => {
      // Convert timestamp to date - API returns seconds since epoch
      let addedDate = 'N/A';
      if (item.time_stamp) {
        try {
          const timestamp = parseInt(item.time_stamp) * 1000; // Convert to milliseconds
          addedDate = new Date(timestamp).toLocaleDateString();
        } catch (e) {
          addedDate = 'N/A';
        }
      }
      
      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="flex-shrink-0 p-2 bg-teal-100 dark:bg-teal-900/30 rounded">
              <svg class="text-teal-600 dark:text-teal-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <button 
                onclick="downloadCoaDocument('${item.document_path || ''}', '${(item.title || 'Document').replace(/'/g, "\\'")}', event)"
                class="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 truncate cursor-pointer transition-colors"
                title="Click to download"
              >
                ${item.title || 'Untitled'}
              </button>
              <p class="text-xs text-gray-500 dark:text-gray-400">${addedDate}</p>
            </div>
          </div>
          
        </div>
      `;
    }).join('');
  };
  {/*
  <button class="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onclick="deleteCoa(this, '${item.document_id || ''}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
  */}
  const handleCloseCoaModal = () => {
    setShowCoaModal(false);
    setCoaProductId(null);
    setCoaTitle('');
    setCoaFile(null);
    setCoaFilePreview('');
  };

  const handleCoaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      toast.error('Only PDF and DOC files are allowed');
      return;
    }

    // Validate file size (8 MB limit)
    const maxSize = 8 * 1024 * 1024; // 8 MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 8 MB');
      return;
    }

    setCoaFile(file);
    setCoaFilePreview(file.name);
  };

  const handleUploadCoa = async () => {
    // Validate both fields are filled
    if (!coaTitle.trim()) {
      toast.error('Please enter a title for the Certificate of Analysis');
      return;
    }

    if (!coaFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!coaProductId) {
      toast.error('Product information is missing');
      return;
    }

    try {
      setIsUploadingCoa(true);
      const vanityUrl = getCookie('vanity_url');
      
      // Validate vanityUrl is available
      if (!vanityUrl) {
        toast.error('Business information not found. Please refresh and try again.');
        setIsUploadingCoa(false);
        return;
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('product_id', coaProductId);
      formData.append('business', vanityUrl);
      formData.append('title', coaTitle.trim());
      formData.append('file', coaFile);

      // Upload COA file
      const response = await axios.post('/api/business/posinventory/coa', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        toast.success('Certificate of Analysis uploaded successfully!');
        
        // Clear form
        setCoaTitle('');
        setCoaFile(null);
        setCoaFilePreview('');
        
        // Refresh the COA list
        if (coaProductId) {
          await loadProductCoas(coaProductId);
        }
        
        // Refresh inventory items
        await fetchAllInventory();
      } else {
        throw new Error(response.data.message || 'Failed to upload COA');
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to upload Certificate of Analysis');
    } finally {
      setIsUploadingCoa(false);
    }
  };

  // Download COA Document
  if (typeof window !== 'undefined') {
    (window as any).downloadCoaDocument = (documentPath: string, documentTitle: string, event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (!documentPath) {
        toast.error('Document path not available');
        return;
      }

      try {
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = documentPath;
        link.target = '_blank';
        
        // Set download attribute with filename
        const filename = documentTitle || 'document';
        link.setAttribute('download', `${filename}.pdf`);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Downloading: ${documentTitle}`);
      } catch (error) {
        console.error('Download error:', error);
        // Fallback: open in new tab
        window.open(documentPath, '_blank');
        toast.info(`Opening: ${documentTitle}`);
      }
    };
  }

  const fetchEditModalDropdowns = async (product: Product): Promise<void> => {
    try {
      setEditModalLoading(true);
	  console.log('product.product_id'+product.product_id);
      // Call API to get categories, flavors, and feelings
      const response = await axios.get(`/api/business/categories?page_id=${globalPageId}&product_id=${product.product_id}`);
      
      if (response.data.status === 'success' && response.data.data) {
        const data = response.data.data;
        
        // Transform categories array to match Category interface
        // API returns: { id, name, subcategories: [{ id, name }, ...] }
        // We need: { cat_id, cat_name, sub: [{ cat_id, cat_name }, ...] }
        if (data.categories && Array.isArray(data.categories)) {
          const transformedCategories: Category[] = data.categories.map((cat: any) => ({
            cat_id: String(cat.id),
            cat_name: cat.name,
            sub: (cat.subcategories || []).map((subcat: any) => ({
              cat_id: String(subcat.id),
              cat_name: subcat.name
            }))
          }));
          
          setEditModalCategories(transformedCategories);
          
          // Find and populate subcategories for the current product's category
          // Use cat_parent_id to find the parent category (same as what's set in handleEditClick line 617)
          const selectedCategory = transformedCategories.find((cat) => String(cat.cat_id) === String(product.cat_id));
          if (selectedCategory && selectedCategory.sub) {
            setEditModalSubcategories(selectedCategory.sub);
            
            // Pre-select the product's subcategory if it exists
            const productSubcategoryId = String(product.bne_cat_id || product.fla_sub_cat_id || product.fle_sub_cat_id || product.sub_cat_id || '');
            if (productSubcategoryId && productSubcategoryId !== '0' && productSubcategoryId !== 'null') {
              // Update the form data to include the selected subcategory
              setEditFormData(prev => ({
                ...prev,
                subcategory: productSubcategoryId
              }));
            }
          }
        }
        
        // Extract flavors - handle both cat_name and flavor_name formats
        if (data.flavors) {
          setEditModalFlavors(data.flavors);
        }
		
		// Extract FlowerPriceTier
        if (data.FlowerPriceTier) {
          setEditModalFlowerTier(data.FlowerPriceTier);
        }
        
        // Extract feelings
        if (data.feelings) {
          setEditModalFeelings(data.feelings);
        }
      }
      
      setEditModalLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch edit modal dropdowns:', error);
      setEditModalLoading(false);
      showErrorToast(error, 'Failed to load dropdown options');
    }
  };

  const fetchAddModalDropdowns = async (pageId: string) => {
    try {
      setAddModalLoading(true);
      const response = await axios.get(`/api/business/categories?page_id=${pageId}`);
      
      if (response.data.status === 'success' && response.data.data) {
        const data = response.data.data;
        
        // Transform categories array to match Category interface
        // API returns: { id, name, subcategories: [{ id, name }, ...] }
        // We need: { cat_id, cat_name, sub: [{ cat_id, cat_name }, ...] }
        if (data.categories && Array.isArray(data.categories)) {
          const transformedCategories: Category[] = data.categories.map((cat: any) => ({
            cat_id: String(cat.id),
            cat_name: cat.name,
            sub: (cat.subcategories || []).map((subcat: any) => ({
              cat_id: String(subcat.id),
              cat_name: subcat.name
            }))
          }));
          
          setAddModalCategories(transformedCategories);
        }
        
        if (data.flavors) {
          setAddModalFlavors(data.flavors);
        }
        
        if (data.feelings) {
          setAddModalFeelings(data.feelings);
        }
      }
    } catch (error) {
      console.error('Error fetching add modal dropdowns:', error);
      showErrorToast(error, 'Failed to load categories');
    } finally {
      setAddModalLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (8MB limit)
      if (file.size > 8 * 1024 * 1024) {
        showErrorToast(new Error('File size exceeds 8MB limit'), 'File size exceeds 8MB limit');
        return;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/gif', 'image/png'];
      if (!validTypes.includes(file.type)) {
        showErrorToast(new Error('Invalid file type. Please upload JPG, GIF, or PNG.'), 'Invalid file type');
        return;
      }

      setUploadedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectShakeTier = (tierId: string) => {
    const tier = editModalFlowerTier.find(t => t.tire_id === tierId);

	if (tier) {
	  setSelectedShakeTier(tierId);
	  setEditFormData(prev => ({
		...prev,
		value1: tier["1_gram"] || '',
		value7: tier["2_gram"] || '',
		value2: tier["3_point_5_gram"] || '',
		value3: tier["7_gram"] || '',
		value4: tier["14_gram"] || '',
		value5: tier["28_gram"] || '',
		value6: tier["point_5_gram"] || '',
	  }));
	}

  };

  const handleSaveProduct = async (product?: Product) => {
    try {
      const productToSave = product || editingProduct;
      if (!productToSave) return;
      
      // Create FormData for file upload support
      const formData = new FormData();
      
      // Add all product data
      formData.append('product_id', productToSave.product_id);
      formData.append('product_name', editFormData.productName);
      formData.append('description', editFormData.description);
      formData.append('variant_name', editFormData.variantName);
      formData.append('strain_name', editFormData.strainName);
      formData.append('quantity_on_hand', editFormData.quantityOnHand);
      formData.append('weight', editFormData.weight);
      formData.append('sku', editFormData.sku);
      formData.append('batch_id', editFormData.batchId);
      formData.append('tag_no', editFormData.tagNo);
      formData.append('category', editFormData.category);
      formData.append('subcategory', editFormData.subcategory);
      formData.append('strain_cat', editFormData.strainCat);
      formData.append('flavor', editFormData.flavor);
      formData.append('feeling', editFormData.feeling);
      formData.append('med_measurements', editFormData.medMeasurements);
      formData.append('thc', editFormData.thc);
      formData.append('cbd', editFormData.cbd);
      
	  // Add selected flavors as comma-separated string
      if (editFormData.addedFlavors.length > 0) {
        formData.append('added_flavors', editFormData.addedFlavors.join(','));
      }
	  
	  
      // Add pricing based on measurement type
      if (editFormData.medMeasurements === 'bulk' || editFormData.medMeasurements === 'Pounds') {
        /*editFormData.medValue.forEach((val, idx) => {
          formData.append(`med_value[${idx}]`, val);
        });*/
		formData.append(`med_value[]`, editFormData.value1);
		formData.append(`med_value[]`, editFormData.value2);
		formData.append(`med_value[]`, editFormData.value3);
		formData.append(`med_value[]`, editFormData.value4);
		formData.append(`med_value[]`, editFormData.value5);
		formData.append(`med_value[]`, editFormData.value6);
		formData.append(`med_value[]`, editFormData.value7);
        // Add shake tier if selected
        if (selectedShakeTier) {
          formData.append('shake_tier_id', selectedShakeTier);
        }
      } else {
        formData.append('med_each_value', editFormData.medEachValue);
        formData.append('med_each_price', editFormData.medEachPrice);
      }
      
      formData.append('med_gram_price', editFormData.medGramPrice);
      // Append each selected room
      editFormData.selectedRoom.forEach(room => {
        formData.append('s_rooms[]', room);
      });
     // formData.append('enable_catalog', editFormData.enable_catalog ? '1' : '0');
      //formData.append('enable_product', editFormData.page ? '1' : '0');
      formData.append('enable_catalog', '1');
      formData.append('enable_product', '0');
      formData.append('page_id', editFormData.page_id);
      
      // Add image if uploaded
      if (uploadedImage) {
        formData.append('product_image', uploadedImage);
      }else{
		formData.append('med_image',editFormData.med_image);
	  }
      
      // API call to update product
      const response = await axios.post('/api/business/update-product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.status === 'success') {
        toast.success('Product updated successfully!');
		
		// Refresh inventory by reloading all products
        // Call fetchAllInventory immediately to reload products
        await fetchAllInventory();
		
		
        setShowEditModal(false);
        setEditingProduct(null);
        setUploadedImage(null);
        setUploadedImagePreview('');
        setSelectedShakeTier('');
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update product');
    }
  };

  const handleAddProduct = async () => {
    try {
      // Validation
      if (!editFormData.productName?.trim()) {
        toast.error('Product Name is required', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        return;
      }

      if (!editFormData.category) {
        toast.error('Category is required', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        return;
      }

      /*if (!editFormData.quantityOnHand || Number(editFormData.quantityOnHand) <= 0) {
        toast.error('Quantity On Hand must be greater than 0', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        return;
      }

      if (!editFormData.weight || Number(editFormData.weight) <= 0) {
        toast.error('Weight (Grams) must be greater than 0', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        return;
      }*/

      if (!editFormData.medEachPrice || Number(editFormData.medEachPrice) <= 0) {
        toast.error('Price must be greater than 0', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        return;
      }

      // Create FormData for file upload support
      const formData = new FormData();
      
      // Add all product data
      formData.append('clone_product_id', editFormData.product_id);
      formData.append('product_name', editFormData.productName);
      formData.append('description', editFormData.description);
      formData.append('variant_name', editFormData.variantName);
      formData.append('strain_name', editFormData.strainName);
      formData.append('quantity_on_hand', editFormData.quantityOnHand);
      formData.append('weight', editFormData.weight);
      formData.append('sku', editFormData.sku);
      formData.append('batch_id', editFormData.batchId);
      formData.append('tag_no', editFormData.tagNo);
      formData.append('category', editFormData.category);
      formData.append('subcategory', editFormData.subcategory);
      formData.append('strain_cat', editFormData.strainCat);
      formData.append('flavor', editFormData.flavor);
      formData.append('feeling', editFormData.feeling);
      formData.append('med_measurements', editFormData.medMeasurements);
      formData.append('thc', editFormData.thc);
      formData.append('cbd', editFormData.cbd);
      if (editFormData.addedFlavors.length > 0) {
		  formData.append('added_flavors', editFormData.addedFlavors.join(','));
		}
      // Add pricing based on measurement type
      if (editFormData.medMeasurements === 'bulk' || editFormData.medMeasurements === 'Pounds') {
        formData.append(`med_value[]`, editFormData.value1);
        formData.append(`med_value[]`, editFormData.value2);
        formData.append(`med_value[]`, editFormData.value3);
        formData.append(`med_value[]`, editFormData.value4);
        formData.append(`med_value[]`, editFormData.value5);
        formData.append(`med_value[]`, editFormData.value6);
        formData.append(`med_value[]`, editFormData.value7);
        if (selectedShakeTier) {
          formData.append('shake_tier_id', selectedShakeTier);
        }
      } else {
        formData.append('med_each_value', editFormData.medEachValue);
        formData.append('med_each_price', editFormData.medEachPrice);
      }
      
      formData.append('med_gram_price', editFormData.medGramPrice);
      formData.append('page_id', editFormData.page_id);
      
      // Append each selected room
      editFormData.selectedRoom.forEach(room => {
        formData.append('s_rooms[]', room);
      });
      
      //formData.append('enable_catalog', editFormData.catalog ? '1' : '0');
      formData.append('enable_catalog', '1');
      formData.append('enable_product', '0');
      
      // Add image if uploaded
      if (uploadedImage) {
        formData.append('product_image', uploadedImage);
      }else{
		formData.append('med_image',editFormData.med_image);
	  }
	  
      // API call to create product
      const response = await axios.post('/api/business/update-product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.status === 'success') {
		  
		
        toast.success('Product created successfully!', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        
        // Refresh inventory by reloading all products
        // Call fetchAllInventory immediately to reload products
        await fetchAllInventory();
        
        // Reset form and close modal
        setShowEditModal(false);
        setIsAddMode(false);
        setEditFormData({
          med_image: '',
          product_id: '',
          page_id: '',
          productName: '',
          description: '',
          variantName: '',
          strainName: '',
          quantityOnHand: '',
          weight: '',
          sku: '',
          batchId: '',
          tagNo: '',
          category: '',
          subcategory: '',
          strainCat: '',
          flavor: '',
          addedFlavors: [],
          newFlavorInput: '',
          feeling: '',
          medMeasurements: 'unit',
          medEachValue: 'Each',
          medEachPrice: '',
          medGramPrice: '',
          medValue: ['', '', '', '', '', '', ''],
          price1: '',
          price2: '',
          price3: '',
          selectedRoom: [],
          catalog: false,
          page: false,
          enable_catalog: false,
          is_sample: false,
          thc: '',
          cbd: '',
          value1: '',
          value2: '',
          value3: '',
          value4: '',
          value5: '',
          value6: '',
          value7: ''
        });
        setUploadedImage(null);
        setUploadedImagePreview('');
        setSelectedShakeTier('');
      }else{
		  showErrorToast(response,response.data.error.message);
	  }
    } catch (error: any) {
      showErrorToast(error, 'Failed to create product');
    }
  };

  const handleSaveWeight = async (product: Product) => {
    try {
      const rowData = editingRows[product.product_id];
      if (!rowData) return;
	  
		const parValue = Number(rowData.i_par !== undefined ? rowData.i_par : product.i_par);
		const onhandValue = Number(rowData.i_onhand !== undefined ? rowData.i_onhand : product.i_onhand);

console.log(parValue);
console.log(onhandValue);
console.log(rowData);
		if (rowData.i_par && parValue > onhandValue) {
			toast.error('Par level cannot be greater than On Hand inventory!', {
			position: 'bottom-center',
			autoClose: 4000,
			});
			return; // Prevents API call and save
		}

      const response = await axios.post('/api/business/update-product-weight', {
        product_id: product.product_id,
        i_weight: rowData.weight,
        i_total_weight: rowData.totalWeight,
        i_price: rowData.i_price,
        i_deals: rowData.i_deals,
        i_par: rowData.i_par,
        i_onhand: rowData.i_onhand
      });

      if (response.data.status === 'success') {
        // Update products list
        setProducts(prev => prev.map(p => 
          p.product_id === product.product_id
            ? { 
                ...p, 
                ...(rowData.weight !== undefined && { i_weight: rowData.weight }),
                ...(rowData.totalWeight !== undefined && { i_total_weight: rowData.totalWeight }),
                ...(rowData.i_price !== undefined && { i_price: rowData.i_price }),
                ...(rowData.i_deals !== undefined && { i_deals: rowData.i_deals }),
                ...(rowData.i_par !== undefined && { i_par: rowData.i_par }),
                ...(rowData.i_onhand !== undefined && { i_onhand: rowData.i_onhand })
              }
            : p
        ));
        setAllProducts(prev => prev.map(p => 
          p.product_id === product.product_id
            ? { 
                ...p, 
                ...(rowData.weight !== undefined && { i_weight: rowData.weight }),
                ...(rowData.totalWeight !== undefined && { i_total_weight: rowData.totalWeight }),
                ...(rowData.i_price !== undefined && { i_price: rowData.i_price }),
                ...(rowData.i_deals !== undefined && { i_deals: rowData.i_deals }),
                ...(rowData.i_par !== undefined && { i_par: rowData.i_par }),
                ...(rowData.i_onhand !== undefined && { i_onhand: rowData.i_onhand })
              }
            : p
        ));

        // Clear editing state
        setEditingRows(prev => {
          const newState = { ...prev };
          delete newState[product.product_id];
          return newState;
        });

        toast.success('Product details updated successfully!', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update product details');
    }
  };

  const handleCancelEdit = (productId: string) => {
    setEditingRows(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const handleEditFieldChange = (productId: string, field: string, value: string) => {
    setEditingRows(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleToggleDayOfWeek = (day: string) => {
    setDealData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const totalPages = Math.ceil(displayedProducts.length / itemsPerPage);
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  
   // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Loading state
  if (loading && allProducts.length === 0) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Loading inventory </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && allProducts.length === 0) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Error loading inventory</p>
        </div>
        
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
              {/* Icon */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-10 blur-lg"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center border-2 border-red-200 dark:border-red-800">
                  <AlertCircle size={40} className="text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Error Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Failed to Load Inventory
              </h2>

              {/* Error Message */}
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {error}
                </p>
              </div>

              {/* Help Text */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                If you believe this is an error, please try refreshing the page or contact support.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 accent-bg accent-hover shadow-md hover:shadow-lg"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-95"
                >
                  Go Back
                </button>
              </div>
            </div>

            {/* Support Text */}
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-6">
              Need help? Contact support@example.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">Inventory Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {selectedCategory !== 'All' ? (
            <>
              {selectedCategory}
              {selectedSubcategory !== 'All' && ` • ${selectedSubcategory}`}
              {' '} • {filteredProducts.length} products
            </>
          ) : (
            <>
              Manage your product inventory • {filteredProducts.length} of {allProducts.length} products
            </>
          )}
          {loading && allProducts.length > 0 && <span className="ml-2 text-blue-500">(Loading more...)</span>}
        </p>
		<div className="h-1 bg-gradient-to-r accent-bg accent-hover"></div>
      </div>

      {/* Category Filters - with counts */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => handleCategoryChange(cat.name)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 ${
              selectedCategory === cat.name
                ? 'text-white shadow-lg accent-bg accent-hover'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {cat.name} <span className="text-xs ml-1">({categoryProductCounts[cat.name] || 0})</span>
          </button>
        ))}
      </div>

      {/* Subcategories - with counts */}
      {subcategories.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subcategory</label>
          <div className="flex flex-wrap gap-2">
            {['All', ...subcategories].map((sub) => {
              // Calculate count for subcategory
              const subCount = sub === 'All' 
                ? filteredProducts.length
                : filteredProducts.filter(p => p.sub_cat_name === sub).length;
              
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    selectedSubcategory === sub
                      ? 'text-white shadow-md accent-bg accent-hover'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {sub} <span className="text-xs ml-1">({subCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
          >
            <Upload size={18} />
            <span>Import From Metrc</span>
          </button>
          <button
            onClick={() => {
              setIsAddMode(true);
              setEditingProduct(null);
              // Reset form data for add mode
              setEditFormData({
                med_image: '',
                product_id: '',
                page_id: globalPageId,
                productName: '',
                description: '',
                variantName: '',
                strainName: '',
                quantityOnHand: '',
                weight: '',
                sku: '',
                batchId: '',
                tagNo: '',
                category: '',
                subcategory: '',
                strainCat: '',
                flavor: '',
                addedFlavors: [],
                newFlavorInput: '',
                feeling: '',
                medMeasurements: 'unit',
                medEachValue: 'Each',
                medEachPrice: '',
                medGramPrice: '',
                medValue: ['', '', '', '', '', '', ''],
                price1: '',
                price2: '',
                price3: '',
                selectedRoom: [],
                catalog: false,
                page: false,
                enable_catalog: false,
                is_sample: false,
                thc: '',
                cbd: '',
                value1: '',
                value2: '',
                value3: '',
                value4: '',
                value5: '',
                value6: '',
                value7: ''
              });
              // Fetch dropdown data for add mode
              if (globalPageId) {
                fetchEditModalDropdowns({page_id: globalPageId} as any);
              }
              setShowEditModal(true);
            }}
            className="px-4 py-2 text-white rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 accent-bg accent-hover"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item Name</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item Identifiers</th>
				<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Published</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Deals</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Par</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">OnHand</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {displayedProducts.length > 0 ? (
                displayedProducts.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
						  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer">
							{product.med_image ? (
							  <img
								src={product.med_image}
								alt={product.name}
								className="w-full h-full object-cover"
								onError={(e) => (e.currentTarget.style.display = 'none')}
							  />
							) : (
							  <Package size={20} className="text-gray-400" />
							)}
						  </div>

						  {/* 🔍 Hover Preview 
						  {product.med_image && (
							<div className="absolute left-14 top-1/2 z-50 hidden group-hover:block -translate-y-1/2">
							  <div className="w-40 h-40 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
								<img
								  src={product.med_image}
								  alt={product.name}
								  className="w-full h-full object-cover"
								/>
							  </div>
							</div>
						  )}*/}
						</div>

                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
							<button
								type="button"
								onClick={() => handleSelectProduct(product)}
								className="accent-text bg-transparent p-0"
							 >
								{product.name}
							  </button>
						  </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.tag_no} 
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{product.cat_name}</div>
                          <button
                            onClick={() => handleOpenCoaModal(product.product_id)}
                            className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium mt-1 transition-colors"
                          >
                            COA List →
                          </button>
                        </div>
                      </div>
                    </td>
					<td className="px-4 py-4">
						<div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{product.product_code}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{product.batch_id}</div>
                        </div>
                    </td>
					<td className="px-4 py-4 text-center">
                      <PublishedToggle 
                        product={product}
                        onToggle={handleTogglePublish}
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
						<input 
						type="text" 
                        value={editingRows[product.product_id]?.i_price ?? product.i_price ?? ''}
                        onChange={(e) => handleEditFieldChange(product.product_id, 'i_price', e.target.value)}
                        className="w-16 text-center border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
					</td>
                    <td className="px-4 py-4 text-center">
                      <input 
						type="text" 
                        value={editingRows[product.product_id]?.i_deals ?? product.i_deals ?? ''}
                        onChange={(e) => handleEditFieldChange(product.product_id, 'i_deals', e.target.value)}
                        className="w-16 text-center border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className={`px-4 py-4 text-center font-semibold rounded transition-colors ${
                      product.i_par && Number(product.i_par) > Number(product.i_onhand)
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-l-yellow-500'
                        : product.i_par && Number(product.i_onhand) <= Number(product.i_par)
                        ? 'bg-red-100 dark:bg-red-900/30 border-l-4 border-l-red-500'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
						 <input 
							type="text" 
							value={editingRows[product.product_id]?.i_par ?? product.i_par ?? ''}
							onChange={(e) => handleEditFieldChange(product.product_id, 'i_par', e.target.value)}
							className={`w-16 text-center border rounded focus:outline-none focus:ring-2 ${
                              product.i_par && Number(product.i_par) > Number(product.i_onhand)
                                ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100'
                                : product.i_par && Number(product.i_onhand) <= Number(product.i_par)
                                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500'
                            }`}
						  />
					</td>
                    <td className={`px-4 py-4 text-center rounded transition-colors ${
                      product.i_par && Number(product.i_par) > Number(product.i_onhand)
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-l-yellow-500'
                        : product.i_par && Number(product.i_onhand) <= Number(product.i_par)
                        ? 'bg-red-100 dark:bg-red-900/30 border-l-4 border-l-red-500'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <input 
						type="text" 
						value={editingRows[product.product_id]?.i_onhand ?? product.i_onhand}
					onChange={(e) => handleEditFieldChange(product.product_id, 'i_onhand', e.target.value)}
							className={`w-16 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              product.i_par && Number(product.i_par) > Number(product.i_onhand)
                                ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100 font-semibold'
                                : product.i_par && Number(product.i_onhand) <= Number(product.i_par)
                                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 font-semibold'
                                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            }`}
						  />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center gap-2 relative">
                        {editingRows[product.product_id] ? (
                          <>
                            <button 
                              onClick={() => handleCancelEdit(product.product_id)}
                              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveWeight(product)}
                              className="px-3 py-1 text-xs text-white rounded accent-bg accent-hover transition-all duration-300 hover:scale-105" 
                            >
                              SAVE
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Settings Dropdown Button */}
                            <div className="relative">
                              <button 
                                onClick={() => setOpenSettingsDropdown(openSettingsDropdown === product.product_id ? null : product.product_id)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="More options"
                              >
                                <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
                              </button>
                              
                              {/* Dropdown Menu */}
                              {openSettingsDropdown === product.product_id && (
                                <>
                                  {/* Click-outside overlay to close dropdown */}
                                  <div 
                                    className="fixed inset-0 z-40"
                                    onClick={() => setOpenSettingsDropdown(null)}
                                  />
                                  
                                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                    <button
                                      onClick={() => {
                                        handleEditClick(product);
                                        setOpenSettingsDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-3 flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
                                    >
                                      <Edit size={16} />
                                      <span>Edit</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        handleCloneProduct(product);
                                        setOpenSettingsDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-3 flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      <Copy size={16} />
                                      <span>Clone</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleOpenCoaModal(product.product_id);
                                        setOpenSettingsDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-3 flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      <FileText size={16} />
                                      <span>Certificates Of Analysis</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleDeleteClick(product);
                                        setOpenSettingsDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-3 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors rounded-b-lg"
                                    >
                                      <Trash2 size={16} />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <Package size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No products found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or search term</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Progress indicator instead of pagination */}
        {filteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {displayedProducts.length} of {filteredProducts.length} products
                {displayedCount < filteredProducts.length && (
                  <span className="ml-2 text-blue-500 flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" />
                    Loading more in background...
                  </span>
                )}
              </div>
              
              {displayedCount < filteredProducts.length && (
                <div className="w-full sm:w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full accent-bg transition-all duration-300"
                    style={{width: `${(displayedCount / filteredProducts.length) * 100}%`}}
                  ></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

     
	  
	  {/* Edit/Add Product Modal */}
      {showEditModal && (isAddMode || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isCloneMode ? 'Clone Product' : isAddMode ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setIsAddMode(false);
                  setIsCloneMode(false);
                  setUploadedImage(null);
                  setUploadedImagePreview('');
                  setSelectedShakeTier('');
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {editModalLoading ? (
              <div className="p-12 flex justify-center items-center">
                <Loader2 size={32} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  {/* Product Name and Description */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">* Product Name</label>
                      <input
                        type="text"
                        value={editFormData.productName}
                        onChange={(e) => setEditFormData({...editFormData, productName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
					{/* Variant Product Name */}
					  <div>
						<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Variant Product Name</label>
						<input
						  type="text"
						  value={editFormData.variantName}
						  onChange={(e) => setEditFormData({...editFormData, variantName: e.target.value})}
						  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						  placeholder="Variant Product Name"
						/>
					  </div>
                   
                </div>

				<div>
				  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
					Description
				  </label>

				  <textarea
					value={editFormData.description}
					onChange={(e) =>
					  setEditFormData({ ...editFormData, description: e.target.value })
					}
					rows={4}
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
				  />
				</div>


                  {/* Strain Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Strain Name</label>
                    <input
                      type="text"
                      value={editFormData.strainName}
                      onChange={(e) => setEditFormData({...editFormData, strainName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Strain Name"
                    />
                  </div>

                  {/* Quantity and Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantity On Hand</label>
                      <input
                        type="number"
                        value={editFormData.quantityOnHand}
                        onChange={(e) => setEditFormData({...editFormData, quantityOnHand: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Weight(Grams)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.weight}
                        onChange={(e) => setEditFormData({...editFormData, weight: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  {/* SKU and Batch ID */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">SKU</label>
                      <input
                        type="text"
                        value={editFormData.sku}
						onChange={(e) => setEditFormData({...editFormData, sku: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Batch ID</label>
                      <input
                        type="text"
                        value={editFormData.batchId}
                        onChange={(e) => setEditFormData({...editFormData, batchId: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Batch ID"
                      />
                    </div>
                  </div>
				  
				  {/* thc and CBD */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">THC</label>
                      <input
                        type="text"
                        value={editFormData.thc}
						onChange={(e) => setEditFormData({...editFormData, thc: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
						placeholder="THC %"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">CBD</label>
                      <input
                        type="text"
                        value={editFormData.cbd}
                        onChange={(e) => setEditFormData({...editFormData, cbd: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="CBD %"
                      />
                    </div>
                  </div>

                  {/* Tag# */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tag#</label>
                    <input
                      type="text"
                      value={editFormData.tagNo}
                      onChange={(e) => setEditFormData({...editFormData, tagNo: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					  readOnly
                    />
                  </div>

                  {/* Category and SubCategory */}
                  <div className="grid grid-cols-2 gap-4">
				  {/* Category */}
				  <div>
					<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
					  Category
					</label>
					<select
					  value={editFormData.category || ""}
					  onChange={(e) => {
						const selectedCat = editModalCategories.find(
						  (cat) => String(cat.cat_id) === e.target.value
						);

						setEditFormData({
						  ...editFormData,
						  category: e.target.value, // store cat_id
						  subcategory: "", // reset subcategory when category changes
						});

						if (selectedCat && selectedCat.sub) {
						  setEditModalSubcategories(selectedCat.sub);
						} else {
						  setEditModalSubcategories([]);
						}
					  }}
					  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg 
								 focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 
								 text-gray-900 dark:text-gray-100"
					>
					  <option value="">Select Category</option>
					  {editModalCategories.map((cat) => (
						<option key={cat.cat_id} value={String(cat.cat_id)}>
						  {cat.cat_name}
						</option>
					  ))}
					</select>
				  </div>

				  {/* Subcategory */}
				  <div>
					<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
					  SubCategory
					</label>
					<select
					  value={editFormData.subcategory || ""}
					  onChange={(e) =>
						setEditFormData({
						  ...editFormData,
						  subcategory: e.target.value, // store subcat_id
						})
					  }
					  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg 
								 focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 
								 text-gray-900 dark:text-gray-100"
					>
					  <option value="">Select SubCategory</option>
					  {editModalSubcategories.map((subcat) => (
						<option key={subcat.cat_id} value={String(subcat.cat_id)}>
						  {subcat.cat_name}
						</option>
					  ))}
					</select>
				  </div>
				</div>


                  {/* Strain Cat */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Strain Cat</label>
                    <select
                      value={editFormData.strainCat}
                      onChange={(e) => setEditFormData({...editFormData, strainCat: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select</option>
                      {strainCatOptions.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Flavor and Feeling */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Dynamic Flavor Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <span className="accent-text">Add Flavor</span>
                      </label>
                      
                      <div className="space-y-3">
                        {/* Flavor Selection Dropdowns - Grid for pre-defined flavors */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* First dropdown with + button */}
                          <div className="flex gap-1">
                            <select
                              value={editFormData.flavor}
                              onChange={(e) => setEditFormData({...editFormData, flavor: e.target.value})}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                                         focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 
                                         text-gray-900 dark:text-gray-100 text-sm"
                            >
                              <option value="">Select Flavor</option>
                              {editModalFlavors.map(flavor => (
                                <option key={flavor.cat_id} value={flavor.cat_name}>
                                  {flavor.cat_name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                if (editFormData.flavor && !editFormData.addedFlavors.includes(editFormData.flavor)) {
                                  setEditFormData({
                                    ...editFormData,
                                    addedFlavors: [...editFormData.addedFlavors, editFormData.flavor],
                                    flavor: ''
                                  });
                                }
                              }}
                              className="px-3 py-2 accent-bg accent-hover text-white rounded-lg text-sm"
                              title="Add selected flavor"
                              type="button"
                            >
                              <Plus size={18} />
                            </button>
                          </div>

                          {/* Manual input with + button */}
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={editFormData.newFlavorInput}
                              onChange={(e) => setEditFormData({...editFormData, newFlavorInput: e.target.value})}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && editFormData.newFlavorInput) {
                                  if (!editFormData.addedFlavors.includes(editFormData.newFlavorInput)) {
                                    setEditFormData({
                                      ...editFormData,
                                      addedFlavors: [...editFormData.addedFlavors, editFormData.newFlavorInput],
                                      newFlavorInput: ''
                                    });
                                  }
                                }
                              }}
                              placeholder="Or type flavor"
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                                         focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 
                                         text-gray-900 dark:text-gray-100 text-sm"
                            />
                            <button
                              onClick={() => {
                                if (editFormData.newFlavorInput && !editFormData.addedFlavors.includes(editFormData.newFlavorInput)) {
                                  setEditFormData({
                                    ...editFormData,
                                    addedFlavors: [...editFormData.addedFlavors, editFormData.newFlavorInput],
                                    newFlavorInput: ''
                                  });
                                }
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                              title="Add manual flavor"
                              type="button"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Display Added Flavors as Tags */}
                        {editFormData.addedFlavors.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex flex-wrap gap-2">
                            {editFormData.addedFlavors.map((addedFlavor, index) => (
                              <div
                                key={index}
                                className="bg-white dark:bg-gray-600 px-3 py-1 rounded-full 
                                           flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                              >
                                {addedFlavor}
                                <button
                                  onClick={() => {
                                    setEditFormData({
                                      ...editFormData,
                                      addedFlavors: editFormData.addedFlavors.filter((_, i) => i !== index)
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 ml-1"
                                  type="button"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feeling - Keep existing */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select Feeling Creative</label>
                      <select
                        value={editFormData.feeling}
                        onChange={(e) => setEditFormData({...editFormData, feeling: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select Feeling</option>
                        {editModalFeelings.map(feeling => (
                          <option key={feeling.cat_id} value={feeling.cat_name}>
                            {feeling.cat_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Measurements */}
                  

                    <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
						<div>
							<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Units of Measure</label>
							<select
							  value={editFormData.medMeasurements}
							  onChange={(e) => setEditFormData({...editFormData, medMeasurements: e.target.value})}
							  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
							>
							  {measurementOptions.map(option => (
								<option key={option} value={option}>
								  {option}
								</option>
							  ))}
							</select>
						</div>
						<div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Value</label>
                        <select
                          value={editFormData.medEachValue}
                          onChange={(e) => setEditFormData({...editFormData, medEachValue: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          {eachValueOptions.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.medEachPrice}
                          onChange={(e) => setEditFormData({...editFormData, medEachPrice: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="Price"
                        />
                      </div>
                    </div>
					

                  {/* Select Room */}
<div>
  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
    Select Room
  </label>
  <select
    multiple // allow multiple selections
    value={editFormData.selectedRoom.map(String)} // ensure all values are strings
    onChange={(e) => {
      const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value);
      setEditFormData({
        ...editFormData,
        selectedRoom: selectedValues, // store as array
      });
    }}
    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg 
               focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 
               text-gray-900 dark:text-gray-100"
  >
    {rooms.map((room) => (
      <option key={room.room_id} value={String(room.room_id)}>
        {room.room_name}
      </option>
    ))}
  </select>
</div>



                  {/* Toggles 
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Catalog</label>
                      <button
                        onClick={() => setEditFormData({...editFormData, catalog: !editFormData.catalog})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                          editFormData.catalog
                            ? 'accent-bg'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            editFormData.catalog ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Page</label>
                      <button
                        onClick={() => setEditFormData({...editFormData, page: !editFormData.page})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                          editFormData.page
                            ? 'accent-bg'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            editFormData.page ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>*/}

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Image</label>
                    <div className="border-2 border-dashed border-green-300 bg-green-50 dark:bg-gray-800 dark:border-green-700 rounded-lg p-6 text-center">
                      {uploadedImagePreview ? (
                        <div className="space-y-4">
                          <img 
                            src={uploadedImagePreview} 
                            alt="Preview" 
                            className="w-32 h-32 object-cover mx-auto rounded-lg"
                          />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {uploadedImage?.name}
                            </p>
                            <button 
                              onClick={() => {
                                setUploadedImage(null);
                                setUploadedImagePreview('');
                              }}
                              type="button"
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Drag and drop file here</p>
                          <label className="inline-block">
                            <input
                              type="file"
                              accept="image/jpeg,image/gif,image/png"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <span className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer inline-block">
                              Browse...
                            </span>
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">You can upload a JPG, GIF or PNG file.</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">The file size limit is 8 Mb. If your upload does not work, try uploading a smaller picture.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-900">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setIsAddMode(false);
                      setIsCloneMode(false);
                      setUploadedImage(null);
                      setUploadedImagePreview('');
                      setSelectedShakeTier('');
                    }}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (isAddMode) {
                        handleAddProduct();
                      } else {
                        handleSaveProduct();
                      }
                    }}
                    className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
                  >
                    {isCloneMode ? 'Clone Product' : isAddMode ? 'Create Product' : 'Update'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Import from Metrc Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Import from Metrc</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center py-8">
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">Select Metrc package to import</p>
                <input
                  type="text"
                  placeholder="Enter package ID..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-4"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">or</p>
                <button
                  className="mt-4 px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover "
                >
                  Browse Metrc Packages
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Products imported successfully!');
                  setShowImportModal(false);
                }}
                className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
	  
	  {/* Product Detail Modal */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b dark:border-slate-700 bg-white dark:bg-slate-900">
              <h2 className="text-2xl font-bold dark:text-white">{selectedProduct.name}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  <img
                    src={getProductImageUrl(selectedProduct)}
                    alt={selectedProduct.name}
                    className="w-full h-80 object-contain rounded-lg hover:scale-105 transition"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="text-lg font-semibold dark:text-white">{selectedProduct.cat_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                    <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                      ${selectedProduct.p_offer_price}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">In Stock</p>
                    <p className="text-lg font-semibold dark:text-white">{selectedProduct.i_onhand} units</p>
                  </div>

                  {selectedProduct.thc && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">THC</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.thc}%</p>
                    </div>
                  )}

                  {selectedProduct.cbd && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CBD</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.cbd}%</p>
                    </div>
                  )}

                  {selectedProduct.bus_title && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Seller</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.bus_title}</p>
                    </div>
                  )}

                  {/* Add to Cart Button 
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      handleCloseModal();
                    }}
                    className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition mt-6"
                  >
                    Add to Cart
                  </button>*/}
                </div>
              </div>

              {/* Description */}
              {selectedProduct.text_parsed && (
                <div className="mt-6 pt-6 border-t dark:border-slate-700">
                  <h3 className="font-semibold mb-2 dark:text-white">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {selectedProduct.text_parsed}
                  </p>
                </div>
              )}

              {/* Previous/Next Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t dark:border-slate-700">
                <button
                  onClick={() => {
                    const currentIndex = filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id);
                    if (currentIndex > 0) {
                      setSelectedProduct(filteredProducts[currentIndex - 1]);
                    }
                  }}
                  disabled={filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id) === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={20} />
                  Previous
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id) + 1} of {filteredProducts.length}
                </span>

                <button
                  onClick={() => {
                    const currentIndex = filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id);
                    if (currentIndex < filteredProducts.length - 1) {
                      setSelectedProduct(filteredProducts[currentIndex + 1]);
                    }
                  }}
                  disabled={filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id) === filteredProducts.length - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
	  
      {/* COA Upload Modal - Combined List & Add */}
      {showCoaModal && coaProductId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <FileText size={20} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Certificates Of Analysis</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage product documentation</p>
                </div>
              </div>
              <button
                onClick={handleCloseCoaModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* COA List Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Uploaded Documents</h3>
                  <div id="coaListContainer" className="space-y-2 mb-6">
                    {/* COA list items will be rendered here */}
                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <FileText size={24} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">No documents uploaded yet</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-800"></div>

                {/* Upload Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add New Document</h3>
                  
                  <div className="space-y-4">
                    {/* Title Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={coaTitle}
                        onChange={(e) => setCoaTitle(e.target.value)}
                        placeholder="e.g., Lab Analysis Report 2024"
                        disabled={isUploadingCoa}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Give your document a meaningful title</p>
                    </div>

                    {/* File Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select File <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          onChange={handleCoaFileChange}
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          disabled={isUploadingCoa}
                          className="sr-only"
                          id="coaFileInput"
                        />
                        <label
                          htmlFor="coaFileInput"
                          className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="text-center">
                            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {coaFilePreview ? (
                                <span className="font-medium text-teal-600 dark:text-teal-400">{coaFilePreview}</span>
                              ) : (
                                <>
                                  <span className="font-medium">Click to upload</span> or drag and drop
                                </>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PDF, DOC, DOCX (Max 8 MB)</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* File Requirements */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">Requirements:</p>
                      <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                        <li>• Allowed formats: PDF, DOC, DOCX</li>
                        <li>• Maximum file size: 8 MB</li>
                        <li>• Required for product compliance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Buttons */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={handleCloseCoaModal}
                disabled={isUploadingCoa}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Close
              </button>
              <button
                onClick={handleUploadCoa}
                disabled={!coaTitle.trim() || !coaFile || isUploadingCoa}
                className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {isUploadingCoa ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
	  
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full">
            <div className="p-6 flex flex-col items-center text-center">
              {/* Warning Icon */}
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Product</h2>

              {/* Message */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>

              {/* Product Name */}
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6 break-words max-w-xs">
                {productToDelete.name}
              </p>

              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
	  
    </div>
  );
}