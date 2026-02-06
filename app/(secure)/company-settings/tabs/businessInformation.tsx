'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, Info, Globe, ShoppingBag, Bold, Italic, Underline, Type, Palette, ChevronDown, Eye, EyeOff, LucideIcon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import axios from 'axios';
import { toast } from 'react-toastify';

interface HoursDay {
  open: string;
  close: string;
  closed: boolean;
  display: boolean;
}

interface Hours {
  monday: HoursDay;
  tuesday: HoursDay;
  wednesday: HoursDay;
  thursday: HoursDay;
  friday: HoursDay;
  saturday: HoursDay;
  sunday: HoursDay;
}

interface FontSize {
  label: string;
  value: string;
}

interface Color {
  label: string;
  value: string;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface UserListPageProps {
  business: string;
}

export default function BusinessInformation({ business }: UserListPageProps) {
  const { isDark } = useTheme();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const hasFetched = useRef<boolean>(false); // Track if data has been fetched
  const publicTextareaRef = useRef<HTMLDivElement>(null);
  const marketplaceTextareaRef = useRef<HTMLDivElement>(null);
  const publicFontSizeRef = useRef<HTMLDivElement>(null);
  const publicColorRef = useRef<HTMLDivElement>(null);
  const marketplaceFontSizeRef = useRef<HTMLDivElement>(null);
  const marketplaceColorRef = useRef<HTMLDivElement>(null);
  
  const [showPublicFontSize, setShowPublicFontSize] = useState<boolean>(false);
  const [showPublicColor, setShowPublicColor] = useState<boolean>(false);
  const [showMarketplaceFontSize, setShowMarketplaceFontSize] = useState<boolean>(false);
  const [showMarketplaceColor, setShowMarketplaceColor] = useState<boolean>(false);

  const fontSizes: FontSize[] = [
    { label: 'Small', value: '14px' },
    { label: 'Normal', value: '16px' },
    { label: 'Large', value: '20px' },
    { label: 'Extra Large', value: '24px' }
  ];

  const colors: Color[] = [
    { label: 'Black', value: '#000000' },
    { label: 'Gray', value: '#6B7280' },
    { label: 'Red', value: '#DC2626' },
    { label: 'Orange', value: '#EA580C' },
    { label: 'Green', value: '#16A34A' },
    { label: 'Blue', value: '#2563EB' },
    { label: 'Purple', value: '#9333EA' },
    { label: 'Pink', value: '#DB2777' }
  ];

  const [hours, setHours] = useState<Hours>({
    monday: { open: '09:00', close: '17:00', closed: false, display: true },
    tuesday: { open: '09:00', close: '17:00', closed: false, display: true },
    wednesday: { open: '09:00', close: '17:00', closed: false, display: true },
    thursday: { open: '09:00', close: '17:00', closed: false, display: true },
    friday: { open: '09:00', close: '17:00', closed: false, display: true },
    saturday: { open: '10:00', close: '14:00', closed: false, display: true },
    sunday: { open: '', close: '', closed: true, display: true }
  });

  const [aboutUsPublic, setAboutUsPublic] = useState<string>('Public-facing information about this location...');
  const [aboutUsMarketplace, setAboutUsMarketplace] = useState<string>('Marketplace-specific information about this location...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Fetch business information on component mount
  useEffect(() => {
    const fetchBusinessInfo = async () => {
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
          `/api/business/settings/company?business=${business}&ipage=business_information`,
          {
            timeout: 10000,
          }
        );

        // Handle nested response structure: response.data.data.data
        if (response.data.success && response.data.data?.status === 'success' && response.data.data?.data) {
          const { aboutus_public, aboutus_marketplace, hours: hoursData } = response.data.data.data;

          console.log('Loaded business data:', {
            aboutus_public,
            aboutus_marketplace,
            hours: hoursData
          });

          // Update aboutus fields
          if (aboutus_public) {
            setAboutUsPublic(aboutus_public);
          }
          if (aboutus_marketplace) {
            setAboutUsMarketplace(aboutus_marketplace);
          }

          // Parse and update hours if available
          if (hoursData) {
            try {
              const parsedHours = typeof hoursData === 'string' ? JSON.parse(hoursData) : hoursData;
              console.log('Parsed hours:', parsedHours);
              setHours(parsedHours);
            } catch (parseError) {
              console.error('Error parsing hours data:', parseError);
              toast.error('Failed to parse business hours data');
            }
          }
          
          toast.success('Business information loaded successfully');
        } else {
          console.warn('Unexpected API response structure:', response.data);
        }
      } catch (error) {
        console.error('Error fetching business information:', error);
        const errorMsg =
          axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : 'Failed to load business information';
        toast.error(errorMsg);
        // Reset flag on error so retry is possible
        hasFetched.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessInfo();
  }, [business]);

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check public font size dropdown
      if (publicFontSizeRef.current && !publicFontSizeRef.current.contains(event.target as Node)) {
        setShowPublicFontSize(false);
      }
      // Check public color dropdown
      if (publicColorRef.current && !publicColorRef.current.contains(event.target as Node)) {
        setShowPublicColor(false);
      }
      // Check marketplace font size dropdown
      if (marketplaceFontSizeRef.current && !marketplaceFontSizeRef.current.contains(event.target as Node)) {
        setShowMarketplaceFontSize(false);
      }
      // Check marketplace color dropdown
      if (marketplaceColorRef.current && !marketplaceColorRef.current.contains(event.target as Node)) {
        setShowMarketplaceColor(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize contentEditable divs when data changes
  useEffect(() => {
    if (publicTextareaRef.current && !isLoading) {
      const currentContent = publicTextareaRef.current.innerHTML;
      if (currentContent !== aboutUsPublic) {
        console.log('Updating public textarea with:', aboutUsPublic);
        publicTextareaRef.current.innerHTML = aboutUsPublic;
      }
    }
  }, [aboutUsPublic, isLoading]);

  useEffect(() => {
    if (marketplaceTextareaRef.current && !isLoading) {
      const currentContent = marketplaceTextareaRef.current.innerHTML;
      if (currentContent !== aboutUsMarketplace) {
        console.log('Updating marketplace textarea with:', aboutUsMarketplace);
        marketplaceTextareaRef.current.innerHTML = aboutUsMarketplace;
      }
    }
  }, [aboutUsMarketplace, isLoading]);

  const updateHours = (day: DayOfWeek, field: 'open' | 'close', value: string): void => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const toggleClosed = (day: DayOfWeek): void => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed
      }
    }));
  };

  const toggleDisplay = (day: DayOfWeek): void => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        display: !prev[day].display
      }
    }));
  };

  const applyFormatting = (field: string, command: string, value: string | undefined = undefined): void => {
    if (value) {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false, undefined);
    }
  };

  const applyFontSize = (field: string, size: string): void => {
    document.execCommand('fontSize', false, '7');
    const fontElements = document.getElementsByTagName('font');
    for (let i = 0; i < fontElements.length; i++) {
      if (fontElements[i].size === '7') {
        fontElements[i].removeAttribute('size');
        fontElements[i].style.fontSize = size;
      }
    }
  };

  const applyColor = (field: string, color: string): void => {
    document.execCommand('foreColor', false, color);
  };

  const handleContentChange = (field: 'aboutUsPublic' | 'aboutUsMarketplace', e: React.FormEvent<HTMLDivElement>): void => {
    const content = e.currentTarget.innerHTML;
    if (field === 'aboutUsPublic') {
      setAboutUsPublic(content);
    } else {
      setAboutUsMarketplace(content);
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
        hours: hours,
        aboutUsPublic: aboutUsPublic,
        aboutUsMarketplace: aboutUsMarketplace,
        businessId: business,
        ipage: 'business_information'
      };

      const response = await axios.put(
        `/api/business/settings/company?business=${business}`, 
        dataToSave,
        {
          timeout: 10000,
        }
      );

      if (response.data.success) {
        toast.success('Business information updated successfully');
      }
    } catch (error) {
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to update business information';
      toast.error(errorMsg);
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Loading State */}
      {isLoading && (
        <div className={`mb-8 rounded-lg border transition-colors p-12 flex flex-col items-center justify-center ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading business information...
          </p>
        </div>
      )}

      {/* Content - Hidden while loading */}
      {!isLoading && (
        <>
          {/* About Us - Public Section */}
      <div className={`mb-8 rounded-lg border transition-colors p-6 ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg transition-colors ${
            isDark
              ? 'bg-gray-700'
              : 'bg-gray-100'
          }`}>
            <Globe size={24} className="accent-text" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              About Us - Public
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Information displayed to customers
            </p>
          </div>
        </div>

        {/* Public Toolbar */}
        <div className={`flex flex-wrap gap-2 p-3 rounded-lg mb-3 border transition-colors ${
          isDark
            ? 'bg-gray-700 border-gray-600'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <button
            onClick={() => applyFormatting('aboutUsPublic', 'bold')}
            className={`p-2 rounded-lg transition-all border-2 border-transparent ${
              isDark
                ? 'hover:bg-gray-600'
                : 'hover:bg-gray-100'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={18} className="accent-text" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => applyFormatting('aboutUsPublic', 'italic')}
            className={`p-2 rounded-lg transition-all border-2 border-transparent ${
              isDark
                ? 'hover:bg-gray-600'
                : 'hover:bg-gray-100'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={18} className="accent-text" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => applyFormatting('aboutUsPublic', 'underline')}
            className={`p-2 rounded-lg transition-all border-2 border-transparent ${
              isDark
                ? 'hover:bg-gray-600'
                : 'hover:bg-gray-100'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline size={18} className="accent-text" strokeWidth={2.5} />
          </button>

          <div className={`h-6 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'} mx-1`}></div>

          {/* Font Size Dropdown */}
          <div className="relative" ref={publicFontSizeRef}>
            <button
              onClick={() => setShowPublicFontSize(!showPublicFontSize)}
              className={`p-2 rounded-lg transition-all border-2 border-transparent flex items-center gap-1 ${
                isDark
                  ? 'hover:bg-gray-600'
                  : 'hover:bg-gray-100'
              }`}
              title="Font Size"
            >
              <Type size={18} className="accent-text" strokeWidth={2.5} />
              <ChevronDown size={14} className="accent-text" />
            </button>
            {showPublicFontSize && (
              <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-lg z-10 min-w-[140px] border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-white border-gray-200'
              }`}>
                {fontSizes.map((size, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      applyFontSize('aboutUsPublic', size.value);
                      setShowPublicFontSize(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      isDark
                        ? 'hover:bg-gray-600 text-gray-200'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Dropdown */}
          <div className="relative" ref={publicColorRef}>
            <button
              onClick={() => setShowPublicColor(!showPublicColor)}
              className={`p-2 rounded-lg transition-all border-2 border-transparent flex items-center gap-1 ${
                isDark
                  ? 'hover:bg-gray-600'
                  : 'hover:bg-gray-100'
              }`}
              title="Text Color"
            >
              <Palette size={18} className="accent-text" strokeWidth={2.5} />
              <ChevronDown size={14} className="accent-text" />
            </button>
            {showPublicColor && (
              <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-lg z-10 min-w-[140px] border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-white border-gray-200'
              }`}>
                {colors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      applyColor('aboutUsPublic', color.value);
                      setShowPublicColor(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      isDark
                        ? 'hover:bg-gray-600 text-gray-200'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }}></div>
                    <span>{color.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`h-6 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'} mx-1`}></div>

          <div className="ml-auto flex items-center gap-2 px-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
              isDark
                ? 'bg-gray-600 text-gray-200'
                : 'bg-white text-gray-700'
            }`}>
              {aboutUsPublic.replace(/<[^>]*>/g, '').length} chars
            </span>
          </div>
        </div>

        {/* Public Editor */}
        <div
          ref={publicTextareaRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => handleContentChange('aboutUsPublic', e)}
          className={`w-full min-h-[300px] px-5 py-4 border-2 rounded-lg transition-colors focus:outline-none leading-relaxed ${
            isDark
              ? 'bg-gray-700 text-white border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
              : 'bg-white text-gray-900 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
          }`}
          style={{
            maxHeight: '500px',
            overflowY: 'auto',
            fontSize: '16px',
            lineHeight: '1.7'
          }}
        />
        <p className={`text-xs mt-2 flex items-center gap-1 ${
          isDark ? 'text-teal-400' : 'text-teal-600'
        }`}>
          <Info size={12} />
          Select text and use the toolbar buttons to format
        </p>
      </div>

      {/* About Us - Marketplace Section */}
      <div className={`mb-8 rounded-lg border transition-colors p-6 ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg transition-colors ${
            isDark
              ? 'bg-gray-700'
              : 'bg-gray-100'
          }`}>
            <ShoppingBag size={24} className="accent-text" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              About Us - Marketplace
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Information displayed on marketplace
            </p>
          </div>
        </div>

        {/* Marketplace Toolbar */}
        <div className={`flex flex-wrap gap-2 p-3 rounded-lg mb-3 border transition-colors ${
          isDark
            ? 'bg-gray-700 border-gray-600'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <button
            onClick={() => applyFormatting('aboutUsMarketplace', 'bold')}
            className={`p-2 rounded-lg transition-all border-2 border-transparent ${
              isDark
                ? 'hover:bg-gray-600'
                : 'hover:bg-gray-100'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={18} className="accent-text" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => applyFormatting('aboutUsMarketplace', 'italic')}
            className={`p-2 rounded-lg transition-all border-2 border-transparent ${
              isDark
                ? 'hover:bg-gray-600'
                : 'hover:bg-gray-100'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={18} className="accent-text" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => applyFormatting('aboutUsMarketplace', 'underline')}
            className={`p-2 rounded-lg transition-all border-2 border-transparent ${
              isDark
                ? 'hover:bg-gray-600'
                : 'hover:bg-gray-100'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline size={18} className="accent-text" strokeWidth={2.5} />
          </button>

          <div className={`h-6 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'} mx-1`}></div>

          {/* Font Size Dropdown */}
          <div className="relative" ref={marketplaceFontSizeRef}>
            <button
              onClick={() => setShowMarketplaceFontSize(!showMarketplaceFontSize)}
              className={`p-2 rounded-lg transition-all border-2 border-transparent flex items-center gap-1 ${
                isDark
                  ? 'hover:bg-gray-600'
                  : 'hover:bg-gray-100'
              }`}
              title="Font Size"
            >
              <Type size={18} className="accent-text" strokeWidth={2.5} />
              <ChevronDown size={14} className="accent-text" />
            </button>
            {showMarketplaceFontSize && (
              <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-lg z-10 min-w-[140px] border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-white border-gray-200'
              }`}>
                {fontSizes.map((size, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      applyFontSize('aboutUsMarketplace', size.value);
                      setShowMarketplaceFontSize(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      isDark
                        ? 'hover:bg-gray-600 text-gray-200'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Dropdown */}
          <div className="relative" ref={marketplaceColorRef}>
            <button
              onClick={() => setShowMarketplaceColor(!showMarketplaceColor)}
              className={`p-2 rounded-lg transition-all border-2 border-transparent flex items-center gap-1 ${
                isDark
                  ? 'hover:bg-gray-600'
                  : 'hover:bg-gray-100'
              }`}
              title="Text Color"
            >
              <Palette size={18} className="accent-text" strokeWidth={2.5} />
              <ChevronDown size={14} className="accent-text" />
            </button>
            {showMarketplaceColor && (
              <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-lg z-10 min-w-[140px] border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-white border-gray-200'
              }`}>
                {colors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      applyColor('aboutUsMarketplace', color.value);
                      setShowMarketplaceColor(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      isDark
                        ? 'hover:bg-gray-600 text-gray-200'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }}></div>
                    <span>{color.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`h-6 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'} mx-1`}></div>

          <div className="ml-auto flex items-center gap-2 px-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
              isDark
                ? 'bg-gray-600 text-gray-200'
                : 'bg-white text-gray-700'
            }`}>
              {aboutUsMarketplace.replace(/<[^>]*>/g, '').length} chars
            </span>
          </div>
        </div>

        {/* Marketplace Editor */}
        <div
          ref={marketplaceTextareaRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => handleContentChange('aboutUsMarketplace', e)}
          className={`w-full min-h-[300px] px-5 py-4 border-2 rounded-lg transition-colors focus:outline-none leading-relaxed ${
            isDark
              ? 'bg-gray-700 text-white border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
              : 'bg-white text-gray-900 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
          }`}
          style={{
            maxHeight: '500px',
            overflowY: 'auto',
            fontSize: '16px',
            lineHeight: '1.7'
          }}
        />
        <p className={`text-xs mt-2 flex items-center gap-1 ${
          isDark ? 'text-teal-400' : 'text-teal-600'
        }`}>
          <Info size={12} />
          Select text and use the toolbar buttons to format
        </p>
      </div>

      {/* Business Hours Section */}
      <div className={`mb-8 rounded-lg border transition-colors p-6 ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg transition-colors ${
            isDark
              ? 'bg-gray-700'
              : 'bg-gray-100'
          }`}>
            <Clock size={24} className="accent-text" />
          </div>
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Business Hours
          </h2>
        </div>

        <div className="space-y-2">
          {days.map((day) => (
            <div
              key={day}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hours[day].display}
                  onChange={() => toggleDisplay(day)}
                  className={`w-4 h-4 rounded cursor-pointer accent-bg`}
                  title="Display this day"
                />
                {hours[day].display ? (
                  <Eye size={16} className="accent-text" />
                ) : (
                  <EyeOff size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                )}
              </div>

              <div className="flex items-center gap-2 w-24">
                <input
                  type="checkbox"
                  checked={!hours[day].closed}
                  onChange={() => toggleClosed(day)}
                  className={`w-4 h-4 rounded cursor-pointer accent-bg`}
                />
                <span className={`font-semibold capitalize text-sm ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {day.slice(0, 3)}
                </span>
              </div>

              {hours[day].closed ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className={`text-sm font-medium px-4 py-1.5 rounded-lg italic transition-colors ${
                    isDark
                      ? 'bg-gray-600 text-gray-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    Closed
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <input
                    type="time"
                    value={hours[day].open}
                    onChange={(e) => updateHours(day, 'open', e.target.value)}
                    className={`px-3 py-1.5 border-2 font-medium text-sm rounded-lg transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-gray-600 text-white border-gray-500 focus:border-teal-500'
                        : 'bg-white text-gray-900 border-gray-300 focus:border-teal-500'
                    }`}
                  />
                  <span className={`font-medium text-xs ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                    →
                  </span>
                  <input
                    type="time"
                    value={hours[day].close}
                    onChange={(e) => updateHours(day, 'close', e.target.value)}
                    className={`px-3 py-1.5 border-2 font-medium text-sm rounded-lg transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-gray-600 text-white border-gray-500 focus:border-teal-500'
                        : 'bg-white text-gray-900 border-gray-300 focus:border-teal-500'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={`mt-4 p-3 rounded-lg border transition-colors ${
          isDark
            ? 'bg-gray-700/50 border-gray-600 text-gray-300'
            : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          <p className="text-xs font-medium">
            💡 Use the eye icon to control which days are displayed to customers
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`px-10 py-3 rounded-lg font-semibold text-lg text-white accent-bg transition-all transform shadow-md ${
            isSaving 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:opacity-90 hover:-translate-y-0.5'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
        </>
      )}
    </div>
  );
}