'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Loader2, AlertCircle, Search, Clock, CheckCircle, XCircle, Eye, Trash2, ChevronRight, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface UserData {
  user_group_id: number | string;
  [key: string]: any;
}

interface RegistrationItem {
  id: string | number;
  business_id: string | number;
  user_id: string | number;
  contact_name: string;
  business_name: string;
  business_type: string;
  company_name: string;
  license_type: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
}

const ADMIN_GROUP_IDS = ['1', '2', 'admin'];

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<RegistrationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [deleting, setDeleting] = useState<string | number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Check admin authorization
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

  // Initialize and fetch data
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setLoading(true);
        const userGroupId = getUserGroupIdFromLocalStorage();

        // Check if user is admin
        if (!userGroupId || !ADMIN_GROUP_IDS.includes(userGroupId)) {
          setIsAuthorized(false);
          toast.error('Unauthorized: Admin access required', {
            position: 'bottom-center',
            autoClose: 3000,
          });
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        setIsAuthorized(true);
        await fetchRegistrations();
      } catch (error) {
        console.error('Error initializing page:', error);
        toast.error('Failed to load page', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router, getUserGroupIdFromLocalStorage]);

  // Fetch registrations from our Next.js API route
  const fetchRegistrations = async () => {
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        page: '1',
        limit: '20',
      });

      const response = await fetch(`/api/admin/registrations?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }

      const data = await response.json();

      if (data.status === 'success' && Array.isArray(data.data.users)) {
        setRegistrations(data.data.users);
        setFilteredRegistrations(data.data.users);
      } else {
        toast.error(data.error?.message || 'Failed to load registrations', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to fetch registrations', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    }
  };

  // Handle search and filter
  useEffect(() => {
    let filtered = registrations;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reg => reg.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.contact_name?.toLowerCase().includes(term) ||
        reg.company_name?.toLowerCase().includes(term) ||
        reg.email?.toLowerCase().includes(term) ||
        reg.license_type?.toLowerCase().includes(term)
      );
    }

    setFilteredRegistrations(filtered);
  }, [searchTerm, statusFilter, registrations]);

  // Show delete confirmation modal
  const showDeleteConfirmation = (registrationId: string | number, companyName: string) => {
    setDeleteTargetId(registrationId);
    setDeleteTargetName(companyName);
    setShowDeleteModal(true);
  };

  // Confirm and execute delete
  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleting(deleteTargetId);

      // Find the registration being deleted to track its status
      const deletedRegistration = registrations.find(reg => reg.id === deleteTargetId || reg.user_id === deleteTargetId);

      const response = await fetch('/api/admin/registrations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Confirm-Delete': 'true',
        },
        body: JSON.stringify({ registration_id: deleteTargetId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete registration');
      }

      const data = await response.json();

      if (data.status === 'success') {
        // Remove from registrations (this will auto-update filteredRegistrations via useEffect)
        setRegistrations(prev => prev.filter(reg => reg.id !== deleteTargetId && reg.user_id !== deleteTargetId));
        
        // Show success message with count update info
        toast.success('Registration deleted successfully', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      } else {
        toast.error(data.error?.message || 'Failed to delete registration', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Error deleting registration', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setDeleting(null);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      setDeleteTargetName('');
    }
  };

  const handleDelete = async (registrationId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this registration? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(registrationId);

      const response = await fetch('/api/admin/registrations/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Confirm-Delete': 'true',
        },
        body: JSON.stringify({ registration_id: registrationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete registration');
      }

      const data = await response.json();

      if (data.status === 'success') {
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
        toast.success('Registration deleted successfully', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      } else {
        toast.error(data.error?.message || 'Failed to delete registration', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Error deleting registration', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setDeleting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Business Registrations</h1>
          <p className="text-gray-600">Review, approve, or reject pending business registrations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-800">{registrations.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {registrations.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {registrations.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {registrations.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, company, email, or license type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No registrations found</h3>
              <p className="text-gray-600">
                {registrations.length === 0 
                  ? 'There are no registrations to review.'
                  : 'No registrations match your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">License Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-800">{registration.contact_name || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{registration.business_name || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{registration.business_type || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600 break-all">{registration.email || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(registration.status)}
                          
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">
                          {new Date(registration.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/registrations/${registration.id}`)}
                            className="p-2 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-teal-600" />
                          </button>
                          <button
                            onClick={() => showDeleteConfirmation(registration.user_id, registration.company_name)}
                            disabled={deleting === registration.user_id}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === registration.user_id ? (
                              <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-600" />
                            )}
                          </button>
                          <button
                            onClick={() => router.push(`/admin/registrations/${registration.id}`)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More details"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Showing {filteredRegistrations.length} of {registrations.length} registrations</p>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Delete Registration</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTargetId(null);
                    setDeleteTargetName('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this registration for{' '}
                  <span className="font-semibold text-gray-900">{deleteTargetName}</span>?
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-red-700">⚠️ Warning</p>
                  <p className="text-xs text-red-700">
                    This action cannot be undone. All registration data will be permanently deleted.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTargetId(null);
                    setDeleteTargetName('');
                  }}
                  disabled={deleting === deleteTargetId}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting === deleteTargetId}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {deleting === deleteTargetId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}