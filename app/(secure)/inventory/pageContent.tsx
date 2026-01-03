'use client';
import React, { useEffect, useState } from 'react';
import {
  Bell, Home, Megaphone, Package, CreditCard, Settings, HelpCircle,
  Plus, X, Upload, Target, DollarSign, MousePointer, Eye, CheckCircle,
  ChevronDown, ChevronRight, Menu, User, LogOut, Users, Folder, Edit, 
  Loader2, AlertCircle, ChevronLeft
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from "@/components/StatCard";
import Link from "next/link";
import axios from "axios";
import { toast } from 'react-toastify';

interface Product {
  product_id: string;
  page_id: string;
  name: string;
  cat_name: string;
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
  strain?: string;
  product_code?: string;
  batch_id?: string;
  cat_id?: string;
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
	  
	  {/* Sample Toggle 
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sample</span>
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
      </div>*/}
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDealsModal, setShowDealsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dealsProduct, setDealsProduct] = useState<Product | null>(null);
  const [globalPageId, setGlobalPageId] = useState<string>('');
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
  const measurementOptions = ['unit', 'Pounds', 'bulk', 'prepackage'];
  
  // Each value options
  const eachValueOptions = ['Each', '1/2 Doz', '1 Doz', '1/2 Gram', 'Gram'];
  
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

  useEffect(() => {
    // Guard: only run once on mount
    if (hasInitialized) return;
    
    const fetchAllInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Helper to get cookie
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return '';
        };
        
        const vanityUrl = getCookie('vanity_url');
        let currentPage = 1;
        let allLoadedProducts: Product[] = [];
        let totalProdCount = 0;
        let isFirstPageLoaded = false;
        
        // Load all pages sequentially in a single loop
        while (true) {
          const response = await axios.get(
            `/api/business/posinventory?business=${vanityUrl}&page=${currentPage}&is_from=product`
          );
          
          if (response.data.status !== 'success') {
            throw new Error(
              response.data.error?.message || 
              response.data.message || 
              'Failed to load inventory'
            );
          }
          
          const productsData = response.data.data.products || [];
          
          // On first page, extract metadata and categories
          if (!isFirstPageLoaded) {
            if (response.data.data.page_id) {
              setGlobalPageId(response.data.data.page_id);
            }
            
            const roomsData = response.data.data.aRooms || [];
            setRooms(roomsData);
            
            // Transform categories data
            const categoriesData = response.data.data.categories || {};
            const transformedCategories = [
              { name: 'All', subcategories: [] },
              ...Object.values(categoriesData).map((cat: any) => ({
                name: cat.cat_name,
                subcategories: cat.sub?.map((s: any) => s.cat_name) || []
              }))
            ];
            setCategories(transformedCategories);
            
            totalProdCount = response.data.data.total || 0;
            isFirstPageLoaded = true;
          }
          
          // Transform and add products
          const transformedProducts = transformProductsData(productsData);
          allLoadedProducts = [...allLoadedProducts, ...transformedProducts];
          
          // Check if we've loaded all products
          if (allLoadedProducts.length >= totalProdCount || productsData.length === 0) {
            break;
          }
          
          currentPage++;
        }
        
        // Set all state at once after loading is complete
        setAllProducts(allLoadedProducts);
        setProducts(allLoadedProducts);
        setTotalProducts(totalProdCount);
        
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
    
    fetchAllInventory();
    
  }, []); // Empty dependency array: only run once on component mount

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

  const filteredProducts = products.filter(p =>
    (selectedCategory === 'All' || p.cat_name === selectedCategory) &&
    (selectedSubcategory === 'All' || p.strain_cat === selectedSubcategory) &&
    (searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, searchTerm, itemsPerPage]);

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
    console.log(product);
    // Initialize form data with product values
    setEditFormData({
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
      category: String(product.cat_parent_id || ''),
      // Try to get subcategory - could be from multiple sources
      //subcategory: String(product.bne_cat_id || product.fla_sub_cat_id || product.fle_sub_cat_id || ''),
      subcategory: String(product.cat_id),
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

  const fetchEditModalDropdowns = async (product: Product) => {
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
          const selectedCategory = transformedCategories.find((cat) => String(cat.cat_id) === String(product.cat_parent_id));
          if (selectedCategory && selectedCategory.sub) {
            setEditModalSubcategories(selectedCategory.sub);
            
            // Pre-select the product's subcategory if it exists
            const productSubcategoryId = String(product.bne_cat_id || product.fla_sub_cat_id || product.fle_sub_cat_id || product.cat_id || '');
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
      }
      
      // API call to update product
      const response = await axios.post('/api/business/update-product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.status === 'success') {
        toast.success('Product updated successfully!');
		
		// After successful save
		setProducts(prev =>
		  prev.map(p =>
			p.product_id === productToSave.product_id
			  ? {
				  ...p,
				  s_rooms: editFormData.selectedRoom?.join(',') || p.s_rooms, // update rooms
				  i_weight: editFormData.weight,                               // update weight
				  enable_catalog: '1',                        // update POS status
				  enable_product: '0',               // update enable status
				  p_offer_price: editFormData.price2 || p.p_offer_price,       // update price
				  i_onhand: editFormData.quantityOnHand || p.i_onhand          // update on-hand qty
				}
			  : p
		  )
		);

		setAllProducts(prev =>
		  prev.map(p =>
			p.product_id === productToSave.product_id
			  ? {
				  ...p,
				  s_rooms: editFormData.selectedRoom?.join(',') || p.s_rooms,
				  i_weight: editFormData.weight,
				  enable_catalog: '1',
				  enable_product: '0',
				  p_offer_price: editFormData.price2 || p.p_offer_price,
				  i_onhand: editFormData.quantityOnHand || p.i_onhand
				}
			  : p
		  )
		);

		
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
        setHasInitialized(false);
        
        // Reset form and close modal
        setShowEditModal(false);
        setIsAddMode(false);
        setEditFormData({
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
          Manage your product inventory • {filteredProducts.length} products
          {loading && allProducts.length > 0 && <span className="ml-2 text-blue-500">(Loading more...)</span>}
        </p>
		<div className="h-1 bg-gradient-to-r accent-bg accent-hover"></div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => handleCategoryChange(cat.name)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300 ${
              selectedCategory === cat.name
                ? 'text-white shadow-lg accent-bg accent-hover'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subcategory</label>
          <div className="flex flex-wrap gap-2">
            {['All', ...subcategories].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  selectedSubcategory === sub
                    ? 'text-white shadow-md accent-bg accent-hover'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Actions + Items Per Page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value={10}>10 per page</option>
            <option value={30}>30 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
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
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.tag_no} 
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{product.cat_name}</div>
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
                    <td className="px-4 py-4 text-center font-semibold text-gray-900 dark:text-gray-100">
						 <input 
							type="text" 
							value={editingRows[product.product_id]?.i_par ?? product.i_par ?? ''}
							onChange={(e) => handleEditFieldChange(product.product_id, 'i_par', e.target.value)}
							className="w-16 text-center border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
						  />
					</td>
                    <td className="px-4 py-4 text-center bg-gray-50 dark:bg-gray-800/50 rounded">
                      <input 
							type="text" 
							value={editingRows[product.product_id]?.i_onhand ?? product.i_onhand}
						onChange={(e) => handleEditFieldChange(product.product_id, 'i_onhand', e.target.value)}
							className="w-16 text-center border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
						  />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center gap-2">
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
                          <button onClick={() => handleEditClick(product)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <Edit size={16} className="text-gray-600 dark:text-gray-400" />
                          </button>
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
        
        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border ${
                    currentPage === 1
                      ? 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex gap-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-3 py-2 rounded-lg font-medium ${
                          currentPage === page
                            ? 'text-white accent-bg'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPages
                      ? 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
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
                {isAddMode ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setIsAddMode(false);
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
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                      <input
                        type="text"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
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
                        <a href="#" className="text-blue-600 hover:underline" onClick={(e) => { e.preventDefault(); }}>Add Flavor</a>
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
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
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
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Measurements</label>
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

                  {/* Conditional Price Fields Based on Measurements */}
                  {editFormData.medMeasurements === 'bulk' || editFormData.medMeasurements === 'Pounds' ? (
                    // Bulk/Pounds - Show Gram Prices and Shake Tiers
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Medicine Values: Price</h3>
                      
                      {/* Gram Price Inputs */}
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Gram</label>
                          <input type="number" step="0.01" value={editFormData.value1} onChange={(e) => {setEditFormData({ ...editFormData, value1: e.target.value })}} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="$" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">1/8</label>
                          <input type="number" step="0.01" value={editFormData.value2} onChange={(e) => {setEditFormData({ ...editFormData, value2: e.target.value })}} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="$" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">1/4</label>
                          <input type="number" step="0.01" value={editFormData.value3} onChange={(e) => {setEditFormData({ ...editFormData, value3: e.target.value })}} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="$" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">1/2</label>
                          <input type="number" step="0.01" value={editFormData.value4} onChange={(e) => {setEditFormData({ ...editFormData, value4: e.target.value })}} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="$" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">OZ.</label>
                          <input type="number" step="0.01" value={editFormData.value5} onChange={(e) => {setEditFormData({ ...editFormData, value5: e.target.value })}} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="$" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">1/2 Gram</label>
                          <input type="number" step="0.01" value={editFormData.value6} onChange={(e) => {setEditFormData({ ...editFormData, value6: e.target.value })}} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="$" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">2 Gram</label>
                          <input type="number" step="0.01" value={editFormData.value7} onChange={(e) => {setEditFormData({ ...editFormData, value7: e.target.value })}} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="$" />
                        </div>
                      </div>

                      {/* Shake Sale Tier Selection */}
                      {editModalFlowerTier.length > 0 && (
                        <div className="border-t border-gray-300 dark:border-gray-700 pt-4 mt-4">
                          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Shake Sale Tiers - Click to Apply Prices</label>
                          <div className="flex gap-2 flex-wrap">
                            {editModalFlowerTier.map(tier => (
                              <button
                                key={tier.tire_id}
                                onClick={() => handleSelectShakeTier(tier.tire_id)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                  selectedShakeTier === tier.tire_id
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                {tier.c_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Unit/Prepackage - Show Each Price
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">* Quantity</label>
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
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">$ Price</label>
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
                  )}

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
                    {isAddMode ? 'Create Product' : 'Update'}
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
    </div>
  );
}