'use client';

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

interface FormData {
  fullName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface UserProfileData {
  user_id: string;
  user_name: string;
  full_name: string;
  email: string;
  user_image: string;
  user_group_id: string;
  birthday?: string | null;
  birthday_search?: string;
  country_iso?: string;
  cover_photo_exists?: string | null;
  gender?: string;
  is_friend?: boolean;
  is_friend_of_friend?: boolean;
  is_friend_request?: boolean;
  is_online?: string;
  language_id?: string;
  relation_id?: string;
  relation_phrase?: string;
  relation_with_id?: string;
  time_zone?: string;
  title?: string;
}

interface UserProfile {
  data: UserProfileData;
}

export default function ProfilePageWithoutHookForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [changePasswordOption, setChangePasswordOption] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_SITE_URL;


  // Form state - notice we need separate state for each field
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Error state - notice we need separate error state for each field
  const [errors, setErrors] = useState<FormErrors>({});

  // Load user profile from localStorage on mount
  useEffect(() => {
    setMounted(true);
    loadProfileFromStorage();
  }, []);

  const loadProfileFromStorage = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error('User data not found in localStorage');
        return;
      }

      const userData = JSON.parse(userStr) as UserProfile;

      setProfileData(userData.data);

      // Set form data - manually update each field
      setFormData((prev) => ({
        ...prev,
        fullName: userData.data.full_name || '',
        email: userData.data.email || '',
      }));

      if (userData.data.user_image) {
			const image120 = userData.data.user_image.replace('%s', '_120_square');

			setPhotoPreview(`${apiUrl}user/${image120}`);

      }
    } catch (error) {
      console.error('Failed to load profile from localStorage:', error);
      toast.error('Failed to load profile data');
    }
  }, []);

  // Handle input change - need individual handler
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Validate form - need to write all validation logic manually
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate fullName
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Full name must not exceed 100 characters';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
    }

    // Validate password fields if change password is checked
    if (changePasswordOption) {
      if (!formData.currentPassword.trim()) {
        newErrors.currentPassword = 'Current password is required';
      }

      if (!formData.newPassword.trim()) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = 'Confirm password is required';
      } else if (formData.confirmPassword !== formData.newPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - need to manually validate and handle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form first
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('full_name', formData.fullName);
      formDataToSend.append('email', formData.email);

      if (changePasswordOption) {
        formDataToSend.append('current_password', formData.currentPassword);
        formDataToSend.append('new_password', formData.newPassword);
      }

      if (photoFile) {
        formDataToSend.append('profile_photo', photoFile);
      }

      const response = await axios.post('/api/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        // Update localStorage
        const updatedUser: UserProfileData = {
          ...profileData!,
          full_name: formData.fullName,
          email: formData.email,
          user_image:
            response.data.data?.user_image ||
            photoPreview ||
            profileData?.user_image,
        };

        localStorage.setItem('user', JSON.stringify({ data: updatedUser }));
        setProfileData(updatedUser);

        toast.success('Profile updated successfully');

        // Reset form state manually
        setChangePasswordOption(false);
        setPhotoFile(null);
        setFormData({
          fullName: formData.fullName,
          email: formData.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setErrors({});
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel - need to manually reset all fields
  const handleCancel = () => {
    setChangePasswordOption(false);
    setPhotoFile(null);
    setErrors({});
    loadProfileFromStorage();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center space-y-4 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 text-center">
                    <p className="text-sm">No photo</p>
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={loading}
                  className="hidden"
                />
                <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer">
                  {photoFile ? 'Change Photo' : 'Upload Photo'}
                </span>
              </label>
              {photoFile && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Photo selected: {photoFile.name}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Change Toggle */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={changePasswordOption}
                  onChange={(e) => setChangePasswordOption(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Change Password
                </span>
              </label>
            </div>

            {/* Password Fields - Conditional Render */}
            {changePasswordOption && (
              <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      handleInputChange('currentPassword', e.target.value)
                    }
                    disabled={loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
                      errors.currentPassword
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter your current password"
                  />
                  {errors.currentPassword && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    disabled={loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
                      errors.newPassword
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter your new password"
                  />
                  {errors.newPassword && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange('confirmPassword', e.target.value)
                    }
                    disabled={loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
                      errors.confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Confirm your new password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-400 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}