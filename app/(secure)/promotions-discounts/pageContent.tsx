'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, MoreVertical, Edit2, Trash2, X, Loader } from 'lucide-react';
import { useThemeContext } from '@/components/ThemeProvider';
import { useTheme } from '@/hooks/useTheme';
import Cookies from 'js-cookie';
import axios from 'axios';
import { toast } from 'react-toastify';

// Type definitions
interface Threshold {
  id?: string;
  quantity: number;
  discount_value: string;
  discount_type: 'percentage' | 'fixed';
  minimum_purchase: string;
}

interface VolumeDiscount {
  id: string;
  business_id: string;
  name: string;
  applies_to_id?: string | number;
  applies_to_type: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  thresholds: Threshold[];
}

interface Promotion {
  id: string;
  business_id: string;
  code: string | null;
  page_id: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  minimum_order_type: 'no_minimum' | 'dollar_amount';
  minimum_amount: string;
  valid_from: string;
  valid_to: string;
  promo_code_required: string | number;
  unlimited_use: string | number;
  display_on_menu: string | number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface Product {
  product_id: string;
  name: string;
  attachment_id?: string;
  title?: string;
  price?: string;
}

interface Brand {
  page_id: string;
  title: string;
}

interface VolumeDiscountsSectionProps {
  volumeDiscounts: VolumeDiscount[];
  expandedVolumeId: string | null;
  setExpandedVolumeId: (id: string | null) => void;
  onCreateNew: () => void;
  onEdit: (discount: VolumeDiscount) => void;
  onDelete: (id: string) => void;
  isDark: boolean;
  accentColor: string;
  getBgColor: () => string;
  getCardBg: () => string;
  getTextColor: () => string;
  getSecondaryText: () => string;
  getTertiaryText: () => string;
  getHoverBg: () => string;
  getBorderColor: () => string;
}

interface PromotionsSectionProps {
  promotions: Promotion[];
  isDark: boolean;
  accentColor: string;
  onAddPromotion: () => void;
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
  getBgColor: () => string;
  getCardBg: () => string;
  getTextColor: () => string;
  getSecondaryText: () => string;
  getTertiaryText: () => string;
  getHoverBg: () => string;
  getBorderColor: () => string;
  getInputBg: () => string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
  isLoading?: boolean;
}

type TabType = 'volume-discounts' | 'promotions' | 'custom-menus';

// Confirmation Modal Component
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDark,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`rounded-lg shadow-xl max-w-sm w-full mx-4 ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p
            className={`${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex gap-3 ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors ${
              isDark
                ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                : 'bg-red-500 hover:bg-red-600 disabled:opacity-50'
            }`}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PricingPage = () => {
  const { isDark } = useTheme();
  const { accentColor } = useThemeContext();
  const [activeTab, setActiveTab] = useState<TabType>('volume-discounts');
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [volumeDiscounts, setVolumeDiscounts] = useState<VolumeDiscount[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentVanityUrl, setCurrentVanityUrl] = useState<string>('');
  const [expandedVolumeId, setExpandedVolumeId] = useState<string | null>(null);
  const [editingVolume, setEditingVolume] = useState<VolumeDiscount | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  
  // Confirmation Modal States
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: '',
    id: '',
    isDeleting: false,
  });
  
  
  const loadingRef = useRef(false);

  useEffect(() => {
    const vanityUrl = Cookies.get('vanity_url');
    if (vanityUrl) {
      setCurrentVanityUrl(vanityUrl);
      
      if (!loadingRef.current) {
        loadingRef.current = true;
        Promise.all([
          loadVolumeDiscounts(vanityUrl),
          loadPromotions(vanityUrl)
        ]).finally(() => {
          loadingRef.current = false;
        });
      }
    }
  }, []);

  const loadVolumeDiscounts = async (vanityUrl: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/business/volume-discounts?business=${vanityUrl}`);
      
