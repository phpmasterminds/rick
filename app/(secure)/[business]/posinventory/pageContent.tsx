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
  is_pos: string; // "0" or "1"
  s_rooms: string | null;
  selected_rooms?: string[]; // Array from API
  enable_product: string; // "0" or "1" for PAGE
  p_offer_price: string;
  i_deals: string | null;
  i_par: string | null;
  i_weight: string;
  i_onhand: string;
  i_total_weight: string;
  text_parsed: string;
  thc: string;
  cbd: string;
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
      {/* POS Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">POS</span>
        <button
          onClick={() => {
            const isCurrentlyPOS = product.is_pos === '1';
            onToggle(product.product_id, product.is_pos, 'POS');
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
            product.is_pos === '1'
              ? 'accent-bg'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              product.is_pos === '1' ? 'translate-x-6' : 'translate-x-1'
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
    </div>
  );
}

export default function PageContent({ business }: { business: string }) {
  const readableName = business.replace(/-/g, " ");

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
  const [editModalCategories, setEditModalCategories] = useState<ApiCategory[]>([]);
  const [editModalFlavors, setEditModalFlavors] = useState<Flavor[]>([]);
  const [editModalFeelings, setEditModalFeelings] = useState<Feeling[]>([]);
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
    feeling: '',
    medMeasurements: 'unit',
    medEachValue: 'Each',
    medEachPrice: '',
    medGramPrice: '',
    medValue: ['', '', '', '', '', '', ''], // For bulk/pounds gram prices
    price1: '',
    price2: '',
    price3: '',
    selectedRoom: [],
    pos: false,
    page: false,
    thc: '',
    cbd: ''
  });
  
  // Shake Sale Tier states
  const [shakeSaleTiers, setShakeSaleTiers] = useState<ShakeSaleTier[]>([]);
  const [selectedShakeTier, setSelectedShakeTier] = useState<string>('');
  
  // Image upload states
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string>('');
  
  // Subcategories state
  const [editModalSubcategories, setEditModalSubcategories] = useState<ApiCategory[]>([]);
  
  const [editModalFlowerTier, setEditModalFlowerTier] = useState<ApiCategory[]>([]);
  
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
  const [editingRows, setEditingRows] = useState<{ [key: string]: { weight: string; totalWeight: string } }>({});
  
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
  
  useEffect(() => {
    const fetchInventoryDetails = async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/business/posinventory?business=${business}&page=${page}`);
        
        if (response.data.status === 'success') {
          const productsData = response.data.data.products || [];
          const roomsData = response.data.data.aRooms || [];
          
          // Transform selected_rooms array to s_rooms string
          const transformedProducts = transformProductsData(productsData);
          
          setRooms(roomsData);
          setTotalProducts(response.data.data.total || 0);
          
          if (page === 1) {
            setAllProducts(transformedProducts);
            setProducts(transformedProducts);
            
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
            
            toast.success(`Loaded ${productsData.length} products successfully`);
          } else {
            setAllProducts(prev => [...prev, ...transformedProducts]);
            setProducts(prev => [...prev, ...transformedProducts]);
          }
        } else if (response.data.status === 'failed') {
          // Handle failed status without throwing
          let errorMsg = 'Failed to load inventory';
          
          if (response.data.error?.message) {
            errorMsg = response.data.error.message;
          } else if (response.data.message) {
            errorMsg = response.data.message;
          }
          
          // Strip HTML tags if present
          errorMsg = errorMsg.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '');
          
          setError(errorMsg);
          toast.error(errorMsg, {
            position: 'bottom-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          throw new Error('Unexpected response status');
        }
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

    fetchInventoryDetails(apiPage);
  }, [apiPage, business]);
  
  useEffect(() => {
    // Load more pages if needed
    if (allProducts.length < totalProducts && !loading) {
      setApiPage(prev => prev + 1);
    }
  }, [allProducts.length, totalProducts, loading]);

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

  const handleSafeClick = (product: Product) => {
    const onHand = parseInt(product.i_onhand) || 0;
    const safeStorage = parseInt(product.i_safehand) || 0; // Use i_safehand field from product
    setSafeProduct(product);
    setSafeValues({
      onHand,
      safeStorage,
      posAvailable: onHand - safeStorage
    });
    setShowSafeModal(true);
  };

  const handleSafeSubmit = async () => {
    try {
      // API call to update safe storage
      const response = await axios.post('/api/business/update-safe-storage', {
        product_id: safeProduct?.product_id,
        safe_storage: safeValues.safeStorage
      });
      
      if (response.data.status === 'success') {
        toast.success('Safe storage updated successfully!');
        setShowSafeModal(false);
        // Refresh the product data
        setApiPage(1);
        setAllProducts([]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to update safe storage';
      toast.error(errorMessage, {
        position: 'bottom-center',
        autoClose: 5000,
      });
    }
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
      }
      
      const response = await axios.post('/api/business/toggle-publish', payload);
      
      if (response.data.status === 'success') {
        // Update local state
        const updateFn = (prev: Product[]) => prev.map(p => 
          p.product_id === productId 
            ? { 
                ...p,
                ...(publishType === 'POS' && { is_pos: newStatus }),
                ...(publishType === 'PAGE' && { enable_product: newStatus })
              }
            : p
        );

        setProducts(updateFn);
        setAllProducts(updateFn);
        
        const typeLabel = publishType === 'POS' ? 'POS' : 'Page';
        const action = newStatus === '1' ? 'enabled for' : 'disabled for';
        toast.success(`Product ${action} ${typeLabel}!`);
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update product');
    }
  };

  const handleToggleDeals = async (productId: string, currentDeals: string | null) => {
    try {
      const newDeals = currentDeals === '1' ? '0' : '1';
      const response = await axios.post('/api/business/toggle-deals', {
        product_id: productId,
        i_deals: newDeals
      });
      
      if (response.data.status === 'success') {
        // Update local state
        setProducts(prev => prev.map(p => 
          p.product_id === productId ? { ...p, i_deals: newDeals } : p
        ));
        setAllProducts(prev => prev.map(p => 
          p.product_id === productId ? { ...p, i_deals: newDeals } : p
        ));
        toast.success(`Deals ${newDeals === '1' ? 'enabled' : 'disabled'} successfully!`);
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to toggle deals');
    }
  };

  const handleRoomChange = async (productId: string, roomIds: string[]) => {
    try {
      // If no rooms selected, send null; otherwise join with comma
      const roomsValue = roomIds.length > 0 ? roomIds.join(',') : null;
      
      const response = await axios.post('/api/business/update-room', {
        product_id: productId,
        s_rooms: roomsValue  // ← null or "room-1,room-2"
      });
      
      if (response.data.status === 'success') {
        // Update local state
        setProducts(prev => prev.map(p => 
          p.product_id === productId 
            ? { ...p, s_rooms: roomsValue }
            : p
        ));
        setAllProducts(prev => prev.map(p => 
          p.product_id === productId 
            ? { ...p, s_rooms: roomsValue }
            : p
        ));
        
        // Close dropdown
        setShowRoomDropdown(prev => ({ ...prev, [productId]: false }));
        
        toast.success('Rooms updated successfully!');
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update rooms');
    }
  };

  // Toggle room selection in dropdown
  const handleRoomToggle = (productId: string, roomId: string) => {
    setSelectedRooms(prev => {
      const current = prev[productId] || [];
      const isSelected = current.includes(roomId);
      
      return {
        ...prev,
        [productId]: isSelected
          ? current.filter(id => id !== roomId)
          : [...current, roomId]
      };
    });
  };

  // Save selected rooms
  const handleSaveRooms = (productId: string) => {
    const roomIds = selectedRooms[productId] || [];
    handleRoomChange(productId, roomIds);
  };

  // Open room edit dropdown
  const handleRoomEditClick = (product: Product) => {
    // Split by comma and trim whitespace from each room ID
    const currentRooms = product.s_rooms 
      ? product.s_rooms.split(',').map(room => room.trim()).filter(room => room.length > 0)
      : [];
    setSelectedRooms(prev => ({ ...prev, [product.product_id]: currentRooms }));
    setShowRoomDropdown(prev => ({ ...prev, [product.product_id]: true }));
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
      variantName: '',
      strainName: product.strain || '',
      quantityOnHand: product.i_onhand || '',
      weight: product.i_weight || '',
      sku: product.product_code || '',
      batchId: product.batch_id || '',
      tagNo: product.tag_no || '',
      category: product.cat_id || '',
      subcategory: '',
      strainCat: product.strain_cat || '',
      flavor: product.fla_cat_id || '',
      feeling: product.fle_cat_id || '',
      medMeasurements: product.med_measurements || 'unit',
      medEachValue: product.value1,
      medEachPrice: product.value2,
      medGramPrice: '',
      price1: '',
      price2: product.p_offer_price || '',
      price3: '',
	  value1: product.value1,
	  value2: product.value2,
	  value3: product.value3,
	  value4: product.value4,
	  value5: product.value5,
	  value6: product.value6,
	  value7: product.value7,
	  thc: product.thc,
	  cbd: product.cbd,
      selectedRoom: product.selected_rooms || [],
      pos: product.is_pos === '1',
      page: product.enable_product === '1'
    });
    
    fetchEditModalDropdowns(product);
  };

  const fetchEditModalDropdowns = async (product: Product) => {
    try {
      setEditModalLoading(true);
	  console.log('product.product_id'+product.product_id);
      // Call API to get categories, flavors, and feelings
      const response = await axios.get(`/api/business/categories?page_id=${product.page_id}&product_id=${product.product_id}`);
      
      if (response.data.status === 'success' && response.data.data) {
        const data = response.data.data;
        
        // Extract categories
        if (data.products) {
          setEditModalCategories(data.products);
          
          // Find and populate subcategories for the current product's category
          const selectedCategory = data.products.find((cat: any) => cat.cat_name === product.cat_name);
          if (selectedCategory && selectedCategory.sub) {
            setEditModalSubcategories(selectedCategory.sub);
          }
        }
        
        // Extract flavors
        if (data.flavors) {
          setEditModalFlavors(data.flavors);
        }
		
		// Extract flavors
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
		value1: tier["1_gram"],
		value7: tier["2_gram"],
		value2: tier["3_point_5_gram"],
		value3: tier["7_gram"],
		value4: tier["14_gram"],
		value5: tier["28_gram"],
		value6: tier["point_5_gram"],
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
      formData.append('s_rooms[]', editFormData.selectedRoom);
      formData.append('is_pos', editFormData.pos ? '1' : '0');
      formData.append('enable_product', editFormData.page ? '1' : '0');
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
				  is_pos: editFormData.pos ? '1' : '0',                        // update POS status
				  enable_product: editFormData.page ? '1' : '0',               // update enable status
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
				  is_pos: editFormData.pos ? '1' : '0',
				  enable_product: editFormData.page ? '1' : '0',
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

  const handleDealsClick = (product: Product) => {
    setDealsProduct(product);
    setGlobalPageId(product.page_id);
    setDealData({
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
    setShowDealsModal(true);
    
    // Fetch dropdown options with page_id
    fetchDiscountOptions(product.page_id);
  };

  const fetchDiscountOptions = async (pageId: string) => {
    try {
      setLoadingDropdowns(true);
      
      // Fetch all three in parallel with page_id parameter
      const [typesRes, membershipRes, scopesRes] = await Promise.all([
        axios.get(`/api/business/discount-types?page_id=${pageId}`),
        axios.get(`/api/business/membership-levels?page_id=${pageId}`),
        axios.get(`/api/business/discount-scopes?page_id=${pageId}`)
      ]);

      // Handle types response
      if (typesRes.data.status === 'success' && typesRes.data.data) {
        setDiscountTypes(typesRes.data.data);
        if (typesRes.data.data.length > 0) {
          setDealData(prev => ({ ...prev, type_id: typesRes.data.data[0].id }));
        }
      }

      // Handle membership response
      if (membershipRes.data.status === 'success' && membershipRes.data.data) {
        setMembershipLevels(membershipRes.data.data);
        if (membershipRes.data.data.length > 0) {
          setDealData(prev => ({ ...prev, membership_id: membershipRes.data.data[0].id }));
        }
      }

      // Handle scopes response
      if (scopesRes.data.status === 'success' && scopesRes.data.data) {
        setDiscountScopes(scopesRes.data.data);
        if (scopesRes.data.data.length > 0) {
          setDealData(prev => ({ ...prev, scope_id: scopesRes.data.data[0].id }));
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch discount options:', error);
      toast.error('Failed to load discount options');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleDealSubmit = async () => {
    try {
      // Parse numeric values
      const amount = parseFloat(dealData.amount) || 0;
      const percentage = parseFloat(dealData.percentage) || 0;
      const minimumQty = parseFloat(dealData.minimum_quantity) || 0;
      const minimumSpending = parseFloat(dealData.minimum_spending) || 0;
      const qtyAllowed = parseFloat(dealData.quantity_allowed) || 0;
      
      // Validation: Check discount name
      if (!dealData.discount_name.trim()) {
        toast.error('Please enter discount name');
        return;
      }
      
      // Validation: Check amount and percentage values
      if (amount < 0) {
        toast.error('Amount cannot be negative');
        return;
      }
      if (percentage < 0) {
        toast.error('Percentage cannot be negative');
        return;
      }
      if (percentage > 100) {
        toast.error('Percentage cannot be greater than 100%');
        return;
      }
      
      // Validation: At least one discount value
      if (amount === 0 && percentage === 0) {
        toast.error('Please provide either amount or percentage');
        return;
      }
      
      // Validation: Minimum quantity
      if (minimumQty < 0) {
        toast.error('Minimum quantity cannot be negative');
        return;
      }
      
      // Validation: Minimum spending
      if (minimumSpending < 0) {
        toast.error('Minimum spending cannot be negative');
        return;
      }
      
      // Validation: Quantity allowed (cannot be 0 or negative)
      if (!dealData.is_24_hours && qtyAllowed <= 0) {
        toast.error('Quantity allowed must be greater than 0');
        return;
      }
      
      // Validation: Days of week
      if (dealData.days_of_week.length === 0) {
        toast.error('Please select at least one day of week');
        return;
      }
      
      // Validation: Dates and Times (if not 24 hours)
      if (!dealData.is_24_hours) {
        // Check if dates are provided
        if (!dealData.start_date) {
          toast.error('Please select start date');
          return;
        }
        if (!dealData.end_date) {
          toast.error('Please select end date');
          return;
        }
        
        // Check if times are provided
        if (!dealData.start_time) {
          toast.error('Please select start time');
          return;
        }
        if (!dealData.end_time) {
          toast.error('Please select end time');
          return;
        }
        
        // Validate date range
        const startDate = new Date(dealData.start_date);
        const endDate = new Date(dealData.end_date);
        
        if (startDate > endDate) {
          toast.error('Start date cannot be after end date');
          return;
        }
        
        // Validate time range on same day
        if (dealData.start_date === dealData.end_date) {
          const [startHour, startMinute] = dealData.start_time.split(':').map(Number);
          const [endHour, endMinute] = dealData.end_time.split(':').map(Number);
          const startTimeInMinutes = startHour * 60 + startMinute;
          const endTimeInMinutes = endHour * 60 + endMinute;
          
          if (startTimeInMinutes >= endTimeInMinutes) {
            toast.error('Start time must be before end time');
            return;
          }
        }
      }

      const response = await axios.post('/api/business/add-deal', {
        product_id: dealsProduct?.product_id,
        page_id: globalPageId,
        discount_name: dealData.discount_name,
        discount_amount: amount > 0 ? amount : 0,
        discount_percentage: percentage > 0 ? percentage : 0,
        scope_id: dealData.scope_id,
        membership_id: dealData.membership_id,
        type_id: dealData.type_id,
        minimum_qty: minimumQty,
        minimum_spending: minimumSpending,
        qty_allowed: qtyAllowed > 0 ? qtyAllowed : 0,
        start_date: dealData.start_date,
        start_time: dealData.start_time,
        end_date: dealData.end_date,
        end_time: dealData.end_time,
        days_of_week: dealData.days_of_week,
        '24hours_checkbox': dealData.is_24_hours ? 1 : 0
      });
      
      if (response.data.status === 'success') {
        toast.success('Deal created successfully!');
        setShowDealsModal(false);
      } else {
        toast.error(response.data.message || 'Failed to create deal');
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to create deal');
    }
  };

  // Weight handlers
  const handleWeightChange = (productId: string, newWeight: string) => {
    const product = products.find(p => p.product_id === productId);
    if (!product) return;

    const weight = parseFloat(newWeight) || 0;
    const onHand = parseInt(product.i_onhand) || 0;
    const totalWeight = weight * onHand;

    setEditingRows(prev => ({
      ...prev,
      [productId]: {
        weight: newWeight,
        totalWeight: totalWeight.toString()
      }
    }));
  };

  const handleSaveWeight = async (product: Product) => {
    try {
      const rowData = editingRows[product.product_id];
      if (!rowData) return;

      const response = await axios.post('/api/business/update-product-weight', {
        product_id: product.product_id,
        i_weight: rowData.weight,
        i_total_weight: rowData.totalWeight
      });

      if (response.data.status === 'success') {
        // Update products list
        setProducts(prev => prev.map(p => 
          p.product_id === product.product_id
            ? { ...p, i_weight: rowData.weight, i_total_weight: rowData.totalWeight }
            : p
        ));
        setAllProducts(prev => prev.map(p => 
          p.product_id === product.product_id
            ? { ...p, i_weight: rowData.weight, i_total_weight: rowData.totalWeight }
            : p
        ));

        // Clear editing state
        setEditingRows(prev => {
          const newState = { ...prev };
          delete newState[product.product_id];
          return newState;
        });

        toast.success('Weight updated successfully!', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update weight');
    }
  };

  const handleCancelEdit = (productId: string) => {
    setEditingRows(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Loading inventory for {readableName}</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Error loading inventory for {readableName}</p>
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your product inventory for {readableName} • {filteredProducts.length} products
          {loading && allProducts.length > 0 && <span className="ml-2 text-blue-500">(Loading more...)</span>}
        </p>
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Safe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rooms</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Published</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Deals</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Weight</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">On Hand</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
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
                            {product.text_parsed || 'No description'} • THC: {product.thc}% • CBD: {product.cbd}%
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{product.cat_name}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{product.tag_no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleSafeClick(product)}
                        className={`inline-flex w-8 h-8 rounded-full items-center justify-center cursor-pointer transition-colors ${product.is_safe === '1' ? 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800' : 'bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800'}`}
                      >
                        {product.is_safe === '1' ? <CheckCircle size={16} className="text-green-600 dark:text-green-400" /> : <X size={16} className="text-red-600 dark:text-red-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="relative">
                        <button
                          onClick={() => {
                            const isOpening = !showRoomDropdown[product.product_id];
                            if (isOpening) {
                              // When opening, initialize selectedRooms with current s_rooms
                              const currentRooms = product.s_rooms 
                                ? product.s_rooms.split(',').map(room => room.trim()).filter(room => room.length > 0)
                                : [];
                              setSelectedRooms(prev => ({ ...prev, [product.product_id]: currentRooms }));
                            }
                            setShowRoomDropdown(prev => ({ ...prev, [product.product_id]: !prev[product.product_id] }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm text-left hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                        >
                          {product.s_rooms && product.s_rooms.length > 0
                            ? product.s_rooms.split(',').map(roomId => {
                                const trimmedId = roomId.trim();
                                const room = rooms.find(r => r.room_id === trimmedId);
                                return room ? (room.room_name || room.name) : null;
                              }).filter(Boolean).join(', ')
                            : 'None'}
                          <span className="float-right">▼</span>
                        </button>

                        {showRoomDropdown[product.product_id] && (
                          <div className="absolute z-50 top-full mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg p-3">
                            {/* All checkbox */}
                            <label className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded mb-2">
                              <input
                                type="checkbox"
                                checked={(selectedRooms[product.product_id] || []).length === rooms.length && rooms.length > 0}
                                onChange={() => {
                                  if ((selectedRooms[product.product_id] || []).length === rooms.length) {
                                    handleRoomToggle(product.product_id, 'all');
                                    setSelectedRooms(prev => ({ ...prev, [product.product_id]: [] }));
                                  } else {
                                    setSelectedRooms(prev => ({ ...prev, [product.product_id]: rooms.map(r => r.room_id) }));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">All</span>
                            </label>

                            {/* Divider */}
                            <div className="border-t border-gray-300 dark:border-gray-700 my-2"></div>

                            {/* Individual room checkboxes */}
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {rooms.length > 0 ? (
                                rooms.map((room) => (
                                  <label key={room.room_id} className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
                                    <input
                                      type="checkbox"
                                      checked={(selectedRooms[product.product_id] || []).includes(room.room_id)}
                                      onChange={() => handleRoomToggle(product.product_id, room.room_id)}
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                      {room.room_name || room.name}
                                    </span>
                                  </label>
                                ))
                              ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400 p-2">No rooms available</p>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-300 dark:border-gray-700">
                              <button
                                onClick={() => {
                                  handleSaveRooms(product.product_id);
                                }}
                                className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setShowRoomDropdown(prev => ({ ...prev, [product.product_id]: false }));
                                  setSelectedRooms(prev => ({ ...prev, [product.product_id]: [] }));
                                }}
                                className="flex-1 px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <PublishedToggle 
                        product={product}
                        onToggle={handleTogglePublish}
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-gray-100">${parseFloat(product.p_offer_price).toFixed(2)}</td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleDealsClick(product)}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors ${
                          product.i_deals === '1'
                            ? 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600'
                        }`}
                        title="Click to manage deals"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number" 
                        step="0.01"
                        value={editingRows[product.product_id]?.weight ?? product.i_weight}
                        onChange={(e) => handleWeightChange(product.product_id, e.target.value)}
                        className="w-16 text-center border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-gray-900 dark:text-gray-100">{product.i_onhand}</td>
                    <td className="px-4 py-4 text-center bg-gray-50 dark:bg-gray-800/50 rounded">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {editingRows[product.product_id]?.totalWeight ?? product.i_total_weight}
                      </div>
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

      {/* Safe Storage Modal */}
      {showSafeModal && safeProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Safe Storage</h2>
              <button
                onClick={() => setShowSafeModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">On Hand</label>
                <input
                  type="number"
                  value={safeValues.onHand}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Safe Storage</label>
                <input
                  type="number"
                  value={safeValues.safeStorage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setSafeValues(prev => ({
                      ...prev,
                      safeStorage: Math.min(val, prev.onHand),
                      posAvailable: prev.onHand - Math.min(val, prev.onHand)
                    }));
                  }}
                  min="0"
                  max={safeValues.onHand}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Pos Available</label>
                <input
                  type="number"
                  value={safeValues.posAvailable}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowSafeModal(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSafeSubmit}
                className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deals Modal */}
      {showDealsModal && dealsProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Deals</h2>
              <button
                onClick={() => setShowDealsModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Product Header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <Package size={40} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{dealsProduct.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{dealsProduct.tag_no}</p>
                </div>
              </div>

              {/* Discount Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Discount Name</label>
                <input
                  type="text"
                  value={dealData.discount_name}
                  onChange={(e) => setDealData(prev => ({ ...prev, discount_name: e.target.value }))}
                  placeholder="Enter discount name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Amount and Percentage Row */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Amount</label>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-l-lg">$</span>
                    <input
                      type="number"
                      value={dealData.amount}
                      onChange={(e) => setDealData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-r-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Percentage</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={dealData.percentage}
                      onChange={(e) => setDealData(prev => ({ ...prev, percentage: e.target.value }))}
                      placeholder="0"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <span className="text-2xl font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-r-lg">%</span>
                  </div>
                </div>
              </div>

              {/* Scope, Membership, Type */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Scope</label>
                  {loadingDropdowns ? (
                    <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <select
                      value={dealData.scope_id}
                      onChange={(e) => setDealData(prev => ({ ...prev, scope_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Scope</option>
                      {discountScopes.map(scope => (
                        <option key={scope.id} value={scope.id}>{scope.sco_name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Membership</label>
                  {loadingDropdowns ? (
                    <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <select
                      value={dealData.membership_id}
                      onChange={(e) => setDealData(prev => ({ ...prev, membership_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Membership</option>
                      {membershipLevels.map(membership => (
                        <option key={membership.id} value={membership.id}>{membership.level_name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type</label>
                  {loadingDropdowns ? (
                    <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <select
                      value={dealData.type_id}
                      onChange={(e) => setDealData(prev => ({ ...prev, type_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Type</option>
                      {discountTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.type_name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Minimum Quantity, Spending, Allowed */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Minimum Quantity</label>
                  <input
                    type="number"
                    value={dealData.minimum_quantity}
                    onChange={(e) => setDealData(prev => ({ ...prev, minimum_quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Minimum Spending</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dealData.minimum_spending}
                    onChange={(e) => setDealData(prev => ({ ...prev, minimum_spending: e.target.value }))}
                    placeholder="$0.00"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantity Allowed</label>
                  <input
                    type="number"
                    value={dealData.quantity_allowed}
                    onChange={(e) => setDealData(prev => ({ ...prev, quantity_allowed: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Start and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Start Date</label>
                  <input
                    type="date"
                    value={dealData.start_date}
                    onChange={(e) => setDealData(prev => ({ ...prev, start_date: e.target.value }))}
                    disabled={dealData.is_24_hours}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
                      dealData.is_24_hours
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">End Date</label>
                  <input
                    type="date"
                    value={dealData.end_date}
                    onChange={(e) => setDealData(prev => ({ ...prev, end_date: e.target.value }))}
                    disabled={dealData.is_24_hours}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
                      dealData.is_24_hours
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  />
                </div>
              </div>

              {/* Start and End Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Start Time</label>
                  <input
                    type="time"
                    value={dealData.start_time}
                    onChange={(e) => setDealData(prev => ({ ...prev, start_time: e.target.value }))}
                    disabled={dealData.is_24_hours}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
                      dealData.is_24_hours
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">End Time</label>
                  <input
                    type="time"
                    value={dealData.end_time}
                    onChange={(e) => setDealData(prev => ({ ...prev, end_time: e.target.value }))}
                    disabled={dealData.is_24_hours}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
                      dealData.is_24_hours
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  />
                </div>
              </div>

              {/* 24 Hours Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dealData.is_24_hours}
                  onChange={(e) => setDealData(prev => ({ 
                    ...prev, 
                    is_24_hours: e.target.checked,
                    start_date: e.target.checked ? '' : prev.start_date,
                    end_date: e.target.checked ? '' : prev.end_date,
                    start_time: e.target.checked ? '' : prev.start_time,
                    end_time: e.target.checked ? '' : prev.end_time
                  }))}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">24 Hours</span>
              </label>

              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Days of Week</label>
                <div className="flex gap-2 flex-wrap">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <button
                      key={day}
                      onClick={() => handleToggleDayOfWeek(day.toLowerCase())}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        dealData.days_of_week.includes(day.toLowerCase())
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowDealsModal(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDealSubmit}
                className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
	  
	  {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Product</h2>
              <button
                onClick={() => setShowEditModal(false)}
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
					  readOnly		
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
						readOnly
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
						readOnly
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
                        readOnly
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
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select Flavor</label>
                      <select
                        value={editFormData.flavor}
                        onChange={(e) => setEditFormData({...editFormData, flavor: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select Flavor</option>
                        {editModalFlavors.map(flavor => (
                          <option key={flavor.cat_id} value={flavor.cat_name}>
                            {flavor.cat_name}
                          </option>
                        ))}
                      </select>
                    </div>
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



                  {/* Toggles */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pos</label>
                      <button
                        onClick={() => setEditFormData({...editFormData, pos: !editFormData.pos})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                          editFormData.pos
                            ? 'accent-bg'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            editFormData.pos ? 'translate-x-6' : 'translate-x-1'
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
                  </div>

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
                      setUploadedImage(null);
                      setUploadedImagePreview('');
                      setSelectedShakeTier('');
                    }}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveProduct()}
                    className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
                  >
                    Update
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