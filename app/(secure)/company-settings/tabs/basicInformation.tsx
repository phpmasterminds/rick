'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Upload, X, Plus, Edit2, Trash2, AlertCircle, Eye, Search, Loader2, FileText } from 'lucide-react';

// US States mapping
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

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = ['00', '15', '30', '45'];

interface HoursOfOperation {
  [day: string]: {
    isApplicable: boolean;
    schedule: string;
    startHour: string;
    startMinute: string;
    startPeriod: string;
    endHour: string;
    endMinute: string;
    endPeriod: string;
  };
}

interface CompanyData {
  id: string;
  type_id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  street: string;
  phone: string;
  mobile: string;
  fax: string;
  email: string;
  website: string;
  companyPhoto?: string;
  coverPhoto?: string;
  invoiceLogo?: string;
  allowReviews: boolean;
  offersVeteranDiscounts: boolean;
  wheelchairAccessible: boolean;
  atmOnPremises: boolean;
  customersCanPlaceOrders: boolean;
  curbsideServiceProvided: boolean;
  deliveryServiceAvailable: boolean;
  acceptedPayment: string;
  provides: string;
  hoursOfOperation?: HoursOfOperation;
}

interface PhotoUploadState {
  companyPhoto: File | null;
  coverPhoto: File | null;
  invoiceLogo: File | null;
  companyPhotoPreview: string | null;
  coverPhotoPreview: string | null;
  invoiceLogoPreview: string | null;
  companyPhotoLoading: boolean;
  coverPhotoLoading: boolean;
  invoiceLogoLoading: boolean;
}

interface License {
  id: string;
  license_id: string;
  account_name: string;
  trade_name: string;
  license_type: string;
  license_number: string;
  expiration_date: string;
  document_url?: string;
  created_at: string;
  status: 'active' | 'expired' | 'pending';
}

interface LicenseFormData {
  account_name: string;
  trade_name: string;
  license_type: string;
  license_number: string;
  expiration_date: string;
}

interface FieldErrors {
  [key: string]: string;
}

// Get vanity URL from cookie
const getVanityUrlFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const name = 'vanity_url=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
};

// Format phone number as (XXX) XXX-XXXX
const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = cleaned.slice(0, 10);
  
  // Apply formatting
  if (limited.length === 0) return '';
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

// Remove phone formatting for storage
const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

const initializeHoursOfOperation = (): HoursOfOperation => {
  const hours: HoursOfOperation = {};
  days.forEach((day) => {
    hours[day.toLowerCase()] = {
      isApplicable: true,
      schedule: 'Schedule',
      startHour: '8',
      startMinute: '00',
      startPeriod: 'am',
      endHour: '5',
      endMinute: '00',
      endPeriod: 'pm',
    };
  });
  return hours;
};

interface UserListPageProps {
  business: string;
}

