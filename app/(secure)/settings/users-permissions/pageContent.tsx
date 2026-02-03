'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronDown, Trash2, Plus, AlertCircle, Edit2, Search, Filter, X,
  Mail, Loader2, Shield, Save, ArrowLeft, Phone, ChevronLeft, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

// ==================== TYPES ====================
interface User {
  id: string;
  user_id?: string;
  page_id?: string;
  business_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  position: string;
  phone: string;
  account_type: 'admin' | 'staff' | 'point_of_contact';
  permissions: string[];
  last_login: string | null;
  is_point_of_contact: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UserFormData {
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  position: string;
  phone: string;
  account_type: 'admin' | 'staff' | 'point_of_contact' | '';
  permissions: string[];
  is_point_of_contact: boolean;
}

interface UserListPageProps {
  business: string;
}

interface UserRequestBody {
  email: string;
  first_name: string;
  last_name: string;
  position: string;
  phone: string;
  is_point_contact: boolean;
  account_type: string;
  business: string;
  employee_id?: string;
  user_id?: string;
  page_id?: string;
  business_id?: string;
  [key: string]: any; // Allow permission fields
}

// ==================== PERMISSION OPTIONS ====================
const PERMISSION_OPTIONS = [
  'Can Access Dashboard',
  'Can Access Messages',
  'Can Access Customers',
  'Can Access Orders Section',
  'Can Manage Business Pages',
  'Can Access Production Packaging',
  'Can Access Inventory',
  'Can Access METRC',
  'Can Access Reports',
  'Can Access Settings',
  
 /* 
 'Can Access Marketplace Orders',
	'Can Access CRM',
'Is Sales Person',
  'Is Registered Cashier',
  'Can View Products',
  'Can Manually Add Products',
  'Can Import Products from METRC',
  'Can View Packages',
  'Can Create New Packages',
  'Can View Dashboard',
  'Can View Customers',
  'Can Add/Edit Customers',
  'Can View Marketplace Catalog',
  'Can Access Reports',*/
];

const ACCOUNT_TYPES = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

// ==================== PHONE VALIDATION & FORMATTING ====================
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Format as (xxx) xxx-xxxx
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

// ==================== MAIN COMPONENT ====================
export default function UsersPage({ business }: UserListPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  const [deleteConfirmUserName, setDeleteConfirmUserName] = useState<string>('');
  
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    position: '',
    phone: '',
    account_type: '',
    permissions: [],
    is_point_of_contact: false,
  });

  // ==================== AUTO-SELECT ALL PERMISSIONS FOR ADMIN ====================
  const getAdminPermissions = (): string[] => {
    return PERMISSION_OPTIONS.filter(perm => perm !== ''); // Return all non-empty permissions
  };

  const [filters, setFilters] = useState({
    accountType: '',
    lastLoginFrom: '',
    lastLoginTo: '',
  });

  // ==================== FETCH USERS WITH PAGINATION ====================
  const fetchUsers = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/business/settings/users-permissions?page=${page}&limit=${itemsPerPage}&business=${business}`
      );

      if (response.data.status === 'success') {
        const rows = response.data.data?.rows || [];

        const mappedUsers: User[] = rows.map((row: any) => ({
          id: row.employee_id?.toString() || row.user_id?.toString() || '',
          user_id: row.user_id || '',
          page_id: row.page_id || '',
          business_id: row.page_id || '',
          email: row.email || '',
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          position: row.job_title || '-',
          phone: row.office_phone || row.mobile || '',
          account_type: row.account_type,
          permissions: [
		  
            row.can_manage_business_pages === '1' && 'Can Manage Business Pages',
            row.can_access_dashboard === '1' && 'Can Access Dashboard',
            row.can_access_messages === '1' && 'Can Access Messages',
            row.can_access_customers === '1' && 'Can Access Customers',
            row.can_access_order_section === '1' && 'Can Access Orders Section',
            row.can_access_inventory === '1' && 'Can Access Inventory',
            row.can_access_metrc === '1' && 'Can Access METRC',
            row.can_access_reports === '1' && 'Can Access Reports',
            row.can_access_crm === '1' && 'Can Access CRM',
            row.can_access_settings_page === '1' && 'Can Access Settings',
            row.can_access_marketplace_orders === '1' && 'Can Access Marketplace Orders',
            row.can_access_production_packaging === '1' && 'Can Access Production Packaging',
            /*row.is_sales_person === '1' && 'Is Sales Person',
            row.is_reg_cashier === '1' && 'Is Registered Cashier',
            row.can_view_products === '1' && 'Can View Products',
            row.can_manually_add_products === '1' && 'Can Manually Add Products',
            row.can_import_products_metrc === '1' && 'Can Import Products from METRC',
            row.can_view_packages === '1' && 'Can View Packages',
            row.can_new_packages === '1' && 'Can Create New Packages',
            row.view_dashboard === '1' && 'Can View Dashboard',
            row.view_customer === '1' && 'Can View Customers',
            row.add_edit_customer === '1' && 'Can Add/Edit Customers',
            row.view_marketplace_catalog === '1' && 'Can View Marketplace Catalog',
            row.reporting === '1' && 'Can Access Reports',*/
          ].filter(Boolean) as string[],
          last_login: null,
          is_point_of_contact: row.is_point_contact === '1',
          created_at: new Date(parseInt(row.time_stamp) * 1000).toISOString(),
        }));

        setUsers(mappedUsers);
        setCurrentPage(page);

        if (response.data.data?.total) {
          setTotalPages(Math.ceil(response.data.data.total / itemsPerPage));
        }

        if (mappedUsers.length === 0 && page === 1) {
          toast.info('No Users found. Start by adding your first user!');
        }
      } else {
        toast.error(response.data.message || 'Failed to load users');
        setUsers([]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to load users';
      toast.error(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [business, itemsPerPage]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  // ==================== ADD/EDIT USER ====================
  const handleSaveUser = async () => {
    try {
      // Validation
      if (!formData.email || !formData.first_name || !formData.last_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!formData.account_type) {
        toast.error('Please select an account type');
        return;
      }

      if (formData.phone && !validatePhoneNumber(formData.phone)) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }

      // API endpoint and method
      const endpoint = editingUser
        ? `/api/business/settings/users-permissions`
        : `/api/business/settings/users-permissions`;
      const method = editingUser ? 'put' : 'post';

      // Convert permission names back to API field format
	  
			
      const permissionData = {
        can_manage_business_pages: formData.permissions.includes('Can Manage Business Pages') ? '1' : '0',
        can_access_dashboard: formData.permissions.includes('Can Access Dashboard') ? '1' : '0',
        can_access_messages: formData.permissions.includes('Can Access Messages') ? '1' : '0',
        can_access_customers: formData.permissions.includes('Can Access Customers') ? '1' : '0',
        can_access_order_section: formData.permissions.includes('Can Access Orders Section') ? '1' : '0',
        can_access_inventory: formData.permissions.includes('Can Access Inventory') ? '1' : '0',
        can_access_metrc: formData.permissions.includes('Can Access METRC') ? '1' : '0',
        can_access_reports: formData.permissions.includes('Can Access Reports') ? '1' : '0',
        can_access_crm: formData.permissions.includes('Can Access CRM') ? '1' : '0',
        can_access_settings_page: formData.permissions.includes('Can Access Settings') ? '1' : '0',
        can_access_marketplace_orders: formData.permissions.includes('Can Access Marketplace Orders') ? '1' : '0',
        can_access_production_packaging: formData.permissions.includes('Can Access Production Packaging') ? '1' : '0',
        /*is_sales_person: formData.permissions.includes('Is Sales Person') ? '1' : '0',
        is_reg_cashier: formData.permissions.includes('Is Registered Cashier') ? '1' : '0',
        can_view_products: formData.permissions.includes('Can View Products') ? '1' : '0',
        can_manually_add_products: formData.permissions.includes('Can Manually Add Products') ? '1' : '0',
        can_import_products_metrc: formData.permissions.includes('Can Import Products from METRC') ? '1' : '0',
        can_view_packages: formData.permissions.includes('Can View Packages') ? '1' : '0',
        can_new_packages: formData.permissions.includes('Can Create New Packages') ? '1' : '0',
        view_dashboard: formData.permissions.includes('Can View Dashboard') ? '1' : '0',
        view_customer: formData.permissions.includes('Can View Customers') ? '1' : '0',
        add_edit_customer: formData.permissions.includes('Can Add/Edit Customers') ? '1' : '0',
        view_marketplace_catalog: formData.permissions.includes('Can View Marketplace Catalog') ? '1' : '0',
        reporting: formData.permissions.includes('Can Access Reports') ? '1' : '0',*/
      };
	  
		// Filter out '0' values from permissionData
		Object.keys(permissionData).forEach(key => {
			if (permissionData[key as keyof typeof permissionData] === '0') {
				delete permissionData[key as keyof typeof permissionData];
			}
		});
		
		// 🔹 Build request body
		const requestBody: UserRequestBody = {
		  email: formData.email,
		  first_name: formData.first_name,
		  last_name: formData.last_name,
		  position: formData.position,
		  is_point_contact: formData.is_point_of_contact,
		  phone: formData.phone,
		  account_type: formData.account_type,
		  ...permissionData,
		  business,
		};

		// 🔹 ONLY FOR PUT → add employee_id
		if (editingUser) {
		  requestBody.employee_id = editingUser.id;
		  requestBody.user_id = editingUser.user_id;
		  requestBody.page_id = editingUser.page_id;
		  requestBody.business_id = editingUser.business_id;
		}

      const response = await axios({
        method,
        url: endpoint,
        data: requestBody,
      });

      if (response.data?.status === 'success') {
        toast.success(editingUser ? 'User updated successfully' : 'User added successfully');
        fetchUsers(currentPage);
        resetForm();
      }else {
		// 🔴 API returned failed status
		const errorMsg =
		  response.data?.error?.message ||
		  response.data?.message ||
		  'Something went wrong';

		toast.error(errorMsg,{
		  position: 'bottom-center',
		});
	  }
    } catch (error) {
      toast.error('Failed to save user',{
		  position: 'bottom-center',
		});
    }
  };

  // ==================== DELETE USER ====================
  const handleDeleteConfirm = (userId: string, userName: string) => {
    setDeleteConfirmUserId(userId);
    setDeleteConfirmUserName(userName);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
		
		const response = await axios.delete(`/api/business/settings/users-permissions`, {
			data: { id: deleteConfirmUserId },
		});
		
     // const response = await axios.delete(`/api/business/customers/${userId}`);

      if (response.data?.status === 'success') {
        toast.success('User deleted successfully',{
		  position: 'bottom-center',
		});
        setDeleteConfirmUserId(null);
        fetchUsers(currentPage);
      }
    } catch (error) {
      toast.error('Failed to delete user',{
		  position: 'bottom-center',
		});
    }
  };

  // ==================== DELETE CONFIRMATION MODAL ====================
  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-bold">Delete User</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <strong>{deleteConfirmUserName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteConfirmUserId(null)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeleteUser(deleteConfirmUserId!)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  // ==================== FORM HANDLERS ====================
  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      position: '',
      phone: '',
      account_type: '',
      permissions: [],
      is_point_of_contact: false,
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const handleEditUser = (user: User) => {
	  console.log(user);
    setEditingUser(user);
    const permissions = user.account_type === 'admin' ? getAdminPermissions() : user.permissions;
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      position: user.position,
      phone: user.phone,
      account_type: user.account_type,
      permissions: permissions,
      is_point_of_contact: user.is_point_of_contact,
    });
    setShowForm(true);
  };

  const handlePermissionToggle = (permission: string) => {
    // Prevent permission changes if account type is admin
    if (formData.account_type === 'admin') {
      toast.warning('Admin users have all permissions by default and cannot be modified');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, phone: formatted });
  };

  // ==================== PAGINATION HANDLERS ====================
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchUsers(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchUsers(currentPage + 1);
    }
  };

  // ==================== FILTER & SEARCH ====================
  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesAccountType = !filters.accountType || user.account_type === filters.accountType;

    return matchesSearch && matchesAccountType;
  });

  // ==================== RENDER FORM ====================
  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {/* Header */}
          <div className="flex items-center gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {editingUser ? 'Update user information and permissions' : 'Create a new user account'}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name *"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <input
                type="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Phone</label>
                  <input
                    type="tel"
                    placeholder="(xxx) xxx-xxxx"
                    value={formData.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    maxLength={14}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Position"
                  value={formData.position}
                  onChange={e => setFormData({ ...formData, position: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Account Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Type
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      const newPermissions = type.value === 'admin' ? getAdminPermissions() : [];
                      setFormData({ 
                        ...formData, 
                        account_type: type.value as any,
                        permissions: newPermissions
                      });
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-semibold transition ${
                      formData.account_type === type.value
                        ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {!formData.account_type && (
                <p className="text-sm text-red-600 dark:text-red-400">Please select an account type</p>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_point_of_contact}
                  onChange={e => setFormData({ ...formData, is_point_of_contact: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Set as Point of Contact</span>
              </label>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Permissions ({formData.permissions.length} selected)
                </h3>
                {formData.account_type === 'admin' && (
                  <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-semibold rounded-full">
                    All permissions assigned
                  </span>
                )}
              </div>

              {formData.account_type === 'admin' && (
                <p className="text-sm text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg">
                  ✓ Admin users automatically have access to all permissions and cannot be modified.
                </p>
              )}

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${formData.account_type === 'admin' ? 'opacity-60 pointer-events-none' : ''}`}>
                {PERMISSION_OPTIONS.map(permission => (
                  <label 
                    key={permission} 
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                      formData.account_type === 'admin'
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={() => handlePermissionToggle(permission)}
                      disabled={formData.account_type === 'admin'}
                      className={`w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 ${
                        formData.account_type === 'admin' ? 'cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="text-sm">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingUser ? 'Update User' : 'Add User'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER LIST ====================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Manage Users</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage the permissions for your users.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Account Type</label>
                <select
                  value={filters.accountType}
                  onChange={e => setFilters({ ...filters, accountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Types</option>
                  {ACCOUNT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setFilters({ accountType: '', lastLoginFrom: '', lastLoginTo: '' });
                  setFilterOpen(false);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Clear
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Results Counter & Pagination Info */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Showing page {currentPage} of {totalPages}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        )}

        {/* Users Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs font-semibold bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded uppercase">
                      {user.account_type}
                    </span>
                    {user.is_point_of_contact && (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        POC
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Name */}
                <h3 className="font-semibold text-lg mb-1">
                  {user.first_name} {user.last_name}
                </h3>

                {/* Email & Phone */}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                  {user.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </p>
                  )}
                  {user.position && user.position !== '-' && (
                    <p className="text-gray-700 dark:text-gray-300">{user.position}</p>
                  )}
                </div>

                {/* Permissions */}
                <div className="mb-3 pb-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Permissions ({user.permissions.length})
                  </p>
                  {user.permissions.length > 0 ? (
                    <div className="space-y-1">
                      {user.permissions.slice(0, 3).map(perm => (
                        <p key={perm} className="text-xs text-gray-600 dark:text-gray-400">
                          • {perm}
                        </p>
                      ))}
                      {user.permissions.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                          +{user.permissions.length - 3} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No permissions assigned</p>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteConfirm(user.id, `${user.first_name} ${user.last_name}`)}
                  className="w-full py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && users.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && users.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmUserId && <DeleteConfirmModal />}
    </div>
  );
}