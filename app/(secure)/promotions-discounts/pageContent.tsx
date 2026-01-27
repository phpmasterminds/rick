'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, AlertCircle, ShoppingCart, Zap, Package } from 'lucide-react';
import { useThemeContext } from '@/components/ThemeProvider';
import { useTheme } from '@/hooks/useTheme';
import Cookies from 'js-cookie';

// Type definitions
interface VolumeDiscount {
  id: string;
  name: string;
  appliesToType: string; // e.g., "10-Pack Prerolls", "29 Products"
  minimum: number;
  thresholds: Array<{ quantity: number; discount: number }>;
  status: 'active' | 'inactive';
  createdOn: string;
}

interface Promotion {
  id: string;
  code: string;
  brand: string;
  minimum: number;
  discount: string; // e.g., "10.00%"
  validFrom: string;
  validTo: string;
  usage?: string;
  visibility?: boolean;
}

type TabType = 'volume-discounts' | 'promotions' | 'custom-menus';

const PricingPage = () => {
  const { isDark } = useTheme();
  const { accentColor } = useThemeContext();
  const [activeTab, setActiveTab] = useState<TabType>('volume-discounts');
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  // Sample data
  const [volumeDiscounts] = useState<VolumeDiscount[]>([
    {
      id: '1',
      name: '10PackVolumeDiscount',
      appliesToType: '10-Pack Prerolls, 29 Products',
      minimum: 250,
      thresholds: [{ quantity: 10, discount: 5 }],
      status: 'inactive',
      createdOn: '01/20/2024',
    },
  ]);

  const [promotions] = useState<Promotion[]>([
    {
      id: '1',
      code: '—',
      brand: 'Red Dirt Budz',
      minimum: 300,
      discount: '10.00%',
      validFrom: '2025-10-14',
      validTo: '2025-10-31',
    },
    {
      id: '2',
      code: 'DEC25',
      brand: 'Red Dirt Budz',
      minimum: 0,
      discount: '10.00%',
      validFrom: '2025-12-01',
      validTo: '2025-12-31',
    },
  ]);

  // Get CSS classes for theme
  const getBgColor = () => {
    return isDark ? 'bg-gray-950' : 'bg-gray-50';
  };

  const getCardBg = () => {
    return isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  };

  const getTextColor = () => {
    return isDark ? 'text-gray-100' : 'text-gray-900';
  };

  const getSecondaryText = () => {
    return isDark ? 'text-gray-400' : 'text-gray-600';
  };

  const getInputBg = () => {
    return isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900';
  };

  const getHoverBg = () => {
    return isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getBgColor()}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} sticky top-0 z-40 backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${getTextColor()}`}>Pricing</h1>
                <p className={`mt-1 text-sm ${getSecondaryText()}`}>
                  Set up custom menus, volume discounts and promo codes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className={`flex gap-6 pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} mb-8`}>
          {(['volume-discounts', 'promotions', 'custom-menus'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-medium text-sm transition-colors relative ${
                activeTab === tab
                  ? `${getTextColor()}`
                  : getSecondaryText()
              }`}
            >
              {tab === 'volume-discounts' && 'Volume Discounts'}
              {tab === 'promotions' && 'Promotions'}
              {tab === 'custom-menus' && 'Custom Menus'}

              {activeTab === tab && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 accent-bg`}
                  style={{ backgroundColor: `var(--accent-color)` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeTab === 'volume-discounts' && (
          <VolumeDiscountsSection
            volumeDiscounts={volumeDiscounts}
            isDark={isDark}
            accentColor={accentColor}
            onCreateNew={() => setShowVolumeModal(true)}
            getBgColor={getBgColor}
            getCardBg={getCardBg}
            getTextColor={getTextColor}
            getSecondaryText={getSecondaryText}
            getHoverBg={getHoverBg}
          />
        )}

        {activeTab === 'promotions' && (
          <PromotionsSection
            promotions={promotions}
            isDark={isDark}
            accentColor={accentColor}
            onAddPromotion={() => setShowPromotionModal(true)}
            getBgColor={getBgColor}
            getCardBg={getCardBg}
            getTextColor={getTextColor}
            getSecondaryText={getSecondaryText}
            getInputBg={getInputBg}
            getHoverBg={getHoverBg}
          />
        )}

        {activeTab === 'custom-menus' && (
          <CustomMenusSection
            isDark={isDark}
            getCardBg={getCardBg}
            getTextColor={getTextColor}
            getSecondaryText={getSecondaryText}
          />
        )}
      </div>

      {/* Modals */}
      {showVolumeModal && (
        <VolumeDiscountModal
          isDark={isDark}
          accentColor={accentColor}
          onClose={() => setShowVolumeModal(false)}
          getCardBg={getCardBg}
          getTextColor={getTextColor}
          getSecondaryText={getSecondaryText}
          getInputBg={getInputBg}
        />
      )}

      {showPromotionModal && (
        <PromotionModal
          isDark={isDark}
          accentColor={accentColor}
          onClose={() => setShowPromotionModal(false)}
          getCardBg={getCardBg}
          getTextColor={getTextColor}
          getSecondaryText={getSecondaryText}
          getInputBg={getInputBg}
        />
      )}
    </div>
  );
};

// Volume Discounts Section
const VolumeDiscountsSection = ({
  volumeDiscounts,
  isDark,
  accentColor,
  onCreateNew,
  getBgColor,
  getCardBg,
  getTextColor,
  getSecondaryText,
  getHoverBg,
}: any) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}
            style={!isDark ? { backgroundColor: `${accentColor}20` } : {}}
          >
            <ShoppingCart
              size={24}
              style={{ color: `var(--accent-color)` }}
            />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${getTextColor()}`}>Volume Discounts</h2>
            <p className={`text-sm ${getSecondaryText()}`}>Set up volume discounts</p>
          </div>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white transition-all hover:shadow-lg"
          style={{ backgroundColor: `var(--accent-color)` }}
        >
          <Plus size={18} />
          <span className="font-medium">Create new</span>
        </button>
      </div>

      {volumeDiscounts.length > 0 ? (
        <div className={`border rounded-lg overflow-hidden ${getCardBg()}`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Summary</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Applies to</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Minimum</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Created on</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Status</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {volumeDiscounts.map((discount: VolumeDiscount) => (
                <tr
                  key={discount.id}
                  className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} ${getHoverBg()} transition-colors`}
                >
                  <td className={`px-6 py-4 ${getTextColor()}`}>
                    <span className="font-medium">{discount.name}</span>
                    <a
                      href="#"
                      className="block text-xs mt-1"
                      style={{ color: `var(--accent-color)` }}
                    >
                      Show thresholds
                    </a>
                  </td>
                  <td className={`px-6 py-4 ${getSecondaryText()} text-sm`}>{discount.appliesToType}</td>
                  <td className={`px-6 py-4 ${getSecondaryText()} text-sm`}>${discount.minimum.toFixed(2)}</td>
                  <td className={`px-6 py-4 ${getSecondaryText()} text-sm`}>{discount.createdOn}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        discount.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          discount.status === 'active' ? 'bg-red-500' : 'bg-red-500'
                        }`}
                      />
                      {discount.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className={`${getSecondaryText()} ${getHoverBg()} p-2 rounded-lg transition-colors`}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          isDark={isDark}
          icon={ShoppingCart}
          title="No volume discounts yet"
          description="Create your first volume discount to get started"
          accentColor={accentColor}
        />
      )}
    </div>
  );
};

// Promotions Section
const PromotionsSection = ({
  promotions,
  isDark,
  accentColor,
  onAddPromotion,
  getBgColor,
  getCardBg,
  getTextColor,
  getSecondaryText,
  getInputBg,
  getHoverBg,
}: any) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}
            style={!isDark ? { backgroundColor: `${accentColor}20` } : {}}
          >
            <Zap
              size={24}
              style={{ color: `var(--accent-color)` }}
            />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${getTextColor()}`}>Promotions</h2>
            <p className={`text-sm ${getSecondaryText()}`}>Manage all your promotions</p>
          </div>
        </div>
        <button
          onClick={onAddPromotion}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white transition-all hover:shadow-lg"
          style={{ backgroundColor: `var(--accent-color)` }}
        >
          <Plus size={18} />
          <span className="font-medium">Add Promotion</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${getInputBg()} transition-colors`}>
          <Search size={18} className={getSecondaryText()} />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 outline-none bg-transparent ${getTextColor()} placeholder-gray-400`}
          />
        </div>
      </div>

      {/* Results Info */}
      <p className={`text-sm ${getSecondaryText()} mb-4`}>
        Showing 1 - {promotions.length} of {promotions.length} results
      </p>

      {promotions.length > 0 ? (
        <div className={`border rounded-lg overflow-hidden ${getCardBg()}`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Code</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Brand</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Minimum</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Discount</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Valid from</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Valid to</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${getSecondaryText()} uppercase`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo: Promotion) => (
                <tr
                  key={promo.id}
                  className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} ${getHoverBg()} transition-colors`}
                >
                  <td className={`px-6 py-4 ${getTextColor()} text-sm font-medium`}>{promo.code}</td>
                  <td className={`px-6 py-4 ${getTextColor()} text-sm`}>{promo.brand}</td>
                  <td className={`px-6 py-4 ${getSecondaryText()} text-sm`}>
                    {promo.minimum === 0 ? 'No Minimum' : `$${promo.minimum.toFixed(2)}`}
                  </td>
                  <td className={`px-6 py-4 ${getTextColor()} text-sm font-medium`}>{promo.discount}</td>
                  <td className={`px-6 py-4 ${getSecondaryText()} text-sm`}>{promo.validFrom}</td>
                  <td className={`px-6 py-4 ${getSecondaryText()} text-sm`}>{promo.validTo}</td>
                  <td className="px-6 py-4">
                    <button className={`${getSecondaryText()} ${getHoverBg()} p-2 rounded-lg transition-colors`}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          isDark={isDark}
          icon={Zap}
          title="No promotions yet"
          description="Create your first promotion to get started"
          accentColor={accentColor}
        />
      )}
    </div>
  );
};

// Custom Menus Section (Coming Soon)
const CustomMenusSection = ({
  isDark,
  getCardBg,
  getTextColor,
  getSecondaryText,
}: any) => {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-orange-50'}`}>
          <Package
            size={24}
            style={{ color: `var(--accent-color)` }}
          />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${getTextColor()}`}>Custom Menus</h2>
          <p className={`text-sm ${getSecondaryText()}`}>Create custom product menus for your business</p>
        </div>
      </div>

      <div className={`border-2 border-dashed rounded-lg p-12 text-center ${getCardBg()}`}>
        <AlertCircle size={48} className={`mx-auto mb-4 ${getSecondaryText()}`} style={{ opacity: 0.5 }} />
        <h3 className={`text-xl font-bold ${getTextColor()} mb-2`}>Coming Soon</h3>
        <p className={`${getSecondaryText()} mb-4 max-w-md mx-auto`}>
          Custom menus will allow you to create specialized product selections for different customer segments and business needs.
        </p>
        <div className={`inline-block px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className={`text-sm font-medium ${getSecondaryText()}`}>🚀 Feature in development</p>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({
  isDark,
  icon: Icon,
  title,
  description,
  accentColor,
}: any) => {
  return (
    <div className={`border-2 border-dashed rounded-lg p-12 text-center`}>
      <Icon size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      <h3 className={`text-lg font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{title}</h3>
      <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{description}</p>
    </div>
  );
};

// Volume Discount Modal
const VolumeDiscountModal = ({
  isDark,
  accentColor,
  onClose,
  getCardBg,
  getTextColor,
  getSecondaryText,
  getInputBg,
}: any) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${getCardBg()} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`bg-gradient-to-r p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`} style={{
          backgroundImage: `linear-gradient(135deg, var(--accent-color), var(--accent-hover))`
        }}>
          <h2 className="text-xl font-bold text-white">Create New Discount</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>
              Name (optional)
            </label>
            <input
              type="text"
              placeholder="Discount name"
              className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors focus:ring-2 ${getInputBg()}`}
              style={{ '--tw-ring-color': `var(--accent-color)20` } as React.CSSProperties}
            />
            <p className={`text-xs ${getSecondaryText()} mt-1`}>
              We will auto-generate a name for this volume discount if you leave this field blank
            </p>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>
              Applies to *
            </label>
            <select className={`w-full px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}>
              <option>Select option</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>
                Value of Discount *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="0.00"
                  className={`flex-1 px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}
                />
                <select className={`px-4 py-2.5 rounded-lg border ${getInputBg()}`}>
                  <option>%</option>
                  <option>$</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>
                Minimum Purchase *
              </label>
              <div className="flex gap-2">
                <span className={`flex items-center px-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className={`flex-1 px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              className="text-sm font-medium"
              style={{ color: `var(--accent-color)` }}
            >
              + Add new threshold
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderTopColor: isDark ? '#1f2937' : '#e5e7eb' }}>
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors hover:shadow-lg"
              style={{ backgroundColor: `var(--accent-color)` }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Promotion Modal
const PromotionModal = ({
  isDark,
  accentColor,
  onClose,
  getCardBg,
  getTextColor,
  getSecondaryText,
  getInputBg,
}: any) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${getCardBg()} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`bg-gradient-to-r p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`} style={{
          backgroundImage: `linear-gradient(135deg, var(--accent-color), var(--accent-hover))`
        }}>
          <h2 className="text-xl font-bold text-white">Promotions</h2>
          <p className="text-white/80 text-sm mt-1">Interested in setting up a store promotion? Simply use the form below.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Brand</label>
              <select className={`w-full px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}>
                <option>Select option</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Code</label>
              <input
                type="text"
                placeholder="Promo code"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="no-code" className="w-4 h-4 rounded" />
            <label htmlFor="no-code" className={`text-sm ${getSecondaryText()}`}>
              No Promo Code Required
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Discount Type</label>
              <select className={`w-full px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}>
                <option>Select option</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Amount</label>
              <input
                type="number"
                placeholder="0.00"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Order Minimum</label>
            <select className={`w-full px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}>
              <option>No Minimum</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Minimum</label>
            <input
              type="number"
              placeholder="0.00"
              className={`w-full px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Start Date</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>End Date</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none ${getInputBg()}`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="unlimited" className="w-4 h-4 rounded" />
              <label htmlFor="unlimited" className={`text-sm ${getSecondaryText()}`}>
                Unlimited use per customer/retailer
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="display" className="w-4 h-4 rounded" />
              <label htmlFor="display" className={`text-sm ${getSecondaryText()}`}>
                Display on brand menu
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderTopColor: isDark ? '#1f2937' : '#e5e7eb' }}>
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors hover:shadow-lg"
              style={{ backgroundColor: `var(--accent-color)` }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;