      if (response.data.data?.discounts) {
        setVolumeDiscounts(response.data.data.discounts);
      }
    } catch (error) {
      console.error('Error loading volume discounts:', error);
      toast.error('Failed to load volume discounts');
    }
	finally {
      setLoading(false);
    }
  };

  const loadPromotions = async (vanityUrl: string) => {
    try {
      const response = await axios.get(`/api/business/promotions?business=${vanityUrl}`);
      if (response.data.data?.promotions) {
        setPromotions(response.data.data.promotions);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVolumeDiscount = async (id: string) => {
	setConfirmationModal({
      isOpen: true,
      type: 'volume-discount',
      id,
      isDeleting: false,
    });
	/*
    if (window.confirm('Are you sure you want to delete this volume discount?')) {
      try {
        await axios.delete(`/api/business/volume-discounts/${id}?business=${currentVanityUrl}`);
        setVolumeDiscounts(volumeDiscounts.filter(d => d.id !== id));
        toast.success('Volume discount deleted successfully');
      } catch (error) {
        console.error('Error deleting volume discount:', error);
        toast.error('Failed to delete volume discount');
      }
    }*/
  };

  const handleDeletePromotion = async (id: string) => {
    /*if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await axios.delete(`/api/business/promotions/${id}?business=${currentVanityUrl}`);
        setPromotions(promotions.filter(p => p.id !== id));
        toast.success('Promotion deleted successfully');
      } catch (error) {
        console.error('Error deleting promotion:', error);
        toast.error('Failed to delete promotion');
      }
    }*/
	setConfirmationModal({
      isOpen: true,
      type: 'promotion',
      id,
      isDeleting: false,
    });
  };
	const confirmDelete = async () => {
    setConfirmationModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      if (confirmationModal.type === 'volume-discount') {
        await axios.delete(
          `/api/business/volume-discounts?id=${confirmationModal.id}&business=${currentVanityUrl}`
        );
        setVolumeDiscounts(
          volumeDiscounts.filter((d) => d.id !== confirmationModal.id)
        );
        toast.success('Volume discount deleted successfully');
      } else if (confirmationModal.type === 'promotion') {
        await axios.delete(
          `/api/business/promotions?id=${confirmationModal.id}&business=${currentVanityUrl}`
        );
        setPromotions(promotions.filter((p) => p.id !== confirmationModal.id));
        toast.success('Promotion deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(
        confirmationModal.type === 'volume-discount'
          ? 'Failed to delete volume discount'
          : 'Failed to delete promotion'
      );
    } finally {
      setConfirmationModal({
        isOpen: false,
        type: '',
        id: '',
        isDeleting: false,
      });
    }
  };

  const cancelDelete = () => {
    setConfirmationModal({
      isOpen: false,
      type: '',
      id: '',
      isDeleting: false,
    });
  };
  
  
  const getBgColor = () => isDark ? 'bg-gray-950' : 'bg-gray-50';
  const getCardBg = () => isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const getTextColor = () => isDark ? 'text-gray-100' : 'text-gray-900';
  const getSecondaryText = () => isDark ? 'text-gray-400' : 'text-gray-600';
  const getTertiaryText = () => isDark ? 'text-gray-500' : 'text-gray-500';
  const getHoverBg = () => isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  const getBorderColor = () => isDark ? 'border-gray-800' : 'border-gray-200';
  const getInputBg = () => isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getBgColor()}`}>
	{/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={
          confirmationModal.type === 'volume-discount'
            ? 'Delete Volume Discount'
            : 'Delete Promotion'
        }
        message={
          confirmationModal.type === 'volume-discount'
            ? 'Are you sure you want to delete this volume discount? This action cannot be undone.'
            : 'Are you sure you want to delete this promotion? This action cannot be undone.'
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDark={isDark}
        isLoading={confirmationModal.isDeleting}
      />
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
                activeTab === tab ? getTextColor() : getSecondaryText()
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: `var(--accent-color)` }} />
              <p className={getSecondaryText()}>Loading...</p>
            </div>
          </div>
        )}

        {/* Content Sections */}
        {!loading && activeTab === 'volume-discounts' && (
          <VolumeDiscountsSection
            volumeDiscounts={volumeDiscounts}
            expandedVolumeId={expandedVolumeId}
            setExpandedVolumeId={setExpandedVolumeId}
            isDark={isDark}
            accentColor={accentColor}
            onCreateNew={() => {
              setEditingVolume(null);
              setShowVolumeModal(true);
            }}
            onEdit={(discount) => {
              setEditingVolume(discount);
              setShowVolumeModal(true);
            }}
            onDelete={handleDeleteVolumeDiscount}
            getBgColor={getBgColor}
            getCardBg={getCardBg}
            getTextColor={getTextColor}
            getSecondaryText={getSecondaryText}
            getTertiaryText={getTertiaryText}
            getHoverBg={getHoverBg}
            getBorderColor={getBorderColor}
          />
        )}

        {!loading && activeTab === 'promotions' && (
          <PromotionsSection
            promotions={promotions}
            isDark={isDark}
            accentColor={accentColor}
            onAddPromotion={() => {
              setEditingPromotion(null);
              setShowPromotionModal(true);
            }}
            onEdit={(promotion) => {
              setEditingPromotion(promotion);
              setShowPromotionModal(true);
            }}
            onDelete={handleDeletePromotion}
            getBgColor={getBgColor}
            getCardBg={getCardBg}
            getTextColor={getTextColor}
            getSecondaryText={getSecondaryText}
            getTertiaryText={getTertiaryText}
            getHoverBg={getHoverBg}
            getBorderColor={getBorderColor}
            getInputBg={getInputBg}
          />
        )}

        {!loading && activeTab === 'custom-menus' && (
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
          getCardBg={getCardBg}
          getTextColor={getTextColor}
          getSecondaryText={getSecondaryText}
          getInputBg={getInputBg}
          getBorderColor={getBorderColor}
          onClose={() => {
            setShowVolumeModal(false);
            setEditingVolume(null);
          }}
          onSave={() => {
            setShowVolumeModal(false);
            setEditingVolume(null);
            loadVolumeDiscounts(currentVanityUrl);
          }}
          vanityUrl={currentVanityUrl}
          editingDiscount={editingVolume}
        />
      )}

      {showPromotionModal && (
        <PromotionModal
          isDark={isDark}
          getCardBg={getCardBg}
          getTextColor={getTextColor}
          getSecondaryText={getSecondaryText}
          getInputBg={getInputBg}
          getBorderColor={getBorderColor}
          onClose={() => {
            setShowPromotionModal(false);
            setEditingPromotion(null);
          }}
          onSave={() => {
            setShowPromotionModal(false);
            setEditingPromotion(null);
            loadPromotions(currentVanityUrl);
          }}
          vanityUrl={currentVanityUrl}
          editingPromotion={editingPromotion}
        />
      )}
    </div>
  );
};

// Volume Discounts Section Component
const VolumeDiscountsSection: React.FC<VolumeDiscountsSectionProps> = ({
  volumeDiscounts,
  expandedVolumeId,
  setExpandedVolumeId,
  onCreateNew,
  onEdit,
  onDelete,
  getCardBg,
  getTextColor,
  getSecondaryText,
  getTertiaryText,
  getHoverBg,
  getBorderColor,
}) => {
  return (
    <div className={`${getCardBg()} rounded-xl border`}>
      <div className="p-6 flex items-start justify-between border-b" style={{ borderBottomColor: `var(--border-color)` }}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${getHoverBg()}`}>
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="9" cy="21" r="1" strokeWidth="2"/>
              <circle cx="20" cy="21" r="1" strokeWidth="2"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-bold ${getTextColor()}`}>Volume Discounts</h2>
            <p className={`text-sm ${getSecondaryText()} mt-1`}>Set up volume discounts</p>
          </div>
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-lg"
          style={{ backgroundColor: `var(--accent-color)` }}
        >
          Create new
        </button>
      </div>

      {volumeDiscounts.length === 0 ? (
        <div className="p-8 text-center">
          <p className={getSecondaryText()}>No volume discounts created yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${getBorderColor()}`}>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Summary</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Applies to</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Minimum</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Created on</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Status</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {volumeDiscounts.map((discount: VolumeDiscount) => (
                <React.Fragment key={discount.id}>
                  <tr className={`border-b ${getBorderColor()} ${getHoverBg()}`}>
                    <td className={`px-6 py-4`}>
                      <div>
                        <div className={`font-medium ${getTextColor()}`}>{discount.name}</div>
                        <button
                          onClick={() =>
                            setExpandedVolumeId(expandedVolumeId === discount.id ? null : discount.id)
                          }
                          className="text-blue-500 text-sm hover:underline font-medium"
                        >
                          {expandedVolumeId === discount.id ? 'Hide thresholds' : 'Show thresholds'}
                        </button>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${getSecondaryText()}`}>
                      Product
                    </td>
                    <td className={`px-6 py-4 text-sm ${getSecondaryText()}`}>
                      ${parseFloat(discount.thresholds?.[0]?.minimum_purchase || '0').toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${getSecondaryText()}`}>
                      {new Date(discount.created_at).toLocaleDateString()}
                    </td>
                    <td className={`px-6 py-4`}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            discount.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className={`text-sm ${getSecondaryText()}`}>
                          {discount.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4`}>
                      <VolumeDiscountActions
                        discount={discount}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isDark={true}
                        getTextColor={getTextColor}
                      />
                    </td>
                  </tr>
                  {expandedVolumeId === discount.id && discount.thresholds.length > 0 && (
                    <tr className={`border-b ${getBorderColor()}`}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-3">
                          {discount.thresholds.map((threshold, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border`} style={{ borderColor: `var(--border-color)` }}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className={`text-sm font-medium ${getTextColor()}`}>
                                    {threshold.discount_value}
                                    {threshold.discount_type === 'percentage' ? '%' : '$'} off
                                  </div>
                                  <div className={`text-xs ${getSecondaryText()} mt-1`}>
                                    Quantity: {threshold.quantity} | Min: ${parseFloat(threshold.minimum_purchase).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Volume Discount Actions Component
const VolumeDiscountActions = ({ discount, onEdit, onDelete, isDark, getTextColor }: any) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-1 rounded transition-colors`}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {showMenu && (
        <div
          className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50`}
        >
          <button
            onClick={() => {
              onEdit(discount);
              setShowMenu(false);
            }}
            className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors`}
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(discount.id);
              setShowMenu(false);
            }}
            className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg transition-colors`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// Promotions Section Component
const PromotionsSection: React.FC<PromotionsSectionProps> = ({
  promotions,
  onAddPromotion,
  onEdit,
  onDelete,
  getCardBg,
  getTextColor,
  getSecondaryText,
  getTertiaryText,
  getHoverBg,
  getBorderColor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPromotions = promotions.filter((promo: Promotion) =>
    (promo.code || '—').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`${getCardBg()} rounded-xl border`}>
      <div className="p-6 border-b" style={{ borderBottomColor: `var(--border-color)` }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className={`text-xl font-bold ${getTextColor()}`}>Promotions</h2>
            <p className={`text-sm ${getSecondaryText()} mt-1`}>Manage all your promotions</p>
          </div>
          <button
            onClick={onAddPromotion}
            className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-lg"
            style={{ backgroundColor: `var(--accent-color)` }}
          >
            Add Promotion
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm`}
            style={{
              borderColor: `var(--border-color)`,
              backgroundColor: 'transparent',
              color: 'currentColor'
            }}
          />
          <button className="p-2 rounded-lg" style={{ backgroundColor: `var(--accent-color)` }}>
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>

        <p className={`text-xs ${getSecondaryText()} mt-3`}>
          Showing 1 - {Math.min(filteredPromotions.length, 2)} of {filteredPromotions.length} results
        </p>
      </div>

      {filteredPromotions.length === 0 ? (
        <div className="p-8 text-center">
          <p className={getSecondaryText()}>No promotions created yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${getBorderColor()}`}>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Code</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Brand</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Minimum</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Discount</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Valid from</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Valid to</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${getTertiaryText()}`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromotions.map((promo: Promotion) => (
                <tr key={promo.id} className={`border-b ${getBorderColor()} ${getHoverBg()}`}>
                  <td className={`px-6 py-4 text-sm ${getTextColor()} font-medium`}>
                    {promo.code || '—'}
                  </td>
                  <td className={`px-6 py-4 text-sm ${getSecondaryText()}`}>
                    {promo.page_id || 'N/A'}
                  </td>
                  <td className={`px-6 py-4 text-sm ${getSecondaryText()}`}>
                    {promo.minimum_order_type === 'no_minimum'
                      ? 'No Minimum'
                      : `$${parseFloat(promo.minimum_amount).toFixed(2)}`}
                  </td>
                  <td className={`px-6 py-4 text-sm ${getSecondaryText()}`}>
                    {promo.discount_value}
                    {promo.discount_type === 'percentage' ? '%' : '$'}
                  </td>
                  <td className={`px-6 py-4 text-sm ${getSecondaryText()}`}>
                    {new Date(promo.valid_from).toLocaleDateString()}
                  </td>
                  <td className={`px-6 py-4 text-sm ${getSecondaryText()}`}>
                    {new Date(promo.valid_to).toLocaleDateString()}
                  </td>
                  <td className={`px-6 py-4`}>
                    <PromotionActions
                      promotion={promo}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isDark={true}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Promotion Actions Component
const PromotionActions = ({ promotion, onEdit, onDelete, isDark }: any) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-1 rounded transition-colors`}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {showMenu && (
        <div className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50`}>
          <button
            onClick={() => {
              onEdit(promotion);
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(promotion.id);
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// Custom Menus Section (Placeholder)
const CustomMenusSection = ({ isDark, getCardBg, getTextColor, getSecondaryText }: any) => {
  return (
    <div className={`${getCardBg()} rounded-xl border p-8 text-center`}>
      <h2 className={`text-xl font-bold ${getTextColor()} mb-2`}>Custom Menus</h2>
      <p className={getSecondaryText()}>Custom menus feature coming soon</p>
    </div>
  );
};

// ==================== VOLUME DISCOUNT MODAL ====================
const VolumeDiscountModal = ({
  isDark,
  getCardBg,
  getTextColor,
  getSecondaryText,
  getInputBg,
  getBorderColor,
  onClose,
  onSave,
  vanityUrl,
  editingDiscount,
}: any) => {
  const [name, setName] = useState(editingDiscount?.name || '');
  const [appliesToId, setAppliesToId] = useState(editingDiscount?.applies_to_id || '');
  const [status, setStatus] = useState(editingDiscount?.status || 'active');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [thresholds, setThresholds] = useState<Threshold[]>(
    editingDiscount?.thresholds || [
      { quantity: 1, discount_value: '0', discount_type: 'percentage', minimum_purchase: '0' }
    ]
  );
  const [loading, setLoading] = useState(false);

  // Load products when modal opens
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await axios.get(
        `/api/business/posinventory?business=${vanityUrl}&is_from=product&limit=10000`
      );
      if (response.data.data?.products) {
        setProducts(response.data.data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const addThreshold = () => {
    setThresholds([
      ...thresholds,
      { quantity: 1, discount_value: '0', discount_type: 'percentage', minimum_purchase: '0' }
    ]);
  };

  const removeThreshold = (index: number) => {
    setThresholds(thresholds.filter((_, i) => i !== index));
  };

  const updateThreshold = (index: number, field: string, value: any) => {
    const updated = [...thresholds];
    updated[index] = { ...updated[index], [field]: value };
    setThresholds(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a discount name');
      return;
    }

    if (!appliesToId) {
      toast.error('Please select a product');
      return;
    }

    if (thresholds.length === 0) {
      toast.error('Please add at least one threshold');
      return;
    }

    try {
      setLoading(true);
      const url = editingDiscount
        ? `/api/business/volume-discounts?id=${editingDiscount.id}&business=${vanityUrl}`
        : `/api/business/volume-discounts?business=${vanityUrl}`;

      const method = editingDiscount ? 'put' : 'post';

      const response = await axios[method](url, {
        name,
        applies_to_type: 'product',
        applies_to_id: appliesToId,
		business:`${vanityUrl}`,
        status,
        thresholds
      });

      if (response.data.status === 'success') {
        toast.success(`Volume discount ${editingDiscount ? 'updated' : 'created'} successfully`);
        onSave();
      }
    } catch (error) {
      console.error('Error saving volume discount:', error);
      toast.error('Failed to save volume discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${getCardBg()} rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div
          className="p-6 border-b sticky top-0 z-10 flex items-center justify-between"
          style={{
            backgroundImage: `linear-gradient(135deg, var(--accent-color), var(--accent-hover))`,
            borderBottomColor: 'transparent'
          }}
        >
          <div>
            <h2 className="text-xl font-bold text-white">
              {editingDiscount ? 'Edit Volume Discount' : 'Create Volume Discount'}
            </h2>
            <p className="text-white/80 text-sm mt-1">Set up pricing tiers for volume purchases</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>
                Discount Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 10-Pack Discount"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>
                  Select Product *
                </label>
                {loadingProducts ? (
                  <div className={`w-full px-4 py-2.5 rounded-lg border ${getInputBg()} flex items-center justify-center`}>
                    <span className={getSecondaryText()}>Loading products...</span>
                  </div>
                ) : (
                  <select
                    value={appliesToId}
                    onChange={(e) => setAppliesToId(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Thresholds */}
          <div className="border-t pt-6" style={{ borderTopColor: `var(--border-color)` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${getTextColor()}`}>Pricing Tiers</h3>
              <button
                onClick={addThreshold}
                className="px-3 py-1 rounded text-sm font-medium text-white transition-all hover:shadow-lg"
                style={{ backgroundColor: `var(--accent-color)` }}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Tier
              </button>
            </div>

            <div className="space-y-4">
              {thresholds.map((threshold, index) => (
                <div key={index} className={`p-4 rounded-lg border`} style={{ borderColor: `var(--border-color)` }}>
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <label className={`text-xs font-semibold ${getSecondaryText()} mb-1 block`}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={threshold.quantity}
                        onChange={(e) => updateThreshold(index, 'quantity', parseInt(e.target.value))}
                        min="1"
                        className={`w-full px-3 py-2 rounded border outline-none text-sm transition-colors ${getInputBg()}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs font-semibold ${getSecondaryText()} mb-1 block`}>
                        Discount Value
                      </label>
                      <input
                        type="number"
                        value={threshold.discount_value}
                        onChange={(e) => updateThreshold(index, 'discount_value', e.target.value)}
                        step="0.01"
                        className={`w-full px-3 py-2 rounded border outline-none text-sm transition-colors ${getInputBg()}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs font-semibold ${getSecondaryText()} mb-1 block`}>
                        Type
                      </label>
                      <select
                        value={threshold.discount_type}
                        onChange={(e) => updateThreshold(index, 'discount_type', e.target.value)}
                        className={`w-full px-3 py-2 rounded border outline-none text-sm transition-colors ${getInputBg()}`}
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">$</option>
                      </select>
                    </div>
                    <div>
                      <label className={`text-xs font-semibold ${getSecondaryText()} mb-1 block`}>
                        Min Purchase
                      </label>
                      <input
                        type="number"
                        value={threshold.minimum_purchase}
                        onChange={(e) => updateThreshold(index, 'minimum_purchase', e.target.value)}
                        step="0.01"
                        className={`w-full px-3 py-2 rounded border outline-none text-sm transition-colors ${getInputBg()}`}
                      />
                    </div>
                  </div>
                  {thresholds.length > 1 && (
                    <button
                      onClick={() => removeThreshold(index)}
                      className="text-red-500 text-xs font-medium hover:underline transition-colors"
                    >
                      Remove Tier
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t p-6 flex gap-3 sticky bottom-0`} style={{ borderTopColor: `var(--border-color)` }}>
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
            onClick={handleSave}
            disabled={loading || loadingProducts}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors hover:shadow-lg disabled:opacity-50"
            style={{ backgroundColor: `var(--accent-color)` }}
          >
            {loading ? 'Saving...' : editingDiscount ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== PROMOTION MODAL ====================
const PromotionModal = ({
  isDark,
  getCardBg,
  getTextColor,
  getSecondaryText,
  getInputBg,
  getBorderColor,
  onClose,
  onSave,
  vanityUrl,
  editingPromotion,
}: any) => {
  const [code, setCode] = useState(editingPromotion?.code || '');
  const [noCodeRequired, setNoCodeRequired] = useState(!editingPromotion?.promo_code_required || editingPromotion?.promo_code_required === 0);
  const [pageId, setPageId] = useState(editingPromotion?.page_id || '');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [discountType, setDiscountType] = useState(editingPromotion?.discount_type || 'percentage');
  const [discountValue, setDiscountValue] = useState(editingPromotion?.discount_value || '');
  const [minimumOrderType, setMinimumOrderType] = useState(editingPromotion?.minimum_order_type || 'no_minimum');
  const [minimumAmount, setMinimumAmount] = useState(editingPromotion?.minimum_amount || '');
  const [validFrom, setValidFrom] = useState(editingPromotion?.valid_from || '');
  const [validTo, setValidTo] = useState(editingPromotion?.valid_to || '');
  const [unlimitedUse, setUnlimitedUse] = useState(editingPromotion?.unlimited_use === 1 || editingPromotion?.unlimited_use === '1');
  const [displayOnMenu, setDisplayOnMenu] = useState(editingPromotion?.display_on_menu === 1 || editingPromotion?.display_on_menu === '1');
  const [status, setStatus] = useState(editingPromotion?.status || 'active');
  const [loading, setLoading] = useState(false);

  // Load brands from localStorage when modal opens
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = () => {
    try {
      setLoadingBrands(true);
	  
	  const storedBrands = localStorage.getItem('business');
      if (storedBrands) {
        const parsedBrands = JSON.parse(storedBrands);
		const businessList = Array.isArray(parsedBrands) ? parsedBrands : [parsedBrands];
		
        setBrands(businessList);
      }
    } catch (error) {
      console.error('Error loading brands from localStorage:', error);
      toast.error('Failed to load brands');
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleSave = async () => {
    if (!noCodeRequired && !code.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    if (!pageId) {
      toast.error('Please select a brand');
      return;
    }

    if (!discountValue) {
      toast.error('Please enter discount value');
      return;
    }

    if (!validFrom || !validTo) {
      toast.error('Please select valid dates');
      return;
    }

    if (minimumOrderType === 'dollar_amount' && !minimumAmount) {
      toast.error('Please enter minimum amount');
      return;
    }

    try {
      setLoading(true);
	  
		
      const url = editingPromotion
        ? `/api/business/promotions?id=${editingPromotion.id}&business=${vanityUrl}`
        : `/api/business/promotions?business=${vanityUrl}`;

      const method = editingPromotion ? 'put' : 'post';

      const response = await axios[method](url, {
        code: noCodeRequired ? null : code,
        page_id: pageId,
		business:`${vanityUrl}`,
        discount_type: discountType,
        discount_value: discountValue,
        minimum_order_type: minimumOrderType,
        minimum_amount: minimumOrderType === 'dollar_amount' ? minimumAmount : '0',
        valid_from: validFrom,
        valid_to: validTo,
        promo_code_required: noCodeRequired ? 0 : 1,
        unlimited_use: unlimitedUse ? 1 : 0,
        display_on_menu: displayOnMenu ? 1 : 0,
        status
      });

      if (response.data.status === 'success') {
        toast.success(`Promotion ${editingPromotion ? 'updated' : 'created'} successfully`);
        onSave();
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('Failed to save promotion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${getCardBg()} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div
          className="p-6 border-b sticky top-0 z-10 flex items-center justify-between"
          style={{
            backgroundImage: `linear-gradient(135deg, var(--accent-color), var(--accent-hover))`,
            borderBottomColor: 'transparent'
          }}
        >
          <div>
            <h2 className="text-xl font-bold text-white">
              {editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
            </h2>
            <p className="text-white/80 text-sm mt-1">Set up a store promotion with flexible options</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Brand *</label>
              {loadingBrands ? (
                <div className={`w-full px-4 py-2.5 rounded-lg border ${getInputBg()} flex items-center justify-center`}>
                  <span className={getSecondaryText()}>Loading brands...</span>
                </div>
              ) : (
                <select
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
                >
                  <option value="">Select a brand</option>
                  {brands.map((brand) => (
                    <option key={brand.page_id} value={brand.page_id}>
                      {brand.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={noCodeRequired}
                placeholder="Promo code"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()} disabled:opacity-50`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="no-code"
              checked={noCodeRequired}
              onChange={(e) => setNoCodeRequired(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="no-code" className={`text-sm cursor-pointer ${getSecondaryText()}`}>
              No Promo Code Required
            </label>
          </div>

          {/* Discount Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Amount *</label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
              />
            </div>
          </div>

          {/* Minimum Order */}
          <div>
            <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Order Minimum *</label>
            <select
              value={minimumOrderType}
              onChange={(e) => setMinimumOrderType(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
            >
              <option value="no_minimum">No Minimum</option>
              <option value="dollar_amount">Dollar Amount</option>
            </select>
          </div>

          {minimumOrderType === 'dollar_amount' && (
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Minimum Amount *</label>
              <input
                type="number"
                value={minimumAmount}
                onChange={(e) => setMinimumAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>Start Date *</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${getTextColor()} mb-2`}>End Date *</label>
              <input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${getInputBg()}`}
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-4 border-t" style={{ borderTopColor: `var(--border-color)` }}>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="unlimited"
                checked={unlimitedUse}
                onChange={(e) => setUnlimitedUse(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="unlimited" className={`text-sm cursor-pointer ${getSecondaryText()}`}>
                Unlimited use per customer
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="display"
                checked={displayOnMenu}
                onChange={(e) => setDisplayOnMenu(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="display" className={`text-sm cursor-pointer ${getSecondaryText()}`}>
                Display on brand menu
              </label>
            </div>
            <div className="flex items-center gap-2">
              <label className={`text-sm font-semibold ${getTextColor()}`}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`flex-1 px-3 py-2 rounded border outline-none text-sm transition-colors ${getInputBg()}`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t p-6 flex gap-3 sticky bottom-0`} style={{ borderTopColor: `var(--border-color)` }}>
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
            onClick={handleSave}
            disabled={loading || loadingBrands}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors hover:shadow-lg disabled:opacity-50"
            style={{ backgroundColor: `var(--accent-color)` }}
          >
            {loading ? 'Saving...' : editingPromotion ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;