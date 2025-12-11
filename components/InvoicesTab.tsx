'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, Calendar, DollarSign, Check, X, Edit2, Save, Clock, 
  CreditCard, AlertTriangle, Filter, Download, RefreshCw, Clock3,
  ChevronDown, MoreVertical, Eye, Lock, Unlock, FileText, Send, XCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Invoice {
  id: string;
  registration_id: string;
  user_id: string;
  invoice_number: string;
  subtotal: string;
  tax: string;
  total_amount: string;
  trial_days: string;
  trial_end_date: string;
  billing_start_date: string;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  due_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Cron tracking fields
  notification_sent_at?: string | null;
  notification_status?: string | null;
  admin_action_taken?: number;
  admin_action_taken_by?: number;
  admin_action_taken_at?: string | null;
  admin_action_notes?: string | null;
  auto_disabled_at?: string | null;
  auto_disable_status?: string | null;
  // User info
  full_name?: string;
  email?: string;
  company_name?: string;
  license_type?: string;
}

interface AdminModalState {
  isOpen: boolean;
  invoice: Invoice | null;
  action: 'payment' | 'admin_action' | 'disable' | 'enable' | null;
}

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray', icon: FileText },
  { value: 'issued', label: 'Issued', color: 'blue', icon: Send },
  { value: 'paid', label: 'Paid', color: 'green', icon: Check },
  { value: 'partial', label: 'Partial Payment', color: 'yellow', icon: Clock },
  { value: 'overdue', label: 'Overdue', color: 'red', icon: AlertTriangle },
  { value: 'cancelled', label: 'Cancelled', color: 'dark', icon: XCircle },
];

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

interface ApiResponse {
  status: string;
  data: {
    total: number;
    page: number;
    limit: number;
    users: Invoice[];
  };
  message: string;
  error: null | string;
}

interface RegistrationData {
  user_id: string;
  account_name: string;
  contact_email: string;
}

/**
 * ============================================================================
 * ADMIN INVOICE MANAGEMENT TAB - SIMPLIFIED VERSION
 * ============================================================================
 * 
 * This is the ADMIN VERSION of the invoices tab with:
 * 1. Single "Record Payment" modal (no tabs, no status change)
 * 2. Amount paid text box (after payment method)
 * 3. Admin action tracking (prevent auto-disable)
 * 4. User enable/disable controls
 * 5. Complete audit trail
 * 
 * MODALS:
 * - Payment: Record Payment (simplified, no tabs)
 * - Admin Action: Mark handling to prevent auto-disable
 * - User Disable: Block access
 * - User Enable: Restore access
 * 
 * ============================================================================
 */

