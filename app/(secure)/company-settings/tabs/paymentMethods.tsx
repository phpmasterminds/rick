'use client';

import React, { useState } from 'react';
import { CreditCard, Plus, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface Location {
  name: string;
  paymentOptions: string[];
}

interface UserListPageProps {
  business: string;
}

export default function PaymentMethods({ business }: UserListPageProps) {
  const { isDark } = useTheme();
  const [activeLocation, setActiveLocation] = useState<number>(0);

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

  const [locations, setLocations] = useState<Location[]>([
    {
      name: 'Location 1',
      paymentOptions: ['Credit Card', 'Debit Card', 'Cash', 'ACH Transfer', 'Wire Transfer', 'Check']
    },
    {
      name: 'Location 2',
      paymentOptions: ['Credit Card', 'Debit Card', 'ACH Transfer', 'Check']
    }
  ]);

  const [newPayment, setNewPayment] = useState<string>('');

  const addPaymentOption = (locationIndex: number): void => {
    if (newPayment.trim()) {
      const updated = [...locations];
      if (!updated[locationIndex].paymentOptions.includes(newPayment.trim())) {
        updated[locationIndex].paymentOptions.push(newPayment.trim());
        setLocations(updated);
      }
      setNewPayment('');
    }
  };

  const togglePaymentOption = (locationIndex: number, option: string): void => {
    const updated = [...locations];
    const index = updated[locationIndex].paymentOptions.indexOf(option);
    if (index > -1) {
      updated[locationIndex].paymentOptions.splice(index, 1);
    } else {
      updated[locationIndex].paymentOptions.push(option);
    }
    setLocations(updated);
  };

  const currentLocation = locations[activeLocation];

  return (
    <div className={`min-h-screen p-8 transition-colors duration-200 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto">
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
            {currentLocation.paymentOptions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availablePaymentMethods
                  .filter(method => currentLocation.paymentOptions.includes(method))
                  .map((method, index) => (
                    <button
                      key={index}
                      onClick={() => togglePaymentOption(activeLocation, method)}
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
                .filter(method => !currentLocation.paymentOptions.includes(method))
                .map((method, index) => (
                  <button
                    key={index}
                    onClick={() => togglePaymentOption(activeLocation, method)}
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
                onKeyPress={(e) => e.key === 'Enter' && addPaymentOption(activeLocation)}
                placeholder="e.g., Invoice, Store Credit..."
                className={`flex-1 px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none ${
                  isDark
                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                }`}
              />
              <button
                onClick={() => addPaymentOption(activeLocation)}
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
          <button className="px-10 py-3 accent-bg text-white rounded-lg font-semibold text-lg transition-all hover:opacity-90 transform hover:-translate-y-0.5 shadow-md">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}