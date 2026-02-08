'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Camera, Upload, X } from 'lucide-react';
import Image from 'next/image';

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

interface CompanyData {
  id: string;
  companyPhoto?: string;
  coverPhoto?: string;
  invoiceLogo?: string;
}

const Photos = () => {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const companyPhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const invoiceLogoRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CompanyData>({
    id: '',
    companyPhoto: '',
    coverPhoto: '',
    invoiceLogo: '',
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
          id: data.id,
          companyPhoto: data.companyPhoto || '',
          coverPhoto: data.coverPhoto || '',
          invoiceLogo: data.invoiceLogo || '',
        });

        if (data.companyPhoto) {
          setPhotoState(prev => ({ ...prev, companyPhotoPreview: data.companyPhoto }));
        }
        if (data.coverPhoto) {
          setPhotoState(prev => ({ ...prev, coverPhotoPreview: data.coverPhoto }));
        }
        if (data.invoiceLogo) {
          setPhotoState(prev => ({ ...prev, invoiceLogoPreview: data.invoiceLogo }));
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, photoType: 'company' | 'cover' | 'invoiceLogo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      if (photoType === 'company') {
        setPhotoState(prev => ({
          ...prev,
          companyPhoto: file,
          companyPhotoPreview: preview
        }));
      } else if (photoType === 'cover') {
        setPhotoState(prev => ({
          ...prev,
          coverPhoto: file,
          coverPhotoPreview: preview
        }));
      } else if (photoType === 'invoiceLogo') {
        setPhotoState(prev => ({
          ...prev,
          invoiceLogo: file,
          invoiceLogoPreview: preview
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
      setPhotoState(prev => ({
        ...prev,
        companyPhoto: null,
        companyPhotoPreview: null
      }));
    } else if (photoType === 'cover') {
      setPhotoState(prev => ({
        ...prev,
        coverPhoto: null,
        coverPhotoPreview: null
      }));
    } else if (photoType === 'invoiceLogo') {
      setPhotoState(prev => ({
        ...prev,
        invoiceLogo: null,
        invoiceLogoPreview: null
      }));
    }
  };

  const handleSave = async () => {
    if (!businessId) return;

    try {
      setIsSaving(true);
      const response = await axios.put(
        `/api/business/settings/company?business=${businessId}`,
        formData
      );

      if (response.data.success) {
        toast.success('Photos updated successfully');
        if (businessId) {
          await fetchCompanyData(businessId);
        }
      }
    } catch (error) {
      console.error('Error saving photos:', error);
      toast.error('Failed to save photos');
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Photos
          </h1>
          <p className={`text-lg transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Manage your business photos and logos
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className={`rounded-lg border shadow-sm transition-colors duration-200 p-8 ${
            isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-center py-12">
              <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p>Loading photos...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Photos Container */}
            <div className={`rounded-lg border shadow-sm transition-colors duration-200 p-8 ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-8">
                {/* Cover Photo */}
                <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isDark
                    ? 'border-gray-600 bg-gray-700/50'
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold mb-2 transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Cover Photo
                    </h3>
                    <p className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Recommended size: 1920x1080px (5MB max)
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

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => coverPhotoRef.current?.click()}
                      disabled={photoState.coverPhotoLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Photo
                    </button>

                    {photoState.coverPhoto && (
                      <button
                        onClick={() => uploadPhoto('cover')}
                        disabled={photoState.coverPhotoLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
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
                <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isDark
                    ? 'border-gray-600 bg-gray-700/50'
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold mb-2 transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Company Photo
                    </h3>
                    <p className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
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

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => companyPhotoRef.current?.click()}
                      disabled={photoState.companyPhotoLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Choose Photo
                    </button>

                    {photoState.companyPhoto && (
                      <button
                        onClick={() => uploadPhoto('company')}
                        disabled={photoState.companyPhotoLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
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

                {/* Invoice Logo */}
                <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isDark
                    ? 'border-gray-600 bg-gray-700/50'
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold mb-2 transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Invoice Logo
                    </h3>
                    <p className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Recommended size: 300x300px (5MB max)
                    </p>
                  </div>

                  {photoState.invoiceLogoPreview ? (
                    <div className="relative mb-4">
                      <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 mx-auto">
                        <Image
                          src={photoState.invoiceLogoPreview}
                          alt="Invoice Logo Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removePhoto('invoiceLogo')}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => invoiceLogoRef.current?.click()}
                      disabled={photoState.invoiceLogoLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Logo
                    </button>

                    {photoState.invoiceLogo && (
                      <button
                        onClick={() => uploadPhoto('invoiceLogo')}
                        disabled={photoState.invoiceLogoLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 accent-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                      >
                        {photoState.invoiceLogoLoading ? (
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
                    ref={invoiceLogoRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(e, 'invoiceLogo')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div className={`mt-8 flex gap-3 justify-end border-t transition-colors duration-200 pt-6 ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => businessId && fetchCompanyData(businessId)}
                disabled={isSaving}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                }`}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2 accent-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Photos;