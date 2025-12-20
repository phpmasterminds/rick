'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ChevronDown, Trash2, Plus, AlertCircle, Edit2, Search, Filter, ChevronLeft, 
  ChevronRight, Eye, EyeOff, X, Mail, Phone, MapPin, Loader2, Minus
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Email {
  name: string;
  email_primary: boolean;
}

interface Customer {
  customer_id: string;
  account_id: string;
  page_id: string;
  account_name: string;
  website: string;
  email: Email[];
  billing_street: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  license_type: string;
  license_number: string;
  expiration_date: string;
  annual_revenue: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_office_phone: string;
  contact_mobile: string;
  contact_job_title: string;
  contact_department: string;
  contact_address: string;
  contact_city: string;
  contact_state: string;
  contact_postal_code: string;
  contact_account_name?: string;
  contact_fax?: string;
  contact_description?: string;
  copy_address_from_left?: boolean;
  sales_person?: string;
  crm_rep?: string;
  marketplace_blanket_discount?: string;
  // Nested objects from API
  account_details?: any;
  detail?: any;
  contact_company_name?: string;
  contact_name?: string;
  contact_email?: string;
  office_phone?: string;
  business_url?: string;
  state_name?: string;
  primary_email?: string;
  first_name?: string;
  last_name?: string;
  state_license_number?: string;
  contact_zip_code?: string;
}

interface SalesPersonOption {
  user_id: string;
  full_name: string;
  [key: string]: any;
}

interface CRMRepOption {
  user_id: string;
  full_name: string;
  [key: string]: any;
}
/*
interface CustomerListPageProps {
  business: string;
  theme?: 'light' | 'dark';
}*/

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

