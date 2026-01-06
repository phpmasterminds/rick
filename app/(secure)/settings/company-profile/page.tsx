'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Camera, Upload, X } from 'lucide-react';
import Image from 'next/image';

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
  companyPhotoPreview: string | null;
  coverPhotoPreview: string | null;
  companyPhotoLoading: boolean;
  coverPhotoLoading: boolean;
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

const CompanyEditPage = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'services' | 'photos'>('basic');
  const [businessId, setBusinessId] = useState<string | null>(null);

  const companyPhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CompanyData>({
    id: '',
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
    companyPhotoPreview: null,
    coverPhotoPreview: null,
    companyPhotoLoading: false,
    coverPhotoLoading: false,
  });

  useEffect(() => {
    setMounted(true);
    const vanityUrl = getVanityUrlFromCookie();
    if (vanityUrl) {
      setBusinessId(vanityUrl);
      fetchCompanyData(vanityUrl);
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
    photoType: 'company' | 'cover'
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
      } else {
        setPhotoState((prev) => ({
          ...prev,
          coverPhoto: file,
          coverPhotoPreview: preview,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (photoType: 'company' | 'cover') => {
    const photoFile = photoType === 'company' ? photoState.companyPhoto : photoState.coverPhoto;

    if (!photoFile) {
      toast.error(`Please select a ${photoType} photo`);
      return;
    }

    try {
      const loadingKey = photoType === 'company' ? 'companyPhotoLoading' : 'coverPhotoLoading';
      setPhotoState((prev) => ({
        ...prev,
        [loadingKey]: true,
      }));

      const formDataUpload = new FormData();
      formDataUpload.append('file', photoFile);
      formDataUpload.append('businessId', businessId || '');
      formDataUpload.append('photoType', photoType);

      const response = await axios.post('/api/company/upload-photo', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        setFormData((prev) => ({
          ...prev,
          [photoType === 'company' ? 'companyPhoto' : 'coverPhoto']: response.data.photoUrl,
        }));

        setPhotoState((prev) => ({
          ...prev,
          [photoType === 'company' ? 'companyPhoto' : 'coverPhoto']: null,
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
      setPhotoState((prev) => ({
        ...prev,
        [photoType === 'company' ? 'companyPhotoLoading' : 'coverPhotoLoading']: false,
      }));
    }
  };

  const removePhoto = (photoType: 'company' | 'cover') => {
    if (photoType === 'company') {
      setPhotoState((prev) => ({
        ...prev,
        companyPhoto: null,
        companyPhotoPreview: null,
      }));
      if (companyPhotoRef.current) {
        companyPhotoRef.current.value = '';
      }
    } else {
      setPhotoState((prev) => ({
        ...prev,
        coverPhoto: null,
        coverPhotoPreview: null,
      }));
      if (coverPhotoRef.current) {
        coverPhotoRef.current.value = '';
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
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          {['basic', 'location', 'services', 'photos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'accent-bg text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 bg-transparent'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-8">
              {/* Payment Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Accepted Payment:
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="acceptedPayment"
                      value="cash"
                      checked={formData.acceptedPayment === 'cash'}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Accept Cash Only</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="acceptedPayment"
                      value="cash-and-cards"
                      checked={formData.acceptedPayment === 'cash-and-cards'}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Accept Cash & Cards</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="acceptedPayment"
                      value="aeropay"
                      checked={formData.acceptedPayment === 'aeropay'}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Accept Aeropay</span>
                  </label>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Hours of Operation Section */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Hours Of Operation:</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Hours Of Operation are not applicable
                    </span>
                  </label>
                </div>

                <div className="space-y-3">
                  {days.map((day) => {
                    const dayKey = day.toLowerCase();
                    const dayData = formData.hoursOfOperation?.[dayKey];

                    return (
                      <div key={day} className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{day}:</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={dayData?.schedule || 'Schedule'}
                            onChange={(e) => handleHoursChange(dayKey, 'schedule', e.target.value)}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                          >
                            <option>Schedule</option>
                            <option>Closed</option>
                            <option>24 Hours</option>
                          </select>

                          {dayData?.schedule === 'Schedule' && (
                            <>
                              <select
                                value={dayData?.startHour || '8'}
                                onChange={(e) => handleHoursChange(dayKey, 'startHour', e.target.value)}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent"
                              >
                                {hours.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={dayData?.startMinute || '00'}
                                onChange={(e) => handleHoursChange(dayKey, 'startMinute', e.target.value)}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent"
                              >
                                {minutes.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={dayData?.startPeriod || 'am'}
                                onChange={(e) => handleHoursChange(dayKey, 'startPeriod', e.target.value)}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent"
                              >
                                <option value="am">am</option>
                                <option value="pm">pm</option>
                              </select>

                              <span className="text-sm text-gray-600 dark:text-gray-400">To</span>

                              <select
                                value={dayData?.endHour || '5'}
                                onChange={(e) => handleHoursChange(dayKey, 'endHour', e.target.value)}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent"
                              >
                                {hours.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={dayData?.endMinute || '00'}
                                onChange={(e) => handleHoursChange(dayKey, 'endMinute', e.target.value)}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent"
                              >
                                {minutes.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={dayData?.endPeriod || 'pm'}
                                onChange={(e) => handleHoursChange(dayKey, 'endPeriod', e.target.value)}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent"
                              >
                                <option value="am">am</option>
                                <option value="pm">pm</option>
                              </select>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Amenities Section */}
              <div className="space-y-3">
                {[
                  { key: 'allowReviews', label: 'Allow Reviews' },
                  { key: 'offersVeteranDiscounts', label: 'Offers Veteran Discounts' },
                  { key: 'wheelchairAccessible', label: 'Wheelchair Accessible' },
                  { key: 'atmOnPremises', label: 'ATM On Premises' },
                  { key: 'customersCanPlaceOrders', label: 'Customers Can Place Orders' },
                  { key: 'curbsideServiceProvided', label: 'Curbside Service Provided' },
                  { key: 'deliveryServiceAvailable', label: 'Delivery Service Available' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name={key}
                      checked={formData[key as keyof CompanyData] as boolean}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded accent-bg cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Provides:
                </label>
                <select
                  name="provides"
                  value={formData.provides}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select</option>
                  <option value="recreational">Recreational</option>
                  <option value="medical">Medical</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-8">
              {/* Cover Photo */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-700 dark:bg-opacity-50">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cover Photo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Recommended size: 1200x400px (5MB max)
                  </p>
                </div>

                {photoState.coverPhotoPreview ? (
                  <div className="relative mb-4">
                    <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600">
                      <Image
                        src={photoState.coverPhotoPreview}
                        alt="Cover Photo Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removePhoto('cover')}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    onClick={() => coverPhotoRef.current?.click()}
                    disabled={photoState.coverPhotoLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg accent-hover disabled:opacity-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Photo
                  </button>

                  {photoState.coverPhoto && (
                    <button
                      onClick={() => uploadPhoto('cover')}
                      disabled={photoState.coverPhotoLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg accent-hover disabled:opacity-50 transition-colors"
                    >
                      {photoState.coverPhotoLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </button>
                  )}
                </div>

                <input
                  ref={coverPhotoRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoSelect(e, 'cover')}
                  className="hidden"
                />
              </div>

              {/* Company Photo */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-700 dark:bg-opacity-50">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Company Photo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Recommended size: 500x500px (5MB max)
                  </p>
                </div>

                {photoState.companyPhotoPreview ? (
                  <div className="relative mb-4">
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 mx-auto">
                      <Image
                        src={photoState.companyPhotoPreview}
                        alt="Company Photo Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removePhoto('company')}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    onClick={() => companyPhotoRef.current?.click()}
                    disabled={photoState.companyPhotoLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg accent-hover disabled:opacity-50 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Choose Photo
                  </button>

                  {photoState.companyPhoto && (
                    <button
                      onClick={() => uploadPhoto('company')}
                      disabled={photoState.companyPhotoLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg accent-hover disabled:opacity-50 transition-colors"
                    >
                      {photoState.companyPhotoLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </button>
                  )}
                </div>

                <input
                  ref={companyPhotoRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoSelect(e, 'company')}
                  className="hidden"
                />
              </div>
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
};

export default CompanyEditPage;