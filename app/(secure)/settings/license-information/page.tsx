'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, X, Upload, FileText, AlertCircle, Eye, EyeOff, Loader2, Search
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '@/hooks/useTheme';

interface License {
  id: string;
  license_id: string;
  account_name: string;
  license_type: string;
  license_number: string;
  expiration_date: string;
  document_url?: string;
  created_at: string;
  status: 'active' | 'expired' | 'pending';
}

interface LicenseFormData {
  account_name: string;
  license_type: string;
  license_number: string;
  expiration_date: string;
}

interface FieldErrors {
  [key: string]: string;
}

const licenseTypes = ['Dispensary', 'Processor', 'Grower'];

/**
 * Helper function to get cookie value by name
 * Reads directly from document.cookie
 */
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

export default function LicenseInformationPage() {
  const { isDark } = useTheme();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseFileName, setLicenseFileName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<LicenseFormData>({
    account_name: '',
    license_type: '',
    license_number: '',
    expiration_date: '',
  });

  // Fetch licenses on component mount
  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      
      // Get user_id from cookie
      const userId = getCookieValue('user_id');
      
      if (!userId) {
        console.warn('No user_id found in cookies');
        toast.error('User ID not found. Please login again.');
        return;
      }
      
      // Pass user_id in request header
      const response = await axios.get('/api/business/licenses', {
        params: {
		user_id: userId,
	  },
      });
      
      setLicenses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast.error('Failed to load licenses');
      // Fallback sample data for development
      setLicenses([
        {
          id: '1',
          license_id: '1',
          account_name: 'Dispensary',
          license_type: 'Dispensary',
          license_number: 'DISP-2023-001',
          expiration_date: '2025-12-31',
          created_at: '2023-01-15',
          status: 'active',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setFieldErrors(prev => ({
          ...prev,
          license_file: 'Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX.'
        }));
        return;
      }
      setLicenseFile(file);
      setLicenseFileName(file.name);
      setFieldErrors(prev => {
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

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.license_type) {
      errors.license_type = 'License Type is required';
    }
	
	if (!formData.account_name) {
      errors.account_name = 'Name is required';
    }
    if (!formData.license_number) {
      errors.license_number = 'License Number is required';
    }
    if (!formData.expiration_date) {
      errors.expiration_date = 'Expiration Date is required';
    }
    if (!licenseFile && !editingId) {
      errors.license_file = 'License Document is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Get user_id from cookie
      const userId = getCookieValue('user_id');
      
      if (!userId) {
        toast.error('User ID not found. Please login again.');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('user_id', userId);
      formDataToSend.append('account_name', formData.account_name);
      formDataToSend.append('license_type', formData.license_type);
      formDataToSend.append('license_number', formData.license_number.toUpperCase());
      formDataToSend.append('expiration_date', formData.expiration_date);

      if (licenseFile) {
        formDataToSend.append('license_document', licenseFile);
      }

      let response;
      if (editingId) {
        response = await axios.put(
          `/api/business/licenses/${editingId}`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'X-User-ID': userId,
            },
          }
        );
        toast.success('License updated successfully!');
      } else {
        response = await axios.post('/api/business/licenses', formDataToSend);
        toast.success('License created successfully!');
      }

      // Refresh licenses list
      await fetchLicenses();
      resetModal();
    } catch (error: any) {
      console.error('Error saving license:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save license';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (license: License) => {
    setEditingId(license.id);
    setFormData({
      account_name: license.account_name,
      license_type: license.license_type,
      license_number: license.license_number,
      expiration_date: license.expiration_date,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license?')) {
      return;
    }

    try {
      // Get user_id from cookie
      const userId = getCookieValue('user_id');
      
      if (!userId) {
        toast.error('User ID not found. Please login again.');
        return;
      }

      await axios.delete(`/api/business/licenses/${id}`, {
        headers: {
          'X-User-ID': userId,
        },
      });
      
      toast.success('License deleted successfully!');
      await fetchLicenses();
    } catch (error: any) {
      console.error('Error deleting license:', error);
      toast.error('Failed to delete license');
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      account_name: '',
      license_type: '',
      license_number: '',
      expiration_date: '',
    });
    setLicenseFile(null);
    setLicenseFileName('');
    setFieldErrors({});
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const filteredLicenses = licenses.filter(license =>
    license.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.license_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExpirationStatus = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysLeft < 0) return { status: 'expired', days: Math.abs(daysLeft) };
    if (daysLeft < 30) return { status: 'expiring_soon', days: daysLeft };
    return { status: 'active', days: daysLeft };
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-7xl mx-auto px-4 py-8 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">License Information</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage and track your business licenses
            </p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ account_name: '', license_type: '', license_number: '', expiration_date: '' });
              setLicenseFile(null);
              setLicenseFileName('');
              setFieldErrors({});
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create New License
          </button>
        </div>

        {/* Search Bar */}
        <div className={`mb-6 relative ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
          <Search className={`absolute left-4 top-3 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search licenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDark 
                ? 'bg-gray-800 text-gray-100 border border-gray-700' 
                : 'bg-white text-gray-900 border border-gray-300'
            }`}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : filteredLicenses.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className="text-xl font-medium mb-2">No Licenses Found</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm ? 'No licenses match your search' : 'You haven\'t added any licenses yet. Create one to get started.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create First License
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredLicenses.map((license) => {
              const { status: expStatus } = getExpirationStatus(license.expiration_date);
              return (
                <div
                  key={license.license_id}
                  className={`rounded-lg shadow overflow-hidden transition-shadow hover:shadow-lg ${
                    isDark ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold">{license.license_number}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLicenseStatusColor(license.status)}`}>
                            {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                          </span>
                          {expStatus !== 'active' && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {expStatus === 'expired' ? 'Expired' : 'Expiring Soon'}
                            </span>
                          )}
                        </div>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Type: <span className="font-medium">{license.license_type}</span>
                        </p>
                      </div>
                      {/*<div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(license)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-blue-400'
                              : 'hover:bg-blue-100 text-blue-600'
                          }`}
                          title="Edit license"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(license.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                              : 'hover:bg-red-100 text-red-600'
                          }`}
                          title="Delete license"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>*/}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Expiration Date</p>
                        <p className="text-lg font-medium mt-1">{new Date(license.expiration_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Created On</p>
                        <p className="text-lg font-medium mt-1">{new Date(license.created_at).toLocaleDateString()}</p>
                      </div>
                      {license.document_url && (
                        <div>
                          <a
                            href={license.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-2xl font-bold">
                {editingId ? 'Edit License' : 'Create New License'}
              </h2>
              <button
                onClick={resetModal}
                className={`p-1 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  License Type *
                </label>
                <select
                  name="license_type"
                  value={formData.license_type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.license_type
                      ? 'border-red-500 focus:ring-red-500'
                      : 'focus:ring-teal-500'
                  } ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select License Type</option>
                  {licenseTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {fieldErrors.license_type && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.license_type}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Name *
                </label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  placeholder=""
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.account_name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'focus:ring-teal-500'
                  } ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                {fieldErrors.account_name && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.account_name}</p>
                )}
              </div>
			  
			  <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  License Number *
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  placeholder="e.g., DISP-2024-001"
                  className={`uppercase w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.license_number
                      ? 'border-red-500 focus:ring-red-500'
                      : 'focus:ring-teal-500'
                  } ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                {fieldErrors.license_number && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.license_number}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Expiration Date *
                </label>
                <input
                  type="date"
                  name="expiration_date"
                  value={formData.expiration_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.expiration_date
                      ? 'border-red-500 focus:ring-red-500'
                      : 'focus:ring-teal-500'
                  } ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                {fieldErrors.expiration_date && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.expiration_date}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  License Document {!editingId && '*'}
                </label>
                {!licenseFile ? (
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-teal-500 transition-colors cursor-pointer ${
                    isDark
                      ? 'border-gray-600 hover:bg-gray-700'
                      : 'border-gray-300 hover:bg-teal-50'
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleLicenseFileChange}
                      className="hidden"
                      id="license-file-input"
                    />
                    <label htmlFor="license-file-input" className="cursor-pointer block">
                      <Upload className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Click to upload or drag and drop
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        PDF, JPG, PNG, DOC, or DOCX
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className={`rounded-lg p-4 flex items-center justify-between ${
                    isDark
                      ? 'bg-green-900 border border-green-700'
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <FileText className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${isDark ? 'text-green-200' : 'text-green-900'}`}>
                          {licenseFileName}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                          File uploaded successfully
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeLicenseFile}
                      className={`${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {fieldErrors.license_file && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.license_file}</p>
                )}
              </div>
            </form>

            {/* Modal Footer */}
            <div className={`flex justify-end gap-3 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={resetModal}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium transition-colors flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}