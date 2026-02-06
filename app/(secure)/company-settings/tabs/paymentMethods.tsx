'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Plus, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import axios from 'axios';
import { toast } from 'react-toastify';

interface UserListPageProps {
  business: string;
}

export default function PaymentMethods({ business }: UserListPageProps) {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const hasFetched = useRef<boolean>(false); // Track if data has been fetched

  const availablePaymentMethods: string[] = [
    'Credit Card',
    'Debit Card',
    'Cash',
    'ACH Transfer',
    'Wire Transfer',
    'Check',
    'PayPal',
    'Venmo',
    'Apple Pay',
    'Google Pay',
    'Cryptocurrency'
  ];

  const [paymentOptions, setPaymentOptions] = useState<string[]>([
    'Credit Card',
    'Debit Card',
    'Cash',
    'ACH Transfer',
    'Wire Transfer',
    'Check'
  ]);

  const [newPayment, setNewPayment] = useState<string>('');

  // Fetch payment methods on component mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      // Skip if already fetched or no business ID
      if (hasFetched.current || !business) {
        if (!business) setIsLoading(false);
        return;
      }

      // Mark as fetched immediately to prevent duplicate calls
      hasFetched.current = true;

      try {
        setIsLoading(true);
        const response = await axios.get(
          `/api/business/settings/company?business=${business}&ipage=payment_methods`,
          {
            timeout: 10000,
          }
        );

        console.log('Payment methods API response:', response.data);

        // Handle nested response structure
        if (response.data.success && response.data.data?.status === 'success' && response.data.data?.data) {
          const apiData = response.data.data.data;
          
          // Update payment methods if data exists
          if (apiData.payment_methods) {
            // Parse if it's a JSON string, otherwise use as-is
            const parsedMethods = typeof apiData.payment_methods === 'string' 
              ? JSON.parse(apiData.payment_methods) 
              : apiData.payment_methods;
            
            console.log('Parsed payment methods:', parsedMethods);
            
            // Update payment options with API data
            if (Array.isArray(parsedMethods)) {
              setPaymentOptions(parsedMethods);
            }
          }
          
          toast.success('Payment methods loaded successfully');
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        const errorMsg =
          axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : 'Failed to load payment methods';
        toast.error(errorMsg);
        // Reset flag on error so retry is possible
        hasFetched.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [business]);

  const addPaymentOption = (): void => {
    if (newPayment.trim()) {
      if (!paymentOptions.includes(newPayment.trim())) {
        // Add to the top of the array
        setPaymentOptions([newPayment.trim(), ...paymentOptions]);
      }
      setNewPayment('');
    }
  };

  const togglePaymentOption = (option: string): void => {
    if (paymentOptions.includes(option)) {
      setPaymentOptions(paymentOptions.filter(item => item !== option));
    } else {
      // Add to the top when selecting from available options
      setPaymentOptions([option, ...paymentOptions]);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!business) {
      toast.error('Business ID not found');
      return;
    }

    try {
      setIsSaving(true);
      
      // Prepare data for API
      const dataToSave = {
        payment_methods: paymentOptions,
        businessId: business,
        ipage: 'payment_methods'
      };

      console.log('Saving payment methods:', dataToSave);

      const response = await axios.put(
        `/api/business/settings/company?business=${business}`, 
        dataToSave,
        {
          timeout: 10000,
        }
      );

      if (response.data.success) {
        toast.success('Payment methods updated successfully');
      }
    } catch (error) {
      console.error('Error saving payment methods:', error);
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to save payment methods';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className={`text-4xl font-bold mb-3 transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Payment Options
          </h1>
          <p className={`text-lg transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Configure accepted payment methods for your business
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={`rounded-lg border shadow-sm transition-colors duration-200 p-12 flex flex-col items-center justify-center ${
            isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading payment methods...
            </p>
          </div>
        )}

        {/* Content - Hidden while loading */}
        {!isLoading && (
          <>
            {/* Payment Methods Card */}
        <div className={`rounded-lg border shadow-sm transition-colors duration-200 p-8 ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`p-3 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <CreditCard size={24} className="accent-text" />
            </div>
            <h2 className={`text-2xl font-semibold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Accepted Payment Methods
            </h2>
          </div>

          {/* Selected Payment Methods */}
          <div className="mb-8">
            <p className={`text-sm font-medium mb-4 transition-colors duration-200 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Currently selected payment methods
            </p>
            {paymentOptions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentOptions.map((method, index) => (
                  <button
                    key={index}
                    onClick={() => togglePaymentOption(method)}
                    className={`px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-3 border-2 ${
                      isDark
                        ? 'bg-gray-700 border-teal-500/50 text-gray-100 hover:border-teal-400 hover:bg-gray-600'
                        : 'bg-teal-50 border-teal-500 text-teal-900 hover:border-teal-600 hover:bg-teal-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all accent-bg border-transparent`}>
                      <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="flex-1 text-left">{method}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className={`text-sm italic transition-colors duration-200 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                No payment methods selected
              </p>
            )}
          </div>

          {/* Divider */}
          <div className={`border-t my-8 transition-colors ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>

          {/* Available Payment Methods */}
          <div className="mb-8">
            <p className={`text-sm font-medium mb-3 transition-colors duration-200 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Add payment methods from available options
            </p>
            <div className="flex flex-wrap gap-2">
              {availablePaymentMethods
                .filter(method => !paymentOptions.includes(method))
                .map((method, index) => (
                  <button
                    key={index}
                    onClick={() => togglePaymentOption(method)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      isDark
                        ? 'bg-gray-700 border border-gray-600 text-gray-300 hover:border-teal-500/50 hover:bg-gray-600 hover:text-teal-300'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    + {method}
                  </button>
                ))}
            </div>
          </div>

          {/* Custom Payment Method */}
          <div className={`pt-8 border-t transition-colors ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm font-medium mb-4 transition-colors duration-200 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Or add a custom payment method
            </p>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                type="text"
                value={newPayment}
                onChange={(e) => setNewPayment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPaymentOption()}
                placeholder="e.g., Invoice, Store Credit..."
                className={`flex-1 px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none ${
                  isDark
                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                }`}
              />
              <button
                onClick={addPaymentOption}
                className="px-6 py-3 accent-bg text-white rounded-lg font-medium transition-all hover:opacity-90 transform hover:-translate-y-0.5 shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-10 py-3 accent-bg text-white rounded-lg font-semibold text-lg transition-all shadow-md ${
              isSaving 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:opacity-90 transform hover:-translate-y-0.5'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}