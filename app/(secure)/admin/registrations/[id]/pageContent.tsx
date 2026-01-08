'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, AlertCircle, Eye, EyeOff, Mail, Phone, MapPin, Loader2, X, CheckCircle, XCircle,
  FileText, FileImage, Download, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import InvoicesTab from '@/components/InvoicesTab';

interface RegistrationPageProps {
  registrationId?: string;
}

interface RegistrationData {
  id: string;
  user_id: string;
  status: string;
  registration_details: any;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_mobile: string;
  contact_job_title: string;
  contact_company_name: string;
  account_name: string;
  website: string;
  billing_street: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  license_type: string;
  license_number: string;
  expiration_date: string;
  trade_name?: string;
  license_file?: string;
  modules?: any[];
  variants?: any[];
  assigned_modules?: any;
  admin_approval_data?: any;
}

interface FieldErrors {
  [key: string]: string;
}

interface Module {
  id: string;
  name: string;
  variants?: string[];
}

interface SelectedVariant {
  moduleId: string;
  variantIndex: number;
  variant: string;
}

interface ModuleAmount {
  moduleId: string;
  moduleName: string;
  amount: string;
}

interface UserData {
  data: {
    user_group_id?: number;
  };
}

const states: Record<string, string> = {
  '1': 'Alabama', '2': 'Alaska', '3': 'American Samoa', '4': 'Arizona', '5': 'Arkansas',
  '6': 'California', '7': 'Colorado', '8': 'Connecticut', '9': 'Delaware', '10': 'District Of Columbia',
  '11': 'Federated States Of Micronesia', '12': 'Florida', '13': 'Georgia', '14': 'Guam', '15': 'Hawaii',
  '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa', '20': 'Kansas',
  '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine', '24': 'Marshall Islands', '25': 'Maryland',
  '26': 'Massachusetts', '27': 'Michigan', '28': 'Minnesota', '29': 'Mississippi', '30': 'Missouri',
  '31': 'Montana', '32': 'Nebraska', '33': 'Nevada', '34': 'New Hampshire', '35': 'New Jersey',
  '36': 'New Mexico', '37': 'New York', '38': 'North Carolina', '39': 'North Dakota', '40': 'Northern Mariana Islands',
  '41': 'Ohio', '42': 'Oklahoma', '43': 'Oregon', '44': 'Palau', '45': 'Pennsylvania',
  '46': 'Puerto Rico', '47': 'Rhode Island', '48': 'South Carolina', '49': 'South Dakota', '50': 'Tennessee',
  '51': 'Texas', '52': 'Utah', '53': 'Vermont', '54': 'Virgin Islands', '55': 'Virginia',
  '56': 'Washington', '57': 'West Virginia', '58': 'Wisconsin', '59': 'Wyoming',
};

const ADMIN_GROUP_IDS = ['1'];