export default function basicInformation({ business }: UserListPageProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'license'>('basic');
  const [businessId, setBusinessId] = useState<string | null>(null);

  const companyPhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const invoiceLogoRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CompanyData>({
    id: '',
    type_id: '',
    name: '',
    country: 'United States',
    state: '',
    city: '',
    zipCode: '',
    street: '',
    phone: '',
    mobile: '',
    fax: '',
    email: '',
    website: '',
    companyPhoto: '',
    coverPhoto: '',
    allowReviews: false,
    offersVeteranDiscounts: false,
    wheelchairAccessible: false,
    atmOnPremises: false,
    customersCanPlaceOrders: false,
    curbsideServiceProvided: false,
    deliveryServiceAvailable: false,
    acceptedPayment: 'cash',
    provides: '',
    hoursOfOperation: initializeHoursOfOperation(),
  });

  const [photoState, setPhotoState] = useState<PhotoUploadState>({
    companyPhoto: null,
    coverPhoto: null,
    invoiceLogo: null,
    companyPhotoPreview: null,
    coverPhotoPreview: null,
    invoiceLogoPreview: null,
    companyPhotoLoading: false,
    coverPhotoLoading: false,
    invoiceLogoLoading: false,
  });

  // License-related state
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [editingLicenseId, setEditingLicenseId] = useState<string | null>(null);
  const [submittingLicense, setSubmittingLicense] = useState(false);
  const [licenseFieldErrors, setLicenseFieldErrors] = useState<FieldErrors>({});
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseFileName, setLicenseFileName] = useState<string>('');
  const [licensesSearchTerm, setLicensesSearchTerm] = useState('');
  const [licenseFormData, setLicenseFormData] = useState<LicenseFormData>({
    account_name: '',
    trade_name: '',
    license_type: '',
    license_number: '',
    expiration_date: '',
  });

  useEffect(() => {
    setMounted(true);
    const vanityUrl = getVanityUrlFromCookie();
    if (vanityUrl) {
      setBusinessId(vanityUrl);
      fetchCompanyData(vanityUrl);
      fetchLicenses(vanityUrl);
    } else {
      setIsLoading(false);
      toast.error('Business ID not found in cookie');
    }
  }, []);

  const fetchCompanyData = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/business/settings/company?business=${id}`);
      if (response.data.success) {
        const data = response.data.data;
		console.log(data);
        setFormData({
          ...data,
          phone: formatPhoneNumber(data.phone || ''),
          mobile: formatPhoneNumber(data.mobile || ''),
          fax: formatPhoneNumber(data.fax || ''),
          hoursOfOperation: data.hoursOfOperation || initializeHoursOfOperation(),
        });
        if (data.companyPhoto) {
          setPhotoState((prev) => ({
            ...prev,
            companyPhotoPreview: data.companyPhoto,
          }));
        }
        if (data.coverPhoto) {
          setPhotoState((prev) => ({
            ...prev,
            coverPhotoPreview: data.coverPhoto,
          }));
        }
        if (data.invoiceLogo) {
          setPhotoState((prev) => ({
            ...prev,
            invoiceLogoPreview: data.invoiceLogo,
          }));
        }
      }
    } catch (error) {
      toast.error('Failed to load company data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let finalValue = value;
    
    // Apply phone formatting for phone fields
    if ((name === 'phone' || name === 'mobile' || name === 'fax') && type === 'text') {
      finalValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : finalValue,
    }));
  };

  const handleHoursChange = (
    day: string,
    field: string,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      hoursOfOperation: {
        ...prev.hoursOfOperation!,
        [day]: {
          ...prev.hoursOfOperation![day],
          [field]: value,
        },
      },
    }));
  };

  const handlePhotoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    photoType: 'company' | 'cover' | 'invoiceLogo'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (photoType === 'company') {
        setPhotoState((prev) => ({
          ...prev,
          companyPhoto: file,
          companyPhotoPreview: preview,
        }));
      } else if (photoType === 'cover') {
        setPhotoState((prev) => ({
          ...prev,
          coverPhoto: file,
          coverPhotoPreview: preview,
        }));
      } else if (photoType === 'invoiceLogo') {
        setPhotoState((prev) => ({
          ...prev,
          invoiceLogo: file,
          invoiceLogoPreview: preview,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (photoType: 'company' | 'cover' | 'invoiceLogo') => {
    let photoFile: File | null;
    if (photoType === 'company') {
      photoFile = photoState.companyPhoto;
    } else if (photoType === 'cover') {
      photoFile = photoState.coverPhoto;
    } else {
      photoFile = photoState.invoiceLogo;
    }

    if (!photoFile) {
      toast.error(`Please select a ${photoType} photo`);
      return;
    }

    try {
      let loadingKey: keyof PhotoUploadState;
      if (photoType === 'company') {
        loadingKey = 'companyPhotoLoading';
      } else if (photoType === 'cover') {
        loadingKey = 'coverPhotoLoading';
      } else {
        loadingKey = 'invoiceLogoLoading';
      }
      
      setPhotoState((prev) => ({
        ...prev,
        [loadingKey]: true,
      }));

      const formDataUpload = new FormData();
      formDataUpload.append('file', photoFile);
      formDataUpload.append('businessId', businessId || '');
      formDataUpload.append('photoType', photoType);

      const response = await axios.post('/api/business/settings/company/upload-photo', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        const photoField = photoType === 'company' ? 'companyPhoto' : photoType === 'cover' ? 'coverPhoto' : 'invoiceLogo';
        setFormData((prev) => ({
          ...prev,
          [photoField]: response.data.photoUrl,
        }));

        const fileField = photoType === 'company' ? 'companyPhoto' : photoType === 'cover' ? 'coverPhoto' : 'invoiceLogo';
        setPhotoState((prev) => ({
          ...prev,
          [fileField]: null,
        }));

        toast.success(`${photoType} photo uploaded successfully`);
      }
    } catch (error) {
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : `Failed to upload ${photoType} photo`;
      toast.error(errorMsg);
      console.error(error);
    } finally {
      let loadingKey: keyof PhotoUploadState;
      if (photoType === 'company') {
        loadingKey = 'companyPhotoLoading';
      } else if (photoType === 'cover') {
        loadingKey = 'coverPhotoLoading';
      } else {
        loadingKey = 'invoiceLogoLoading';
      }
      
      setPhotoState((prev) => ({
        ...prev,
        [loadingKey]: false,
      }));
    }
  };

  const removePhoto = (photoType: 'company' | 'cover' | 'invoiceLogo') => {
    if (photoType === 'company') {
      setPhotoState((prev) => ({
        ...prev,
        companyPhoto: null,
        companyPhotoPreview: null,
      }));
      if (companyPhotoRef.current) {
        companyPhotoRef.current.value = '';
      }
    } else if (photoType === 'cover') {
      setPhotoState((prev) => ({
        ...prev,
        coverPhoto: null,
        coverPhotoPreview: null,
      }));
      if (coverPhotoRef.current) {
        coverPhotoRef.current.value = '';
      }
    } else if (photoType === 'invoiceLogo') {
      setPhotoState((prev) => ({
        ...prev,
        invoiceLogo: null,
        invoiceLogoPreview: null,
      }));
      if (invoiceLogoRef.current) {
        invoiceLogoRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!businessId) {
      toast.error('Business ID not found');
      return;
    }

    try {
      setIsSaving(true);

      // Prepare data for API - unformat phone numbers
      const dataToSave = {
        ...formData,
        phone: unformatPhoneNumber(formData.phone),
        mobile: unformatPhoneNumber(formData.mobile),
        fax: unformatPhoneNumber(formData.fax),
      };
      const response = await axios.put(`/api/business/settings/company?business=${businessId}`, dataToSave, {
        timeout: 10000,
      });

      if (response.data.success) {
        toast.success('Company details updated successfully');
      }
    } catch (error) {
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to update company details';
      toast.error(errorMsg);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // License-related functions
  const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') {
      return null;
    }
    try {
      const nameEQ = name + '=';
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      return null;
    } catch (error) {
      console.error(`Error reading cookie '${name}':`, error);
      return null;
    }
  };

  const fetchLicenses = async (businessId: string) => {
    try {
      setLoadingLicenses(true);
      const userId = getCookieValue('user_id');
      
      if (!userId) {
        console.warn('No user_id found in cookies');
        return;
      }
      
      const response = await axios.get('/api/business/licenses', {
        params: {
          user_id: userId,
        },
      });
      
      setLicenses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      setLicenses([]);
    } finally {
      setLoadingLicenses(false);
    }
  };

  const handleLicenseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setLicenseFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    setLicenseFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setLicenseFieldErrors(prev => ({
          ...prev,
          license_file: 'Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX.'
        }));
        return;
      }
      setLicenseFile(file);
      setLicenseFileName(file.name);
      setLicenseFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.license_file;
        return newErrors;
      });
    }
  };

  const removeLicenseFile = () => {
    setLicenseFile(null);
    setLicenseFileName('');
  };

  const validateLicenseForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!licenseFormData.license_type) {
      errors.license_type = 'License Type is required';
    }
    if (!licenseFormData.account_name) {
      errors.account_name = 'Name is required';
    }
    if (!licenseFormData.license_number) {
      errors.license_number = 'License Number is required';
    }
    if (!licenseFormData.expiration_date) {
      errors.expiration_date = 'Expiration Date is required';
    }
    if (!licenseFile && !editingLicenseId) {
      errors.license_file = 'License Document is required';
    }

    setLicenseFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLicenseForm()) {
      return;
    }

    try {
      setSubmittingLicense(true);

      const userId = getCookieValue('user_id');
      
      if (!userId) {
        toast.error('User ID not found. Please login again.');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('user_id', userId);
      formDataToSend.append('account_name', licenseFormData.account_name);
      formDataToSend.append('trade_name', licenseFormData.trade_name);
      formDataToSend.append('license_type', licenseFormData.license_type);
      formDataToSend.append('license_number', licenseFormData.license_number);
      formDataToSend.append('expiration_date', licenseFormData.expiration_date);
      
      if (licenseFile) {
        formDataToSend.append('license_file', licenseFile);
      }

      if (editingLicenseId) {
        formDataToSend.append('id', editingLicenseId);
        const response = await axios.put('/api/business/licenses', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000,
        });

        if (response.data.success) {
          toast.success('License updated successfully');
          await fetchLicenses(businessId!);
          setShowLicenseModal(false);
          resetLicenseModal();
        }
      } else {
        const response = await axios.post('/api/business/licenses', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000,
        });

        if (response.data.success) {
          toast.success('License created successfully');
          await fetchLicenses(businessId!);
          setShowLicenseModal(false);
          resetLicenseModal();
        }
      }
    } catch (error) {
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to save license';
      toast.error(errorMsg);
      console.error(error);
    } finally {
      setSubmittingLicense(false);
    }
  };

  const deleteLicense = async (licenseId: string) => {
    if (!confirm('Are you sure you want to delete this license?')) {
      return;
    }

    try {
      const userId = getCookieValue('user_id');
      
      if (!userId) {
        toast.error('User ID not found. Please login again.');
        return;
      }

      const response = await axios.delete(`/api/business/licenses/${licenseId}`, {
        params: { user_id: userId },
        timeout: 10000,
      });

      if (response.data.success) {
        toast.success('License deleted successfully');
        await fetchLicenses(businessId!);
      }
    } catch (error) {
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to delete license';
      toast.error(errorMsg);
      console.error(error);
    }
  };

  const resetLicenseModal = () => {
    setLicenseFormData({
      account_name: '',
      trade_name: '',
      license_type: '',
      license_number: '',
      expiration_date: '',
    });
    setLicenseFile(null);
    setLicenseFileName('');
    setLicenseFieldErrors({});
    setEditingLicenseId(null);
  };

  const filteredLicenses = licenses.filter(license =>
   // license.account_name.toLowerCase().includes((licensesSearchTerm || '').toLowerCase()) ||
    license.license_number.toLowerCase().includes((licensesSearchTerm || '').toLowerCase()) ||
    license.license_type.toLowerCase().includes((licensesSearchTerm || '').toLowerCase())
  );

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-600 border-t-gray-400 dark:border-t-gray-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Company Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your business profile and details
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'basic', label: 'Basic Information' },
            { id: 'location', label: 'Location Information' },
            { id: 'license', label: 'License Information' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'basic' | 'location' | 'license')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                  placeholder="Enter company name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                    placeholder="company@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={14}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    maxLength={14}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fax
                  </label>
                  <input
                    type="text"
                    name="fax"
                    value={formData.fax}
                    onChange={handleInputChange}
                    maxLength={14}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select a state</option>
                  {Object.entries(states).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ZIP / Postal Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                    placeholder="ZIP code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street *
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                  placeholder="Street address"
                />
              </div>
            </div>
          )}

          {/* License Information Tab */}
          {activeTab === 'license' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Licenses
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage your business licenses and permits
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowLicenseModal(true);
                    setEditingLicenseId(null);
                    resetLicenseModal();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add License
                </button>
              </div>

              {/* License Search and Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search licenses..."
                  value={licensesSearchTerm}
                  onChange={(e) => setLicensesSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Licenses List */}
              {loadingLicenses ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-600 border-t-teal-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading licenses...</p>
                  </div>
                </div>
              ) : filteredLicenses.length === 0 ? (
                <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-700 dark:bg-opacity-50">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                    {licensesSearchTerm ? 'No licenses found' : 'No licenses yet'}
                  </p>
                  {!licensesSearchTerm && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Add your first license to get started
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLicenses.map((license) => (
                    <div
                      key={license.license_id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:bg-gray-750 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {license.account_name}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              license.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : license.status === 'expired'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {license.license_type} • License #: {license.license_number}
                          </p>
                          {license.trade_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Trade Name: {license.trade_name}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            Expires: {new Date(license.expiration_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {license.document_url && (
                            <a
                              href={license.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="View document"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                          {/*<button
                            onClick={() => {
                              setEditingLicenseId(license.license_id);
                              setLicenseFormData({
                                account_name: license.account_name,
                                trade_name: license.trade_name,
                                license_type: license.license_type,
                                license_number: license.license_number,
                                expiration_date: license.expiration_date,
                              });
                              setShowLicenseModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit license"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLicense(license.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Delete license"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>*/}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* License Modal */}
              {showLicenseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editingLicenseId ? 'Edit License' : 'Add License'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowLicenseModal(false);
                          resetLicenseModal();
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <form onSubmit={handleLicenseSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          License Type *
                        </label>
                        <select
                          name="license_type"
                          value={licenseFormData.license_type}
                          onChange={handleLicenseInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                            licenseFieldErrors.license_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        >
                          <option value="">Select License Type</option>
                          <option value="Dispensary">Dispensary</option>
                          <option value="Processor">Processor</option>
                          <option value="Grower">Grower</option>
                        </select>
                        {licenseFieldErrors.license_type && (
                          <p className="text-red-600 text-sm mt-1">⚠ {licenseFieldErrors.license_type}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          name="account_name"
                          value={licenseFormData.account_name}
                          onChange={handleLicenseInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                            licenseFieldErrors.account_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        />
                        {licenseFieldErrors.account_name && (
                          <p className="text-red-600 text-sm mt-1">⚠ {licenseFieldErrors.account_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Trade Name
                        </label>
                        <input
                          type="text"
                          name="trade_name"
                          value={licenseFormData.trade_name}
                          onChange={handleLicenseInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          License Number *
                        </label>
                        <input
                          type="text"
                          name="license_number"
                          value={licenseFormData.license_number}
                          onChange={handleLicenseInputChange}
                          placeholder="e.g., DISP-2024-001"
                          className={`uppercase w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                            licenseFieldErrors.license_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        />
                        {licenseFieldErrors.license_number && (
                          <p className="text-red-600 text-sm mt-1">⚠ {licenseFieldErrors.license_number}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Expiration Date *
                        </label>
                        <input
                          type="date"
                          name="expiration_date"
                          value={licenseFormData.expiration_date}
                          onChange={handleLicenseInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                            licenseFieldErrors.expiration_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        />
                        {licenseFieldErrors.expiration_date && (
                          <p className="text-red-600 text-sm mt-1">⚠ {licenseFieldErrors.expiration_date}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          License Document {!editingLicenseId && '*'}
                        </label>
                        {!licenseFile ? (
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-teal-500 transition-colors cursor-pointer hover:bg-teal-50 dark:hover:bg-gray-700">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={handleLicenseFileChange}
                              className="hidden"
                              id="license-file-input"
                            />
                            <label htmlFor="license-file-input" className="cursor-pointer block">
                              <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                              <p className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                                Click to upload
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                PDF, JPG, PNG, DOC, or DOCX
                              </p>
                            </label>
                          </div>
                        ) : (
                          <div className="rounded-lg p-3 flex items-center justify-between bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                                {licenseFileName}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={removeLicenseFile}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {licenseFieldErrors.license_file && (
                          <p className="text-red-600 text-sm mt-1">⚠ {licenseFieldErrors.license_file}</p>
                        )}
                      </div>
                    </form>

                    {/* Modal Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLicenseModal(false);
                          resetLicenseModal();
                        }}
                        className="px-6 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLicenseSubmit}
                        disabled={submittingLicense}
                        className="px-8 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium transition-colors flex items-center gap-2"
                      >
                        {submittingLicense && <Loader2 className="w-4 h-4 animate-spin" />}
                        {submittingLicense ? (editingLicenseId ? 'Updating...' : 'Creating...') : (editingLicenseId ? 'Update' : 'Create')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Save/Cancel Buttons */}
          <div className="mt-8 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              onClick={() => businessId && fetchCompanyData(businessId)}
              disabled={isSaving}
              className="px-6 py-2 rounded-lg font-medium bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-400 text-gray-900 dark:text-white transition-colors duration-200"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2 accent-bg text-white rounded-lg accent-hover disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}