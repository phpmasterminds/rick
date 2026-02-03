'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Track original values to detect changes
  const originalDataRef = useRef<FormData>({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Error state
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

      // Set form data and track original values
      const initialFormData: FormData = {
        fullName: userData.data.full_name || '',
        email: userData.data.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };

      setFormData(initialFormData);
      originalDataRef.current = { ...initialFormData };

      if (userData.data.user_image) {
        const image120 = userData.data.user_image.replace('%s', '_120_square');
        setPhotoPreview(`${apiUrl}user/${image120}`);
      }
    } catch (error) {
      console.error('Failed to load profile from localStorage:', error);
      toast.error('Failed to load profile data');
    }
  }, [apiUrl]);

  // Handle input change
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

  // Detect which fields have changed
  const getChangedFields = (): Partial<FormData> => {
    const changedFields: Partial<FormData> = {};

    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      if (formData[field] !== originalDataRef.current[field]) {
        changedFields[field] = formData[field];
      }
    });

    return changedFields;
  };

  // Check if photo has changed
  const hasPhotoChanged = (): boolean => {
    return photoFile !== null;
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

  // Validate form - only validate changed fields
  const validateForm = (changedFields: Partial<FormData>): boolean => {
    const newErrors: FormErrors = {};

    // Validate fullName if changed
    if ('fullName' in changedFields) {
      if (!changedFields.fullName!.trim()) {
        newErrors.fullName = 'Full name is required';
      } else if (changedFields.fullName!.length < 2) {
        newErrors.fullName = 'Full name must be at least 2 characters';
      } else if (changedFields.fullName!.length > 100) {
        newErrors.fullName = 'Full name must not exceed 100 characters';
      }
    }

    // Validate email if changed
    if ('email' in changedFields) {
      if (!changedFields.email!.trim()) {
        newErrors.email = 'Email is required';
      } else {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(changedFields.email!)) {
          newErrors.email = 'Invalid email address';
        }
      }
    }

    // Validate password fields if change password is checked and passwords are being changed
    if (changePasswordOption) {
      if ('currentPassword' in changedFields) {
        if (!changedFields.currentPassword!.trim()) {
          newErrors.currentPassword = 'Current password is required';
        }
      }

      if ('newPassword' in changedFields) {
        if (!changedFields.newPassword!.trim()) {
          newErrors.newPassword = 'New password is required';
        } else if (changedFields.newPassword!.length < 6) {
          newErrors.newPassword = 'Password must be at least 6 characters';
        }
      }

      if ('confirmPassword' in changedFields) {
        if (!changedFields.confirmPassword!.trim()) {
          newErrors.confirmPassword = 'Confirm password is required';
        } else if (changedFields.confirmPassword! !== formData.newPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }

      // If any password field is being changed, validate all password fields together
      if ('currentPassword' in changedFields || 'newPassword' in changedFields || 'confirmPassword' in changedFields) {
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    // Reset form to original values
    setFormData(originalDataRef.current);
    setPhotoFile(null);
    setErrors({});
    setChangePasswordOption(false);

    // Reload original photo
    if (profileData?.user_image) {
      const image120 = profileData.user_image.replace('%s', '_120_square');
      setPhotoPreview(`${apiUrl}user/${image120}`);
    }
  };

  // ===== EMIT CUSTOM EVENT TO NOTIFY OTHER COMPONENTS OF USER DATA CHANGES =====
  const emitUserDataChangeEvent = (updatedUserData: UserProfile) => {
    const event = new CustomEvent('userDataChanged', {
      detail: updatedUserData,
    });
    window.dispatchEvent(event);
  };

  // Handle form submission with smart field detection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get changed fields
    const changedFields = getChangedFields();
    const photoChanged = hasPhotoChanged();

    // If nothing changed, show message and return
    if (Object.keys(changedFields).length === 0 && !photoChanged) {
      toast.info('No changes to update');
      return;
    }

    // Validate only changed fields
    if (!validateForm(changedFields)) {
      return;
    }

    try {
      setLoading(true);

      // Prepare FormData with only changed fields
      const formDataToSend = new FormData();

      // Add changed text fields
      if ('fullName' in changedFields) {
        formDataToSend.append('full_name', changedFields.fullName || '');
      }

      if ('email' in changedFields) {
        formDataToSend.append('email', changedFields.email || '');
      }

      // Add password fields if changed password option is enabled and password fields changed
      if (changePasswordOption) {
        if ('currentPassword' in changedFields) {
          formDataToSend.append('old_password', changedFields.currentPassword || '');
        }

        if ('newPassword' in changedFields) {
          formDataToSend.append('new_password', changedFields.newPassword || '');
        }

        if ('confirmPassword' in changedFields) {
          formDataToSend.append('confirm_password', changedFields.confirmPassword || '');
        }
      }

      // Add photo if changed
      if (photoChanged && photoFile) {
        formDataToSend.append('user_image', photoFile);
      }

      // Make API request
      const response = await axios.post(`/api/user/profile`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data?.status === 'success') {
        // Update original data to current form data
        originalDataRef.current = { ...formData };
        setPhotoFile(null);
        setChangePasswordOption(false);

        // Reset password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));

        // Update localStorage with new data
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr) as UserProfile;

          // Update full name if changed
          if ('fullName' in changedFields) {
            userData.data.full_name = changedFields.fullName || '';
          }

          // Update email if changed
          if ('email' in changedFields) {
            userData.data.email = changedFields.email || '';
          }

          // Update user image if returned from API
          const newUserImage = response.data?.data?.user_image;
          if (newUserImage) {
            userData.data.user_image = newUserImage;
          }

          // Save updated data to localStorage
          localStorage.setItem('user', JSON.stringify(userData));

          // ===== EMIT CUSTOM EVENT TO NOTIFY TOPBAR AND OTHER COMPONENTS =====
          emitUserDataChangeEvent(userData);

          console.log('User data updated and event emitted:', userData);
        }

        toast.success('Profile updated successfully');
        console.log('API Response:', response.data);
      } else {
			const errorMessage =
			response.data?.error?.message ||
			response.data?.message ||
			'Failed to update profile';

			toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.message || 'Failed to update profile';
        toast.error(errorMessage);
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
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
                <span className="px-4 py-2 accent-bg accent-hover text-white rounded-lg transition-colors text-sm font-medium cursor-pointer">
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
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
                  className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-2 focus:ring-accent dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Change Password
                </span>
              </label>
            </div>

            {/* Password Fields - Conditional Render */}
            {changePasswordOption && (
              <div className="space-y-4 bg-accent/5 dark:bg-accent/10 p-4 rounded-lg border border-accent/20 dark:border-accent/30">
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all ${
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
                className="flex-1 accent-bg accent-hover disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg  duration-200"
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