export default function InvoicesTab({ registrationData }: { registrationData: RegistrationData }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [adminModal, setAdminModal] = useState<AdminModalState>({
    isOpen: false,
    invoice: null,
    action: null,
  });
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch invoices
  useEffect(() => {
    if (registrationData?.user_id) {
      fetchInvoices();
    }
  }, [registrationData?.user_id]);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse>('/api/user/invoice', {
        params: {
          user_id: registrationData.user_id,
        },
      });

      if (response.data.status === 'success' && response.data.data?.users) {
        setInvoices(response.data.data.users);
      } else {
        setInvoices([]);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [registrationData.user_id]);

  // Get status badge
  const getStatusBadge = (status: string, invoice: Invoice) => {
    const statusConfig = INVOICE_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;

    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      dark: 'bg-gray-700 text-white',
    };

    const IconComponent = statusConfig.icon;

    let badge = statusConfig.label;
    if (status === 'overdue' && invoice.auto_disabled_at) {
      badge += ' (Account Disabled)';
    }

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${colorClasses[statusConfig.color as keyof typeof colorClasses]}`}>
        <IconComponent className="w-3 h-3" />
        {badge}
      </div>
    );
  };

  // Calculate days overdue
  const calculateDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Open admin modal
  const openAdminModal = (invoice: Invoice, action: 'payment' | 'admin_action' | 'disable' | 'enable') => {
    setAdminModal({
      isOpen: true,
      invoice,
      action,
    });
    setFormData({
      payment_method: invoice.payment_method || '',
      amount_paid: invoice.total_amount,
      payment_notes: '',
      status_notes: '',
    });
  };

  // Close admin modal
  const closeAdminModal = () => {
    setAdminModal({
      isOpen: false,
      invoice: null,
      action: null,
    });
    setFormData({});
  };

  // Record payment
  const handleRecordPayment = async () => {
    if (!adminModal.invoice || !formData.payment_method) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setSubmitting(true);
	  
	  const response = await axios.post(
          `/api/user/invoice-id?id=${adminModal.invoice.id}`,
          {
            invoice_id: adminModal.invoice.id,
            status: formData.status === 'paid' ? 'paid' : 'partial',
            payment_method: formData.payment_method || null,
			amount_paid: formData.amount_paid,
            notes: formData.payment_notes,
			p_status: 'update-payment'
          }
        );
		

      if (response.data.status === 'success') {
        toast.success('Payment recorded successfully');
        closeAdminModal();
        await fetchInvoices();
      }
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark admin action taken (prevents auto-disable)
  const handleMarkActionTaken = async () => {
    if (!adminModal.invoice) return;

    try {
      setSubmitting(true);
      const response = await axios.post(
        `/api/business/invoice-admin-actions/mark-action-taken`,
        {
          id: adminModal.invoice.id,
          notes: formData.status_notes,
        }
      );

      if (response.data.status === 'success') {
        toast.success('Admin action marked. Account will not be auto-disabled.');
        closeAdminModal();
        await fetchInvoices();
      }
    } catch (error: any) {
      console.error('Error marking action:', error);
      toast.error('Failed to mark action');
    } finally {
      setSubmitting(false);
    }
  };

  // Enable user account
  const handleEnableUser = async () => {
    if (!adminModal.invoice) return;

    try {
      setSubmitting(true);
	   const response = await axios.post(
          `/api/user/invoice-id?id=${adminModal.invoice.id}`,
          {
            user_id: adminModal.invoice.user_id,
			invoice_id: adminModal.invoice.id,
			reason: 'enable',
			notes: formData.status_notes,
			p_status: 'enabe-user'
          }
        );
		

      if (response.data.status === 'success') {
        toast.success('User account re-enabled successfully');
        closeAdminModal();
        await fetchInvoices();
      }
    } catch (error: any) {
      console.error('Error enabling user:', error);
      toast.error('Failed to enable user');
    } finally {
      setSubmitting(false);
    }
  };

  // Disable user account
  const handleDisableUser = async () => {
    if (!adminModal.invoice) return;

    try {
      setSubmitting(true);
	  
	  const response = await axios.post(
          `/api/user/invoice-id?id=${adminModal.invoice.id}`,
          {
            user_id: adminModal.invoice.user_id,
			invoice_id: adminModal.invoice.id,
			reason: 'admin_disabled_overdue_invoice',
			notes: formData.status_notes,
			p_status: 'disable-user'
          }
        );
		

      if (response.data.status === 'success') {
        toast.success('User account disabled');
        closeAdminModal();
        await fetchInvoices();
      }
    } catch (error: any) {
      console.error('Error disabling user:', error);
      toast.error('Failed to disable user');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Management</h2>
          <p className="text-sm text-gray-600 mt-1">Admin control panel for invoice payments and user management</p>
        </div>
        <button
          onClick={() => fetchInvoices()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search by invoice #, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            {INVOICE_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {!loading && filteredInvoices.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Admin Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const daysOverdue = calculateDaysOverdue(invoice.due_date);
                  const isOverdue = daysOverdue > 0;

                  return (
                    <tr key={invoice.id} className={`hover:bg-gray-50 transition-colors ${invoice.auto_disabled_at ? 'bg-red-50' : ''}`}>
                      {/* Invoice Number */}
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div>
                          <div>{invoice.invoice_number}</div>
                          <div className="text-xs text-gray-500 mt-1">ID: {invoice.id}</div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{invoice.full_name}</div>
                          <div className="text-xs text-gray-500">{invoice.email}</div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-semibold text-gray-900">${parseFloat(invoice.total_amount).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Subtotal: ${parseFloat(invoice.subtotal).toFixed(2)}</div>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className={isOverdue && invoice.status !== 'paid' ? 'text-red-600 font-semibold' : ''}>
                            {new Date(invoice.due_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          {isOverdue && invoice.status !== 'paid' && (
                            <div className="text-xs text-red-600 mt-1">
                              {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(invoice.status, invoice)}
                      </td>

                      {/* Admin Action Status */}
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          {invoice.admin_action_taken ? (
                            <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs">
                              <Check className="w-3 h-3" />
                              Admin Handled
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs">No action</div>
                          )}
                          {invoice.notification_sent_at && (
                            <div className="text-xs text-blue-600">
                              Notified: {new Date(invoice.notification_sent_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Record Payment */}
                          <button
                            onClick={() => openAdminModal(invoice, 'payment')}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs transition-colors"
                            title="Record payment"
                          >
                            <DollarSign className="w-3 h-3" />
                            Payment
                          </button>

                          {/* Mark Action Taken */}
                          {!invoice.admin_action_taken && invoice.status === 'overdue' && (
                            <button
                              onClick={() => openAdminModal(invoice, 'admin_action')}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-xs transition-colors"
                              title="Mark that you're handling this invoice"
                            >
                              <Check className="w-3 h-3" />
                              Handling
                            </button>
                          )}

                          {/* Enable/Disable User */}
                          {invoice.auto_disabled_at ? (
                            <button
                              onClick={() => openAdminModal(invoice, 'enable')}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded text-xs transition-colors"
                              title="Re-enable user account"
                            >
                              <Unlock className="w-3 h-3" />
                              Enable
                            </button>
                          ) : (
                            <button
                              onClick={() => openAdminModal(invoice, 'disable')}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs transition-colors"
                              title="Disable user account"
                            >
                              <Lock className="w-3 h-3" />
                              Disable
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filteredInvoices.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No invoices match your filter</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin inline-block">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mt-4">Loading invoices...</p>
        </div>
      )}

      {/* PAYMENT MODAL - Simplified */}
      {adminModal.isOpen && adminModal.action === 'payment' && adminModal.invoice && (
        <PaymentModal
          invoice={adminModal.invoice}
          isOpen={adminModal.isOpen}
          onClose={closeAdminModal}
          formData={formData}
          setFormData={setFormData}
          submitting={submitting}
          onSubmit={handleRecordPayment}
        />
      )}

      {/* ADMIN MODAL - Mark Action Taken */}
      {adminModal.isOpen && adminModal.action === 'admin_action' && adminModal.invoice && (
        <AdminModal
          title="Mark Admin Action Taken"
          invoice={adminModal.invoice}
          isOpen={adminModal.isOpen}
          onClose={closeAdminModal}
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>⏰ Note:</strong> This prevents automatic account disable for the next 5 days. Document what you are handling.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Handling
              </label>
              <textarea
                value={formData.status_notes}
                onChange={(e) => setFormData({ ...formData, status_notes: e.target.value })}
                placeholder="e.g., Payment plan arranged, Check in mail, Payment dispute, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                rows={3}
              />
            </div>

            <button
              onClick={handleMarkActionTaken}
              disabled={submitting}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Marking...' : 'Mark as Handled'}
            </button>
          </div>
        </AdminModal>
      )}

      {/* ADMIN MODAL - Enable User */}
      {adminModal.isOpen && adminModal.action === 'enable' && adminModal.invoice && (
        <AdminModal
          title="Re-enable User Account"
          invoice={adminModal.invoice}
          isOpen={adminModal.isOpen}
          onClose={closeAdminModal}
        >
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded p-3">
              <p className="text-sm text-purple-800">
                <strong>✅ Action:</strong> This will restore the user's access to the platform. Account was disabled on {adminModal.invoice.auto_disabled_at ? new Date(adminModal.invoice.auto_disabled_at).toLocaleDateString() : 'N/A'}.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Re-enabling
              </label>
              <textarea
                value={formData.status_notes}
                onChange={(e) => setFormData({ ...formData, status_notes: e.target.value })}
                placeholder="e.g., Payment received, Payment plan fulfilled, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                rows={3}
              />
            </div>

            <button
              onClick={handleEnableUser}
              disabled={submitting}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Re-enabling...' : 'Re-enable User Account'}
            </button>
          </div>
        </AdminModal>
      )}

      {/* ADMIN MODAL - Disable User */}
      {adminModal.isOpen && adminModal.action === 'disable' && adminModal.invoice && (
        <AdminModal
          title="Disable User Account"
          invoice={adminModal.invoice}
          isOpen={adminModal.isOpen}
          onClose={closeAdminModal}
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">
                <strong>⚠️ Warning:</strong> This will immediately block user access. This is irreversible except through re-enable action.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Disabling
              </label>
              <textarea
                value={formData.status_notes}
                onChange={(e) => setFormData({ ...formData, status_notes: e.target.value })}
                placeholder="e.g., Unpaid invoice, License suspended, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                rows={3}
              />
            </div>

            <button
              onClick={handleDisableUser}
              disabled={submitting}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Disabling...' : 'Disable User Account'}
            </button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

/**
 * Payment Modal Component - Simplified
 */
function PaymentModal({
  invoice,
  isOpen,
  onClose,
  formData,
  setFormData,
  submitting,
  onSubmit,
}: {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Invoice Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Invoice</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Customer</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Total Amount</p>
              <p className="text-sm font-semibold text-gray-900">${parseFloat(invoice.total_amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Due Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            >
              <option value="">Select payment method...</option>
              {PAYMENT_METHODS.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Paid <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-gray-600">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total amount due: ${parseFloat(invoice.total_amount).toFixed(2)}
            </p>
            {formData.amount_paid && parseFloat(formData.amount_paid) < parseFloat(invoice.total_amount) && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Partial payment - remaining: ${(parseFloat(invoice.total_amount) - parseFloat(formData.amount_paid)).toFixed(2)}
              </p>
            )}
          </div>

          {/* Payment Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Details
            </label>
            <textarea
              value={formData.payment_notes}
              onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
              placeholder="e.g., Check #12345, Transaction ID, Reference number, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !formData.payment_method}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {submitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic Admin Modal Component
 */
function AdminModal({
  title,
  invoice,
  isOpen,
  onClose,
  children,
}: {
  title: string;
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Invoice Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Invoice</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Customer</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Amount</p>
              <p className="text-sm font-semibold text-gray-900">${parseFloat(invoice.total_amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Due Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}