export default function RegistrationPage({ registrationId }: RegistrationPageProps) {
  const router = useRouter();
  
  // State management
  const [activeTab, setActiveTab] = useState('contact');
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    contact: true,
    business: true,
    license: true,
    adminApprove: true,
  });

  // Admin Approval state - Variant selection on left, module amounts on right
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);
  const [moduleAmounts, setModuleAmounts] = useState<ModuleAmount[]>([]);
  const [adminApprovalNotes, setAdminApprovalNotes] = useState('');
  const [trialDays, setTrialDays] = useState('15');
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalSubmitted, setApprovalSubmitted] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [showLicensePreview, setShowLicensePreview] = useState(false);
  const [licenseFileLoading, setLicenseFileLoading] = useState(false);
  
  const [modules] = useState<Module[]>([
    { 
      id: 'pos', 
      name: 'Dispensary Retail POS', 
      variants: ['With Business Page', 'Without Business Page', 'With METRC', 'Without METRC']
    },
    { 
      id: 'marketplace_buy', 
      name: 'Dispensary Marketplace Buy', 
      variants: []
    },
    { 
      id: 'brands_marketplace', 
      name: 'Brands Marketplace', 
      variants: ['With Business Page', 'Without Business Page', 'With METRC', 'Without METRC']
    },
    { 
      id: 'business_page', 
      name: 'Business Page Only', 
      variants: ['With Inventory', 'Without Inventory', 'With METRC', 'Without METRC']
    },
    { 
      id: 'feature_items', 
      name: 'Feature Items (each)', 
      variants: []
    },
    { 
      id: 'feature_page', 
      name: 'Feature Page (each)', 
      variants: []
    },
  ]);

  const getUserGroupIdFromLocalStorage = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData: UserData = JSON.parse(userStr);
        return userData.data.user_group_id?.toString() || null;
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return null;
  }, []);

  // Auto-select variants and amounts when registration data changes
  useEffect(() => {
    if (registrationData?.modules && registrationData.modules.length > 0 && !hasAutoSelected) {
      
      if(registrationData.status === 'approved'){
		setApprovalSubmitted(true);
	  }
      const newSelectedVariants: SelectedVariant[] = [];
      const newModuleAmounts: ModuleAmount[] = [];

      // Group variants by module_id
      const variantsByModule = (registrationData.variants || []).reduce((acc: Record<string, any[]>, variant: any) => {
        if (!acc[variant.module_id]) {
          acc[variant.module_id] = [];
        }
        acc[variant.module_id].push(variant);
        return acc;
      }, {});

      //console.log('📦 Variants grouped by module:', variantsByModule);

      // Deduplicate modules by module_id (keep the first occurrence)
      const uniqueModules = Array.from(
        new Map(
          registrationData.modules.map((module: any) => [module.module_id, module])
        ).values()
      );

      // Process each unique module
      uniqueModules.forEach((module: any) => {
        const moduleId = module.module_id;
        const moduleName = module.module_name;
        const amount = module.amount;

        //console.log(`Processing module: ${moduleId} (${moduleName}) - Amount: ${amount}`);

        // Add module amount
        newModuleAmounts.push({
          moduleId,
          moduleName,
          amount,
        });

        // Find all variants for this module
        const moduleVariants = variantsByModule[moduleId] || [];

        if (moduleVariants.length > 0) {
          // Auto-select all variants for this module
          moduleVariants.forEach((variant: any) => {
            const variantIndex = parseInt(variant.variant_index);
            //console.log(`  ✓ Adding variant: ${variant.variant_name} (index: ${variantIndex})`);
            newSelectedVariants.push({
              moduleId,
              variantIndex,
              variant: variant.variant_name,
            });
          });
        } else {
          // If no variants, just select the module
          //console.log(`  ✓ No variants - adding module as primary selection`);
          newSelectedVariants.push({
            moduleId,
            variantIndex: 0,
            variant: moduleName,
          });
        }
      });

      //console.log('✅ Auto-selected variants:', newSelectedVariants);
      //console.log('✅ Module amounts:', newModuleAmounts);

      setSelectedVariants(newSelectedVariants);
      setModuleAmounts(newModuleAmounts);
      setHasAutoSelected(true);
    }
  }, [registrationData?.modules, registrationData?.variants, hasAutoSelected]);

  // Initialize and fetch data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Check admin authorization
        const userGroupId = getUserGroupIdFromLocalStorage();
        //console.log('👤 User group ID:', userGroupId);

        if (!userGroupId || !ADMIN_GROUP_IDS.includes(userGroupId)) {
          console.warn('❌ Unauthorized: User is not admin');
          setIsAuthorized(false);
          toast.error('Unauthorized: Admin access required', {
            position: 'bottom-center',
            autoClose: 3000,
          });
          return;
        }

        setIsAuthorized(true);

        // If we have registration ID, fetch data
        if (registrationId) {
          await fetchRegistrationData(registrationId);
        } else {
          console.error('❌ No registration ID provided');
          toast.error('No registration ID provided', {
            position: 'bottom-center',
            autoClose: 3000,
          });
        }
      } catch (error) {
        console.error('❌ Error initializing:', error);
        toast.error('Failed to initialize page', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [registrationId, router, getUserGroupIdFromLocalStorage]);

  // Fetch registration data
  const fetchRegistrationData = async (id: string) => {
    try {

      const response = await axios.get(`/api/admin/register-id/?id=${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 API Response:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        //console.log('✅ Registration data fetched successfully');
        const data = response.data.data;
        setRegistrationData(data);
        
        // Check if this is a reload of previously approved data
        if (data.admin_approval_data?.selected_variants) {
         // console.log('⏭️ Using previously saved variants from admin_approval_data');
          setSelectedVariants(data.admin_approval_data.selected_variants);
          setHasAutoSelected(true);
        }

        // Initialize module amounts from existing data or auto-select
        if (data.admin_approval_data?.module_amounts) {
          //console.log('⏭️ Using previously saved module amounts');
          setModuleAmounts(data.admin_approval_data.module_amounts);
        }

        // Initialize other admin approval data
        if (data.admin_approval_data) {
          setAdminApprovalNotes(data.admin_approval_data.notes || '');
          setTrialDays(data.admin_approval_data.trial_days || '15');
        }
      } else {
        console.error('❌ API returned error:', response.data.error);
        toast.error('Failed to load registration data', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      console.error('❌ Fetch error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to load registration data';
      toast.error(errorMsg, {
        position: 'bottom-center',
        autoClose: 3000,
      });
    }
  };

  // Handle variant checkbox change
  const handleVariantChange = (moduleId: string, variantIndex: number, variant: string) => {
    setSelectedVariants((prev) => {
      const existingIndex = prev.findIndex(
        (sv) => sv.moduleId === moduleId && sv.variantIndex === variantIndex
      );

      let updatedVariants;
      if (existingIndex > -1) {
        // Remove if unchecked
        updatedVariants = prev.filter((_, idx) => idx !== existingIndex);
      } else {
        // Add if checked
        updatedVariants = [...prev, { moduleId, variantIndex, variant }];
      }

      // Check if any variants remain for this module
      const hasVariantsForModule = updatedVariants.some((sv) => sv.moduleId === moduleId);
      
      // If no variants for this module, remove the module amount
      if (!hasVariantsForModule) {
        setModuleAmounts((prevAmounts) =>
          prevAmounts.filter((ma) => ma.moduleId !== moduleId)
        );
      } else {
        // Auto-add module amount if not already present and we're adding a variant
        const moduleExists = moduleAmounts.some((ma) => ma.moduleId === moduleId);
        if (!moduleExists && existingIndex === -1) {
          const moduleName = modules.find((m) => m.id === moduleId)?.name || moduleId;
          setModuleAmounts((prevAmounts) => {
            // Double-check no duplicate exists before adding
            if (!prevAmounts.some((ma) => ma.moduleId === moduleId)) {
              return [...prevAmounts, { moduleId, moduleName, amount: '' }];
            }
            return prevAmounts;
          });
        }
      }

      return updatedVariants;
    });
  };

  // Handle module amount change
  const handleModuleAmountChange = (moduleId: string, amount: string) => {
    setModuleAmounts((prev) =>
      prev.map((ma) =>
        ma.moduleId === moduleId ? { ...ma, amount } : ma
      )
    );
  };

  // Check if variant is selected
  const isVariantSelected = (moduleId: string, variantIndex: number) => {
    return selectedVariants.some(
      (sv) => sv.moduleId === moduleId && sv.variantIndex === variantIndex
    );
  };

  // Get module name by ID
  const getModuleName = (moduleId: string) => {
    return modules.find((m) => m.id === moduleId)?.name || moduleId;
  };

  // Calculate total charge
  const calculateTotalCharge = () => {
    return moduleAmounts.reduce((total, ma) => {
      const amount = parseFloat(ma.amount) || 0;
      return total + amount;
    }, 0);
  };

  // Get modules that have selected variants
  const getModulesWithSelectedVariants = () => {
    const uniqueModuleIds = new Set(selectedVariants.map((sv) => sv.moduleId));
    return Array.from(uniqueModuleIds);
  };

  // Handle save admin approval
  const handleSaveAdminApproval = async () => {
    try {
      setSubmitting(true);
      if (!registrationData?.user_id) {
        toast.error('Registration data not loaded', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        return;
      }

      if (selectedVariants.length === 0) {
        toast.error('Please select at least one variant', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        return;
      }

      /*console.log('🔄 Saving admin approval:', {
        registrationId: registrationData.user_id,
        variants: selectedVariants,
        moduleAmounts: moduleAmounts,
        notes: adminApprovalNotes,
        trialDays: trialDays,
      });*/

      const response = await axios.post(`/api/admin/register-id/?id=${registrationData.user_id}`, {
        selected_variants: selectedVariants,
        module_amounts: moduleAmounts,
        admin_notes: adminApprovalNotes,
        trial_days: parseInt(trialDays),
        user_id: registrationData.user_id,
        status: 'approved',
      });


      if (response.data.status === 'success') {
        toast.success('Admin approval settings saved successfully!', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        // Update local registration data
        setRegistrationData({
          ...registrationData,
          admin_approval_data: {
            selected_variants: selectedVariants,
            module_amounts: moduleAmounts,
            notes: adminApprovalNotes,
            trial_days: trialDays,
          },
        });
      } else {
        toast.error(response.data.error || 'Failed to save admin approval', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      console.error('❌ Admin approval save error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to save admin approval settings';
      toast.error(errorMsg, {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle approval
  const handleApprove = async () => {
    try {
      setSubmitting(true);
      if (!registrationData?.id) {
        toast.error('Registration data not loaded', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        setSubmitting(false);
        return;
      }

      if (selectedVariants.length === 0) {
        toast.error('Please select at least one variant', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        setSubmitting(false);
        return;
      }


      const response = await axios.post(`/api/admin/register-id/?id=${registrationData.id}`, {
        selected_variants: selectedVariants,
        module_amounts: moduleAmounts,
        admin_notes: adminApprovalNotes,
        trial_days: parseInt(trialDays),
        status: 'approved',
        id: registrationData.id,
        user_id: registrationData.user_id,
      });


      if (response.data.status === 'success') {
        // Mark approval as submitted to prevent double-click and hide buttons
        setApprovalSubmitted(true);
        
        toast.success('Registration approved successfully!', {
          position: 'bottom-center',
          autoClose: 3000,
        });

        // Update registration data to reflect approved status
        setRegistrationData({
          ...registrationData,
          status: 'approved',
        });

        // Redirect after a brief delay to show the success toast
        setTimeout(() => {
          router.push('/admin/registrations');
        }, 1500);
      } else {
        toast.error(response.data.error || 'Failed to approve registration', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        setSubmitting(false);
      }
    } catch (error: any) {
      console.error('❌ Approval error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to approve registration';
      toast.error(errorMsg, {
        position: 'bottom-center',
        autoClose: 3000,
      });
      setSubmitting(false);
    }
  };

  // Handle update (same API call as approve for approved registrations)
  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      if (!registrationData?.id) {
        toast.error('Registration data not loaded', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        setSubmitting(false);
        return;
      }

      if (selectedVariants.length === 0) {
        toast.error('Please select at least one variant', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        setSubmitting(false);
        return;
      }

      const response = await axios.post(`/api/admin/register-id/?id=${registrationData.id}`, {
        selected_variants: selectedVariants,
        module_amounts: moduleAmounts,
        admin_notes: adminApprovalNotes,
        trial_days: parseInt(trialDays),
        status: 'approved_update',
        id: registrationData.id,
        user_id: registrationData.user_id,
      });

      if (response.data.status === 'success') {
        toast.success('Registration updated successfully!', {
          position: 'bottom-center',
          autoClose: 3000,
        });

        // Update registration data
        setRegistrationData({
          ...registrationData,
          admin_approval_data: {
            selected_variants: selectedVariants,
            module_amounts: moduleAmounts,
            notes: adminApprovalNotes,
            trial_days: trialDays,
          },
        });

        // Exit update mode
        setIsUpdateMode(false);
      } else {
        toast.error(response.data.error || 'Failed to update registration', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        setSubmitting(false);
      }
    } catch (error: any) {
      console.error('❌ Update error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update registration';
      toast.error(errorMsg, {
        position: 'bottom-center',
        autoClose: 3000,
      });
      setSubmitting(false);
    }
  };

  // Handle rejection
  const handleReject = () => {
    setShowRejectModal(true);
  };

  // Confirm rejection
  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a reason for rejection', {
        position: 'bottom-center',
        autoClose: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);

      if (!registrationData?.user_id) {
        toast.error('Registration data not loaded', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        return;
      }

      

      const response = await axios.post(`/api/admin/register-id/?id=${registrationData.user_id}`, {
        status: 'rejected',
        rejection_reason: rejectReason,
        registrationId: registrationData.user_id,
      });


      if (response.data.status === 'success') {
        toast.success('Registration rejected successfully!', {
          position: 'bottom-center',
          autoClose: 3000,
        });

        setTimeout(() => {
          router.push('/admin/registrations');
        }, 1500);
      } else {
        toast.error(response.data.error || 'Failed to reject registration', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      console.error('❌ Rejection error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to reject registration';
      toast.error(errorMsg, {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading registration data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Unauthorized Access</p>
          <p className="text-gray-600 text-sm mt-2">Admin access is required to view this page</p>
        </div>
      </div>
    );
  }

  if (!registrationData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Failed to load registration data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {registrationData.contact_first_name} {registrationData.contact_last_name}
              </h1>
              <p className="text-gray-600 mt-2">{registrationData.account_name}</p>
            </div>
            <button
              onClick={() => router.push('/admin/registrations')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              ← Back to List
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              registrationData.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : registrationData.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {registrationData.status?.charAt(0).toUpperCase() + registrationData.status?.slice(1)}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'contact', label: 'Contact Information' },
              { id: 'business', label: 'Business Information' },
              { id: 'license', label: 'License Information' },
              { id: 'adminApprove', label: 'Admin Approve' },
              ...(approvalSubmitted ? [{ id: 'invoices', label: '💰 Invoices' }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={registrationData?.contact_first_name || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={registrationData?.contact_last_name || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={registrationData?.contact_email || ''}
                        readOnly
                        className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={registrationData?.contact_mobile || ''}
                        readOnly
                        className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                    <input
                      type="text"
                      value={registrationData?.contact_job_title || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Business Tab */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={registrationData?.contact_company_name || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      value={registrationData?.website || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trade Name</label>
                    <input
                      type="text"
                      value={registrationData?.trade_name || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                      placeholder="Not provided"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-2" />
                      <input
                        type="text"
                        value={registrationData?.billing_street || ''}
                        readOnly
                        className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={registrationData?.billing_city || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={states[registrationData?.billing_state || ''] || registrationData?.billing_state || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={registrationData?.billing_postal_code || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* License Tab */}
            {activeTab === 'license' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Type</label>
                    <input
                      type="text"
                      value={registrationData?.license_type || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                    <input
                      type="text"
                      value={registrationData?.license_number || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                    <input
                      type="date"
                      value={registrationData?.expiration_date || ''}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">License File</label>
                    {registrationData?.license_file ? (
                      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-6 h-6 text-gray-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">License Document</p>
                              <p className="text-xs text-gray-500 mt-1 break-all">{registrationData.license_file}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => setShowLicensePreview(true)}
                            disabled={licenseFileLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            {licenseFileLoading ? 'Loading...' : 'Preview'}
                          </button>
                          <a
                            href={registrationData.license_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <p className="text-sm text-gray-500 italic">No license file provided</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Approve Tab - UPDATED WITH AUTO-SELECTION FROM API */}
            {activeTab === 'adminApprove' && (
              <div className="space-y-8">
                {/* Status Info */}
                {hasAutoSelected && registrationData.modules && registrationData.modules.length > 0 && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-teal-900">
                        Auto-selected {registrationData.modules.length} module(s) with {registrationData.variants?.length || 0} variant(s) from API data
                      </p>
                      <p className="text-xs text-teal-700 mt-1">
                        You can modify selections below before saving or approving
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Column - Module & Variant Selection (3/4) */}
                  <div className="lg:col-span-3">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-6">Assign Modules:</h3>
                      <div className="space-y-6">
                        {modules.map((module) => (
                          <div key={module.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                            {/* Module Name */}
                            <h4 className="text-sm font-bold text-gray-800 mb-3">{module.name}</h4>

                            {/* Variants or No Variants Message */}
                            {module.variants && module.variants.length > 0 ? (
                              <div className="space-y-3 ml-4">
                                {module.variants.map((variant, variantIndex) => (
                                  <div key={`${module.id}-${variantIndex}`} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                                    <input
                                      type="checkbox"
                                      id={`${module.id}-variant-${variantIndex}`}
                                      checked={isVariantSelected(module.id, variantIndex)}
                                      onChange={() => handleVariantChange(module.id, variantIndex, variant)}
                                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                                    />
                                    <label
                                      htmlFor={`${module.id}-variant-${variantIndex}`}
                                      className="flex-1 text-sm text-gray-700 cursor-pointer"
                                    >
                                      • {variant}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600 ml-4">
                                <input
                                  type="checkbox"
                                  id={`${module.id}-novariant`}
                                  checked={isVariantSelected(module.id, 0)}
                                  onChange={() => handleVariantChange(module.id, 0, module.name)}
                                  className="w-4 h-4 text-teal-600 rounded cursor-pointer mr-2"
                                />
                                <label htmlFor={`${module.id}-novariant`} className="cursor-pointer">
                                  Select this module
                                </label>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="mt-8">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Admin Notes</label>
                      <textarea
                        value={adminApprovalNotes}
                        onChange={(e) => setAdminApprovalNotes(e.target.value)}
                        placeholder="Add any additional notes for this approval..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Right Column - Module Amounts (1/4) */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                      <h4 className="text-lg font-bold text-teal-600 mb-6">Monthly Charge</h4>
                      
                      {/* Module Amounts */}
                      <div className="space-y-4 mb-8">
                        {moduleAmounts.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">Select variants to add amounts</p>
                        ) : (
                          moduleAmounts.map((ma, index) => (
                            <div key={`${ma.moduleId}-${index}`} className="pb-4 border-b border-gray-200">
                              <p className="text-xs text-gray-600 mb-2 font-semibold line-clamp-2">
                                {ma.moduleName}
                              </p>
                              <input
                                type="number"
                                value={ma.amount}
                                onChange={(e) => handleModuleAmountChange(ma.moduleId, e.target.value)}
                                placeholder="Enter amount"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm"
                              />
                            </div>
                          ))
                        )}
                      </div>

                      {/* Total Amount */}
                      {moduleAmounts.length > 0 && (
                        <div className="mb-6 p-3 bg-teal-50 rounded-lg border border-teal-200">
                          <p className="text-xs text-gray-600 mb-1">Total Monthly Charge</p>
                          <p className="text-xl font-bold text-teal-600">
                            ${calculateTotalCharge().toFixed(2)}
                          </p>
                        </div>
                      )}

                      {/* Trial Days */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Trial Days</label>
                        <input
                          type="number"
                          value={trialDays}
                          onChange={(e) => setTrialDays(e.target.value)}
                          min="0"
                          max="365"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save/Approve Button - Hidden after approval */}
                {!approvalSubmitted && (
                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={handleReject}
                      disabled={submitting || registrationData?.status !== 'pending'}
                      className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {submitting ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={submitting || selectedVariants.length === 0 || registrationData?.status !== 'pending'}
                      className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {submitting ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                )}

                {/* Update Button - Shown after approval */}
                {approvalSubmitted && !isUpdateMode && (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-medium text-green-700">
                        Registration approved successfully.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsUpdateMode(true)}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                    >
                      Update
                    </button>
                  </div>
                )}

                {/* Update Mode Buttons */}
                {approvalSubmitted && isUpdateMode && (
                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={() => setIsUpdateMode(false)}
                      disabled={submitting}
                      className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={submitting || selectedVariants.length === 0}
                      className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {submitting ? 'Updating...' : 'Save Update'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Invoices Tab - Only show after approval */}
            {activeTab === 'invoices' && approvalSubmitted && registrationData && (
              <div>
                <InvoicesTab 
                  registrationData={{
                    user_id: registrationData.user_id,
                    account_name: registrationData.account_name,
                    contact_email: registrationData.contact_email,
                  }} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Reject Registration</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to reject this registration for{' '}
                  <span className="font-semibold text-gray-900">{registrationData?.account_name}</span>?
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this registration..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700">
                    <span className="font-semibold">Warning:</span> This action cannot be undone. The applicant will be notified of the rejection.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  disabled={submitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={submitting || !rejectReason.trim()}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* License File Preview Modal */}
        {showLicensePreview && registrationData?.license_file && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">License File Preview</h3>
                <button
                  onClick={() => setShowLicensePreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto bg-gray-100 p-4">
                {registrationData.license_file.match(/\.(pdf|doc|docx)$/i) ? (
                  <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center h-full">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium mb-4">Document Preview</p>
                    <p className="text-sm text-gray-500 mb-6 text-center">
                      This document type cannot be previewed directly in the browser.
                    </p>
                    <a
                      href={registrationData.license_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download to View
                    </a>
                  </div>
                ) : registrationData.license_file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <div className="bg-white rounded-lg p-4 flex items-center justify-center h-full">
                    <img
                      src={registrationData.license_file}
                      alt="License"
                      className="max-w-full max-h-full object-contain"
                      onError={() => (
                        <div className="text-center">
                          <FileImage className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
                          <p className="text-gray-600">Failed to load image</p>
                        </div>
                      )}
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center h-full">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium mb-4">File Preview</p>
                    <p className="text-sm text-gray-500 mb-6 text-center">
                      Preview not available for this file type.
                    </p>
                    <a
                      href={registrationData.license_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end bg-gray-50">
                <a
                  href={registrationData.license_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => setShowLicensePreview(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}