export default function CustomerListPage() {
  const currentTheme = 'light';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('account_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [aCurrentVanityUrl, setCurrentVanityUrl] = useState('');

	// Helper function to get cookie
	const getCookie = (name: string): string => {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
		return '';
	};

	// Get vanity_url from cookies on mount - FIX: moved to useEffect
	useEffect(() => {
		setCurrentVanityUrl(getCookie('vanity_url'));
	}, []);
  useEffect(() => {
    // Fetch customers on component mount
    fetchCustomers(1);
  }, []);

  useEffect(() => {
    let filtered = customers.filter((customer) =>
      (customer.contact_company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.contact_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.contact_email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.billing_city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Customer];
      let bVal: any = b[sortColumn as keyof Customer];
      
      // Handle null/undefined values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [searchTerm, customers, sortColumn, sortDirection]);

  // Fetch customers with pagination
  const fetchCustomers = async (page: number = 1) => {
    setLoading(true);
    try {

		
      const response = await axios.get(
        `/api/business/customers?page=${page}&limit=${itemsPerPage}&business=${aCurrentVanityUrl}`
      );
      
      if (response.data.status === 'success') {
		    const customers = response.data.data?.customers || [];

        setCustomers(customers);
        setCurrentPage(page);
        
        if (customers.length === 0 && page === 1) {
			toast.info('No customers found. Start by adding your first customer!');
		  }
      } else {
        toast.error(response.data.message || 'Failed to load customers');
        setCustomers([]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to load customers';
      toast.error(errorMessage);
      console.error('Fetch customers error:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId: string) => {
    try {
		const response = await axios.delete(`/api/business/posinventory`, {
			data: { id: customerId },
		});
      
      // Handle new API response format: {status: "success", data: [], message: "..."}
      if (response.data.status === 'success' || response.data.success) {
        setCustomers(customers.filter(c => c.customer_id !== customerId));
        toast.success(response.data.message || 'Customer deleted successfully');
        setDeleteConfirm(null);
      } else {
        toast.error(response.data.message || 'Failed to delete customer');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to delete customer';
      toast.error(errorMessage);
      console.error('Delete customer error:', error);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage all your customers and contact information
        </p>
      </div>
	
      {/* Toolbar */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Search and Filter */}
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 accent-bg accent-hover text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md">
		{/* Loading State */}
        {loading && (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Customers</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we fetch your customers...
            </p>
          </div>
        )}
		
        {/* No Data State */}
        {!loading && filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No customers found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first customer'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 accent-bg accent-hover text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Your First Customer
              </button>
            )}
          </div>
		)}
        {/* Data Table */}
        {!loading && filteredCustomers.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th
                      onClick={() => handleSort('account_name')}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition"
                    >
                      <div className="flex items-center gap-2">
                        Company Name
                        {sortColumn === 'account_name' && (
                          <span className="text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('contact_first_name')}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition"
                    >
                      <div className="flex items-center gap-2">
                        Contact
                        {sortColumn === 'contact_first_name' && (
                          <span className="text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      City
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginatedCustomers.map((customer) => (
                    <tr
                      key={customer.customer_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {customer.account_details?.account_name || customer.contact_company_name || customer.account_name || 'N/A'}
                          </span>
                          {(customer.account_details?.license_type || customer.license_type) && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {customer.account_details?.license_type || customer.license_type}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-gray-100">
                          {customer.contact_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`mailto:${customer.contact_email}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                        >
                          <Mail className="w-4 h-4" />
                          {customer.contact_email}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`tel:${customer.account_details?.contact_mobile || customer.contact_mobile}`}
                          className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm flex items-center gap-1"
                        >
                          <Phone className="w-4 h-4" />
                          {customer.account_details?.contact_mobile || customer.contact_mobile || 'N/A'}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 text-sm">
                          <MapPin className="w-4 h-4" />
                          {customer.contact_city}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => {
                              setEditingCustomer(customer);
                              setShowAddModal(true);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                            title="Edit customer"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(customer.customer_id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Delete customer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of{' '}
                  {filteredCustomers.length} customers
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 rounded-lg transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {showAddModal && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => {
            setShowAddModal(false);
            setEditingCustomer(null);
          }}
          onSave={(customer) => {
            if (editingCustomer) {
              setCustomers(customers.map(c => c.customer_id === customer.customer_id ? customer : c));
            } else {
              setCustomers([...customers, { ...customer, customer_id: Date.now().toString() }]);
            }
            setShowAddModal(false);
            setEditingCustomer(null);
          }}
          business={aCurrentVanityUrl}
          theme={currentTheme}
          page_id={editingCustomer?.page_id || (customers.length > 0 ? customers[0].page_id : '')}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 max-w-sm w-full mx-4`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Customer</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this customer? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(deleteConfirm);
                }}
                className="flex-1 px-4 py-2 accent-bg accent-hover text-white rounded-lg font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Customer Form Modal Component */
interface CustomerFormModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  business: string;
  theme: 'light' | 'dark';
  page_id: string;
}

function CustomerFormModal({
  customer,
  onClose,
  onSave,
  business,
  theme,
  page_id,
}: CustomerFormModalProps) {
  // States for dropdown data
  const [salesPersonList, setSalesPersonList] = useState<SalesPersonOption[]>([]);
  const [crmRepList, setCRMRepList] = useState<CRMRepOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const dropdownsFetchedRef = useRef(false);

  // Fetch Sales Person and CRM Rep data (only once per modal instance)
  const fetchDropdownData = useCallback(async () => {
    if (!page_id || dropdownsFetchedRef.current) return;
    
    dropdownsFetchedRef.current = true;
    setLoadingDropdowns(true);
    try {
      // Fetch Sales Person data
      try {
        const salesResponse = await axios.get(
          `/api/business/sales-persons?page_id=${page_id}`
        );
        if (salesResponse.data.status === 'success' && Array.isArray(salesResponse.data.data)) {
          setSalesPersonList(salesResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching sales persons:', error);
      }

      // Fetch CRM Rep data
      try {
        const crmResponse = await axios.get(
          `/api/business/crm-reps?page_id=${page_id}`
        );
        if (crmResponse.data.status === 'success' && Array.isArray(crmResponse.data.data)) {
          setCRMRepList(crmResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching CRM reps:', error);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setLoadingDropdowns(false);
    }
  }, [page_id]);

  // Fetch dropdown data on component mount
  useEffect(() => {
    fetchDropdownData();
  }, [page_id, fetchDropdownData]);

  // Initialize form data with proper mapping from customer/API response
  const initializeFormData = (): Partial<Customer> => {
    // Helper to convert state name to ID
    const getStateIdByName = (stateName: string): string => {
      if (!stateName) return '';
      
      // If already a number (1-59), return it
      if (/^\d+$/.test(stateName)) return stateName;
      
      // Find the state by name
      const stateEntry = Object.entries(states).find(([_, name]) => 
        name.toLowerCase() === stateName.toLowerCase()
      );
      return stateEntry ? stateEntry[0] : '';
    };

    if (!customer) {
      // New customer form
      return {
        account_name: '',
        website: '',
        email: [{ name: '', email_primary: true }],
        billing_street: '',
        billing_city: '',
        billing_state: '',
        billing_postal_code: '',
        billing_phone: '',
        shipping_street: '',
        shipping_city: '',
        shipping_state: '',
        shipping_postal_code: '',
        license_type: '',
        license_number: '',
        expiration_date: '',
        annual_revenue: '',
        contact_company_name: '',
        contact_name: '',
        contact_first_name: '',
        contact_last_name: '',
        contact_office_phone: '',
        contact_mobile: '',
        contact_job_title: '',
        contact_department: '',
        contact_account_name: '',
        contact_fax: '',
        contact_email: '',
        contact_address: '',
        contact_city: '',
        contact_state: '',
        contact_postal_code: '',
        contact_description: '',
        copy_address_from_left: false,
        sales_person: '',
        crm_rep: '',
        marketplace_blanket_discount: '',
      };
    }

    // Parse email field if it's a JSON string (from API response)
    let parsedEmails: Email[] = [];
    if (typeof customer.email === 'string') {
      try {
        parsedEmails = JSON.parse(customer.email);
      } catch (e) {
        parsedEmails = [{ name: customer.contact_email || '', email_primary: true }];
      }
    } else if (Array.isArray(customer.email)) {
      parsedEmails = customer.email;
    } else {
      parsedEmails = [{ name: customer.contact_email || '', email_primary: true }];
    }

    // Ensure we have at least one email
    if (parsedEmails.length === 0) {
      parsedEmails = [{ name: customer.contact_email || '', email_primary: true }];
    }

    // Ensure we have account_details and detail objects
    const accountDetails = customer.account_details || {};
    const detail = customer.detail || {};

    // Map API response fields to form fields
    return {
      customer_id: customer.customer_id || '',
      account_id: accountDetails.account_id || customer.account_id || '',
      account_name: customer.contact_company_name || accountDetails.account_name || customer.account_name || '',
      website:  accountDetails.website || customer.business_url || '',
      email: parsedEmails,
      billing_street: customer.billing_street || accountDetails.billing_street || '',
      billing_city: customer.billing_city || accountDetails.billing_city || '',
      billing_state: getStateIdByName(customer.billing_state || accountDetails.billing_state || customer.state_name || ''),
      billing_postal_code: customer.billing_postal_code || accountDetails.billing_postal_code || '',
      billing_phone: customer.office_phone || accountDetails.office_phone || '',
      shipping_street: customer.shipping_street || accountDetails.shipping_street || '',
      shipping_city: customer.shipping_city || accountDetails.shipping_city || '',
      shipping_state: getStateIdByName(customer.shipping_state || detail.shipping_state || accountDetails.shipping_state || customer.state_name || ''),
      shipping_postal_code: customer.shipping_postal_code || accountDetails.shipping_postal_code || customer.contact_zip_code || '',
      license_type: customer.license_type || accountDetails.license_type || '',
      license_number: customer.license_number || accountDetails.license_number || customer.state_license_number || '',
      expiration_date: customer.expiration_date || accountDetails.expiration_date || '',
      annual_revenue: customer.annual_revenue || accountDetails.annual_revenue || '',
      contact_company_name: customer.contact_company_name || accountDetails.contact_company_name || '',
      contact_name: customer.contact_name || detail.contact_name || '',
      contact_first_name: customer.contact_first_name || detail.contact_first_name || accountDetails.contact_first_name || customer.first_name || '',
      contact_last_name: customer.contact_last_name || detail.contact_last_name || accountDetails.contact_last_name || customer.last_name || '',
      contact_office_phone: customer.contact_office_phone || accountDetails.contact_office_phone || customer.office_phone || '',
      contact_mobile: customer.contact_mobile || accountDetails.contact_mobile || detail.contact_mobile || '',
      contact_job_title: customer.contact_job_title || accountDetails.contact_job_title || '',
      contact_department: customer.contact_department || accountDetails.contact_department || detail.contact_department || '',
      contact_account_name: customer.contact_account_name || accountDetails.contact_account_name || '',
      contact_fax: customer.contact_fax || accountDetails.contact_fax || accountDetails.fax || '',
      contact_email: customer.contact_email || customer.primary_email || accountDetails.contact_email || detail.contact_email || '',
      contact_address: customer.contact_address || accountDetails.contact_address || detail.contact_address || '',
      contact_city: customer.contact_city || accountDetails.contact_city || detail.contact_city || '',
      contact_state: getStateIdByName(customer.contact_state || accountDetails.contact_state || detail.contact_state || customer.state_name || ''),
      contact_postal_code: customer.contact_postal_code || accountDetails.contact_postal_code || customer.contact_zip_code || detail.contact_postal_code || '',
      contact_description: customer.contact_description || accountDetails.contact_description || detail.contact_description || '',
      copy_address_from_left: false,
      sales_person: customer.sales_person || detail.sales_person || '',
      crm_rep: customer.crm_rep || '',
      marketplace_blanket_discount: customer.marketplace_blanket_discount || accountDetails.marketplace_blanket_discount || '',
    };
  };

  const [formData, setFormData] = useState<Partial<Customer>>(initializeFormData());

  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('business');
  
  // Initialize emails from formData
  const getInitialEmails = (): Email[] => {
    if (Array.isArray(formData.email) && formData.email.length > 0) {
      return formData.email;
    }
    if (formData.contact_email) {
      return [{ name: formData.contact_email, email_primary: true }];
    }
    return [{ name: '', email_primary: true }];
  };

  const [emails, setEmails] = useState<Email[]>(getInitialEmails());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const addEmail = () => {
    const newEmails = [...emails, { name: '', email_primary: false }];
    setEmails(newEmails);
    setFormData(prev => ({ ...prev, email: newEmails }));
  };

  const removeEmail = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails);
    setFormData(prev => ({ ...prev, email: newEmails }));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index].name = value;
    if (index === 0) {
      setFormData(prev => ({ ...prev, contact_email: value }));
    }
    setEmails(newEmails);
    setFormData(prev => ({ ...prev, email: newEmails }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Validate required fields
      if (!formData.account_name?.trim()) {
        toast.error('Company name is required');
        setSubmitting(false);
        return;
      }

      if (!formData.contact_first_name?.trim()) {
        toast.error('Contact first name is required');
        setSubmitting(false);
        return;
      }

      if (!formData.contact_email?.trim()) {
        toast.error('Contact email is required');
        setSubmitting(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact_email)) {
        toast.error('Please enter a valid email address');
        setSubmitting(false);
        return;
      }

      const endpoint = customer 
        ? `/api/business/customers`
        : `/api/business/customers`;

      const method = customer ? 'put' : 'post';

      const payload = {
        ...formData,
        email: emails,
        business: business,
        page_id: page_id,
      };

      const response = await axios({
        method,
        url: endpoint,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle new API response format: {status: "success", data: [], message: "..."}
      if (response.data.status === 'success' || response.data.success) {
        toast.success(
          response.data.message || 
          (customer ? 'Customer updated successfully' : 'Customer added successfully')
        );
        
        onSave({
          customer_id: response.data.customer?.customer_id || response.data.data?.[0]?.customer_id || customer?.customer_id || '',
          account_id: response.data.customer?.account_id || response.data.data?.[0]?.account_id || customer?.account_id || '',
          page_id: business,
          ...formData,
          email: emails,
          // Preserve nested objects if they exist
          account_details: customer?.account_details || undefined,
          detail: customer?.detail || undefined,
        } as Customer);
      } else {
        toast.error(response.data.message || 'Failed to save customer');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Failed to save customer. Please try again.';
      toast.error(errorMessage);
      console.error('Save customer error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-gray-50'} sticky top-0 z-10`}>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab('business')}
              className={`pb-3 px-4 font-medium transition ${
                activeTab === 'business'
                  ? `border-b-2 border-blue-500 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Business Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('license')}
              className={`pb-3 px-4 font-medium transition ${
                activeTab === 'license'
                  ? `border-b-2 border-blue-500 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              License
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`pb-3 px-4 font-medium transition ${
                activeTab === 'contact'
                  ? `border-b-2 border-blue-500 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Contact Info
            </button>
          </div>

          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              {/* Account Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Company Name *
                </label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name || ''}
                  onChange={handleInputChange}
                  placeholder="Account Name"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  required
                />
              </div>

              {/* Website */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                />
              </div>

              {/* Email Addresses */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address *
                </label>
                <div className="space-y-3">
                  {emails.map((email, index) => (
                    <div
                      key={`email_${index}`}
                      className={`flex items-center gap-3 p-3 rounded-md ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border border-gray-600' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <input
                        type="email"
                        value={email.name}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        placeholder="test@example.com"
                        required
                        className={`flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                          theme === 'dark'
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <label className={`flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        <input
                          type="checkbox"
                          checked={email.email_primary}
                          onChange={() => {
                            const newEmails = emails.map((e, i) => ({
                              ...e,
                              email_primary: i === index,
                            }));
                            setEmails(newEmails);
                            setFormData(prev => ({ ...prev, email: newEmails }));
                          }}
                          className="w-4 h-4 rounded focus:ring-2"
                        />
                        <span className="text-sm">Primary</span>
                      </label>
                      <div className="flex gap-2">
                        {index === 0 && (
                          <button
                            type="button"
                            onClick={addEmail}
                            className={`p-2 rounded-md transition ${
                              theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-600'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Add Secondary Email"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeEmail(index)}
                            className={`p-2 rounded-md transition ${
                              theme === 'dark'
                                ? 'text-red-400 hover:bg-red-900/20'
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                            title="Remove Secondary Email"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales Person and CRM Rep Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sales Person
                  </label>
                  <select
                    name="sales_person"
                    value={formData.sales_person || ''}
                    onChange={handleInputChange}
                    disabled={loadingDropdowns || salesPersonList.length === 0}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                      theme === 'dark' 
                        ? 'bg-gray-800 text-gray-100' 
                        : 'bg-white text-gray-900'
                    } ${loadingDropdowns || salesPersonList.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {loadingDropdowns ? 'Loading...' : 'Select Sales Person'}
                    </option>
                    {salesPersonList.map((person) => (
                      <option key={`sales_person_${person.user_id}`} value={person.user_id}>
                        {person.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    CRM Rep
                  </label>
                  <select
                    name="crm_rep"
                    value={formData.crm_rep || ''}
                    onChange={handleInputChange}
                    disabled={loadingDropdowns || crmRepList.length === 0}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                      theme === 'dark' 
                        ? 'bg-gray-800 text-gray-100' 
                        : 'bg-white text-gray-900'
                    } ${loadingDropdowns || crmRepList.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {loadingDropdowns ? 'Loading...' : 'Select CRM Rep'}
                    </option>
                    {crmRepList.map((rep) => (
                      <option key={`crm_rep_${rep.user_id}`} value={rep.user_id}>
                        {rep.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Marketplace Blanket Discount */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Marketplace Blanket Discount
                </label>
                <input
                  type="text"
                  name="marketplace_blanket_discount"
                  value={formData.marketplace_blanket_discount || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 10% or 0.10"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                />
              </div>

              {/* Billing Address Section */}
              <div className={`border-t pt-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className={`font-semibold mb-4 text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  Billing Address
                </h4>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Street
                  </label>
                  <textarea
                    name="billing_street"
                    value={formData.billing_street || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      City
                    </label>
                    <input
                      type="text"
                      name="billing_city"
                      value={formData.billing_city || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      State/Region
                    </label>
                    <select
                      name="billing_state"
                      value={formData.billing_state || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    >
                      <option value="">Select State</option>
                      {Object.entries(states).map(([code, name]) => (
                        <option key={`billing_state_${code}`} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="billing_postal_code"
                      value={formData.billing_postal_code || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="billing_phone"
                    value={formData.billing_phone || ''}
                    onChange={handleInputChange}
                    placeholder="(xxx) xxx-xxxx"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>
              </div>

              {/* Shipping Address Section */}
              <div className={`border-t pt-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <label className={`flex items-center gap-2 mb-4 cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <input
                    type="checkbox"
                    name="copy_address_from_left"
                    checked={formData.copy_address_from_left || false}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        copy_address_from_left: e.target.checked,
                        shipping_street: e.target.checked ? formData.billing_street : '',
                        shipping_city: e.target.checked ? formData.billing_city : '',
                        shipping_state: e.target.checked ? formData.billing_state : '',
                        shipping_postal_code: e.target.checked ? formData.billing_postal_code : '',
                      }));
                    }}
                    className="w-4 h-4 rounded focus:ring-2"
                  />
                  <span className="text-sm font-medium">Copy Billing Address to Shipping</span>
                </label>

                <h4 className={`font-semibold mb-4 text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  Shipping Address
                </h4>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Street
                  </label>
                  <textarea
                    name="shipping_street"
                    value={formData.shipping_street || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      City
                    </label>
                    <input
                      type="text"
                      name="shipping_city"
                      value={formData.shipping_city || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      State/Region
                    </label>
                    <select
                      name="shipping_state"
                      value={formData.shipping_state || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    >
                      <option value="">Select State</option>
                      {Object.entries(states).map(([code, name]) => (
                        <option key={`shipping_state_${code}`} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="shipping_postal_code"
                      value={formData.shipping_postal_code || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* License Tab */}
          {activeTab === 'license' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  License Details
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    License Type
                  </label>
                  <select
                    name="license_type"
                    value={formData.license_type || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  >
                    <option value="">Select Type</option>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    License Number
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., LIC123456"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    name="expiration_date"
                    value={formData.expiration_date || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Annual Revenue
                  </label>
                  <input
                    type="text"
                    name="annual_revenue"
                    value={formData.annual_revenue || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., $500,000"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>
              </div>

              {/* License Status Card */}
              <div className={`border-2 rounded-lg p-6 ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800/50' 
                  : 'border-blue-100 bg-blue-50'
              }`}>
                <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  License Status
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Type:
                    </span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      {formData.license_type || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      License Number:
                    </span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      {formData.license_number || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Expiration:
                    </span>
                    <span className={`font-medium ${
                      formData.expiration_date 
                        ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formData.expiration_date ? new Date(formData.expiration_date).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Annual Revenue:
                    </span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      {formData.annual_revenue || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className={`border-t pt-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  ℹ️ License information helps you track compliance and manage your customer relationships effectively.
                </p>
              </div>
            </div>
          )}

          {/* Contact Info Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="contact_first_name"
                    value={formData.contact_first_name || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="contact_last_name"
                    value={formData.contact_last_name || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Account Name
                </label>
                <input
                  type="text"
                  name="contact_account_name"
                  value={formData.contact_account_name || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Office Phone
                  </label>
                  <input
                    type="tel"
                    name="contact_office_phone"
                    value={formData.contact_office_phone || ''}
                    onChange={handleInputChange}
                    placeholder="(xxx) xxx-xxxx"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Mobile
                  </label>
                  <input
                    type="tel"
                    name="contact_mobile"
                    value={formData.contact_mobile || ''}
                    onChange={handleInputChange}
                    placeholder="(xxx) xxx-xxxx"
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="contact_job_title"
                    value={formData.contact_job_title || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Department
                  </label>
                  <input
                    type="text"
                    name="contact_department"
                    value={formData.contact_department || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fax
                </label>
                <input
                  type="text"
                  name="contact_fax"
                  value={formData.contact_fax || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  name="contact_description"
                  value={formData.contact_description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                />
              </div>

              {/* Primary Address */}
              <div className={`border-t pt-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className={`font-semibold mb-4 text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  Primary Address
                </h4>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Address
                  </label>
                  <textarea
                    name="contact_address"
                    value={formData.contact_address || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      City
                    </label>
                    <input
                      type="text"
                      name="contact_city"
                      value={formData.contact_city || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      State/Region
                    </label>
                    <select
                      name="contact_state"
                      value={formData.contact_state || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    >
                      <option value="">Select State</option>
                      {Object.entries(states).map(([code, name]) => (
                        <option key={`contact_state_${code}`} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="contact_postal_code"
                      value={formData.contact_postal_code || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2.5 rounded-lg font-semibold transition ${theme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 accent-bg accent-hover text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                customer ? 'Update Customer' : 'Add Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}