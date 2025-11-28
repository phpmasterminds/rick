'use client';

import React, { useState, useCallback } from 'react';
import {
  ChevronDown, AlertCircle, Eye, EyeOff, Mail, Phone, MapPin, Loader2, X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

// US Phone formatting utility
const formatUSPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 11 digits (1 + 10 digit number)
  const limited = digits.slice(0, 11);
  
  // If less than 10 digits, just return the digits
  if (limited.length < 10) {
    return limited;
  }
  
  // Format as (XXX) XXX-XXXX WITHOUT the +1 prefix
  // The +1 is displayed as a static span, so we don't include it in the value
  const hasCountryCode = limited.length === 11 && limited.startsWith('1');
  const phoneDigits = hasCountryCode ? limited.slice(1) : limited.slice(0, 10);
  
  return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;
};

interface RegistrationFormData {
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_office_phone: string;
  contact_mobile: string;
  contact_job_title: string;
  contact_department: string;
  contact_fax: string;
  contact_company_name: string;
  account_name: string;
  website: string;
  annual_revenue: string;
  billing_street: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_phone: string;
  license_type: string;
  license_number: string;
  expiration_date: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface FieldErrors {
  [key: string]: string;
}

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

const licenseTypes = ['Dispensary', 'Processor', 'Grower'];

export default function RegistrationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('contact');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showMobileVerification, setShowMobileVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);

  const [formData, setFormData] = useState<RegistrationFormData>({
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_office_phone: '',
    contact_mobile: '',
    contact_job_title: '',
    contact_department: '',
    contact_fax: '',
    contact_company_name: '',
    account_name: '',
    website: '',
    annual_revenue: '',
    billing_street: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    billing_phone: '',
    license_type: '',
    license_number: '',
    expiration_date: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    
    // Format mobile phone number
    let finalValue = value;
    if (name === 'contact_mobile') {
      finalValue = formatUSPhoneNumber(value);
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: finalValue,
      };
      
      // Auto-populate account_name with company_name
      if (name === 'contact_company_name') {
        newData.account_name = value;
      }
      
      // Auto-populate account email with contact email
      if (name === 'contact_email') {
        newData.email = value;
      }
      
      return newData;
    });
  };

  /*const sendOTP = async () => {
    try {
      setSendingOTP(true);
      
      // Call backend API to send OTP
      const response = await axios.post('/api/business/send-verification-code', {
        phone: formData.contact_mobile
      });
      
      if (response.data.success) {
        setShowMobileVerification(true);
        setVerificationInput('');
        alert(`Verification code sent to ${formData.contact_mobile}`);
      } else {
        alert(response.data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send verification code. Please try again.');
    } finally {
      setSendingOTP(false);
    }
  };*/

  const verifyOTP = async () => {
    try {
      setVerifyingOTP(true);
      
      // Extract digits from contact_mobile and add +1 prefix for API
      const mobileDigitsOnly = formData.contact_mobile.replace(/\D/g, '');
      const mobileWithCountryCode = '+1' + mobileDigitsOnly;

      // Call backend API to verify OTP
      const response = await axios.post('/api/auth/verify-code', {
        phone: mobileWithCountryCode,
        code: verificationInput
      });
      
      if (response.data.status === 'success') {
        setMobileVerified(true);
        setShowMobileVerification(false);
        setVerificationInput('');
        toast.success('Mobile number verified successfully!', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      } else {
        toast.error(response.data.message || 'Invalid verification code. Please try again.', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Verification failed. Please try again.', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setVerifyingOTP(false);
    }
  };

  const resetMobileVerification = () => {
    setMobileVerified(false);
    setShowMobileVerification(false);
    setVerificationInput('');
    setVerificationCode('');
  };

  const validateContactTab = (): boolean => {
    const errors: FieldErrors = {};
    let isValid = true;

    if (!formData.contact_first_name.trim()) {
      errors.contact_first_name = 'First name is required';
      isValid = false;
    }
    if (!formData.contact_last_name.trim()) {
      errors.contact_last_name = 'Last name is required';
      isValid = false;
    }
    if (!formData.contact_email.trim()) {
      errors.contact_email = 'Contact email is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact_email)) {
        errors.contact_email = 'Please enter a valid email address';
        isValid = false;
      }
    }
    if (!formData.contact_company_name.trim()) {
      errors.contact_company_name = 'Company name is required';
      isValid = false;
    }
    if (!formData.contact_mobile.trim()) {
      errors.contact_mobile = 'Mobile number is required';
      isValid = false;
    } else {
      const digitsOnly = formData.contact_mobile.replace(/\D/g, '');
      const mobileRegex = /^1?([0-9]{3})([0-9]{3})([0-9]{4})$/;
      if (!mobileRegex.test(digitsOnly)) {
        errors.contact_mobile = 'Please enter a valid USA mobile number (e.g., (123) 456-7890)';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const validateBusinessTab = (): boolean => {
    const errors: FieldErrors = {};
    let isValid = true;

    if (!formData.account_name.trim()) {
      errors.account_name = 'Account name is required';
      isValid = false;
    }
    if (!formData.billing_street.trim()) {
      errors.billing_street = 'Business address is required';
      isValid = false;
    }
    if (!formData.billing_city.trim()) {
      errors.billing_city = 'City is required';
      isValid = false;
    }
    if (!formData.billing_state) {
      errors.billing_state = 'State is required';
      isValid = false;
    }
    if (!formData.billing_postal_code.trim()) {
      errors.billing_postal_code = 'Postal code is required';
      isValid = false;
    } else {
      const postalRegex = /^\d{5}(?:-\d{4})?$/;
      if (!postalRegex.test(formData.billing_postal_code.trim())) {
        errors.billing_postal_code = 'Please enter a valid USA postal code (e.g., 12345 or 12345-6789)';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const validateLicenseTab = (): boolean => {
    const errors: FieldErrors = {};
    let isValid = true;

    if (!formData.license_type) {
      errors.license_type = 'License type is required';
      isValid = false;
    }
    if (!formData.license_number.trim()) {
      errors.license_number = 'License number is required';
      isValid = false;
    }
    if (!formData.expiration_date) {
      errors.expiration_date = 'License expiration date is required';
      isValid = false;
    } else {
      const selectedDate = new Date(formData.expiration_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.expiration_date = 'License expiration date must be in the future';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const validateAuthenticationTab = (): boolean => {
    const errors: FieldErrors = {};
    let isValid = true;

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    if (!formData.confirm_password) {
      errors.confirm_password = 'Confirm password is required';
      isValid = false;
    }
    if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateContactTab() || !validateBusinessTab() || !validateLicenseTab() || !validateAuthenticationTab()) {
      return;
    }

    setSubmitting(true);
    try {
      // Extract digits from contact_mobile and add +1 prefix for API
      const mobileDigitsOnly = formData.contact_mobile.replace(/\D/g, '');
      const mobileWithCountryCode = '+1' + mobileDigitsOnly;

      const payload = {
        contact_first_name: formData.contact_first_name,
        contact_last_name: formData.contact_last_name,
        contact_email: formData.contact_email,
        contact_office_phone: formData.contact_office_phone,
        contact_mobile: mobileWithCountryCode,  // Send as: +12025551234
        contact_job_title: formData.contact_job_title,
        contact_department: formData.contact_department,
        contact_fax: formData.contact_fax,
        contact_company_name: formData.contact_company_name,
        account_name: formData.account_name,
        website: formData.website,
        annual_revenue: formData.annual_revenue,
        billing_street: formData.billing_street,
        billing_city: formData.billing_city,
        billing_state: formData.billing_state,
        billing_postal_code: formData.billing_postal_code,
        billing_phone: formData.billing_phone,
        license_type: formData.license_type,
        license_number: formData.license_number,
        expiration_date: formData.expiration_date,
        email: formData.email,
        password: formData.password,
      };

      const response = await axios.post('/api/auth/register', payload);

      if (response.data.status === 'success') {
        // Registration successful - auto-send OTP
        setRegistrationData(response.data);
        setRegistrationComplete(true);
        setShowMobileVerification(true);
        toast.success(`✓ Registration successful! OTP sent to ${formData.contact_mobile}`, {
              position: 'bottom-center',
              autoClose: 3000,
            });
        // Auto-send OTP to mobile
        /*try {
          const otpResponse = await axios.post('/api/business/send-verification-code', {
            phone: formData.contact_mobile
          });
          
          if (otpResponse.data.success) {
            toast.success(`✓ Registration successful! OTP sent to ${formData.contact_mobile}`, {
              position: 'top-right',
              autoClose: 3000,
            });
          }
        } catch (otpError) {
          console.error('Error sending OTP:', otpError);
          toast.success('Registration successful! Please try sending OTP again.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }*/
      } else {
        /*toast.error(`Error: ${response.data.error.message || 'Registration failed'}`, {
          position: 'bottom-center',
          autoClose: 3000,
        });*/
		toast.error(
  response?.data?.error?.message || 'Registration failed',
  {
    position: 'bottom-center',
    autoClose: 3000,
  }
);

      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(`Error: ${errorMessage}`, {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'contact', label: 'Contact Information' },
    { id: 'business', label: 'Business Information' },
    { id: 'license', label: 'License Information' },
    { id: 'authentication', label: 'Create Account' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {!registrationComplete && (
          <div className="bg-white rounded-t-2xl shadow-lg p-8 border-b border-gray-200">
            <h1 className="text-4xl font-bold text-teal-600 mb-2">Nature's High Registration</h1>
            <p className="text-gray-600">Complete your business registration to get started</p>
          </div>
        )}

        {!registrationComplete && (
          <div className="bg-white shadow-lg px-8">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    // Validate current tab before switching
                    if (activeTab === 'contact' && tab.id !== 'contact') {
                      if (!validateContactTab()) return;
                    } else if (activeTab === 'business' && tab.id !== 'business') {
                      if (!validateBusinessTab()) return;
                    } else if (activeTab === 'license' && tab.id !== 'license') {
                      if (!validateLicenseTab()) return;
                    }
                    setActiveTab(tab.id);
                  }}
                  className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-teal-600 border-teal-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`bg-white shadow-lg p-8 ${registrationComplete ? 'rounded-2xl' : 'rounded-b-2xl'}`}>
          {activeTab === 'contact' && !registrationComplete && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Your Company Name will be automatically populated as the Account Name.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">First Name *</label>
                  <input
                    type="text"
                    name="contact_first_name"
                    value={formData.contact_first_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      fieldErrors.contact_first_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                  {fieldErrors.contact_first_name && (
                    <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.contact_first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Last Name *</label>
                  <input
                    type="text"
                    name="contact_last_name"
                    value={formData.contact_last_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      fieldErrors.contact_last_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                  {fieldErrors.contact_last_name && (
                    <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.contact_last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Company Name *</label>
                <input
                  type="text"
                  name="contact_company_name"
                  value={formData.contact_company_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.contact_company_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                  }`}
                />
                {fieldErrors.contact_company_name && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.contact_company_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Email *</label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.contact_email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                  }`}
                />
                {fieldErrors.contact_email && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.contact_email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Office Phone</label>
                  <input
                    type="tel"
                    name="contact_office_phone"
                    value={formData.contact_office_phone}
                    onChange={handleInputChange}
                    placeholder="(xxx) xxx-xxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Mobile *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-600 font-medium pointer-events-none">+1</span>
                    <input
                      type="tel"
                      name="contact_mobile"
                      value={formData.contact_mobile}
                      onChange={handleInputChange}
                      placeholder="+1 (xxx) xxx-xxxx"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        fieldErrors.contact_mobile ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.contact_mobile && (
                    <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.contact_mobile}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Job Title</label>
                  <input
                    type="text"
                    name="contact_job_title"
                    value={formData.contact_job_title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Department</label>
                  <input
                    type="text"
                    name="contact_department"
                    value={formData.contact_department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Fax</label>
                <input
                  type="text"
                  name="contact_fax"
                  value={formData.contact_fax}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    if (validateContactTab()) {
                      setFieldErrors({});
                      setActiveTab('business');
                    }
                  }}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === 'business' && !registrationComplete && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Account Name *</label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-populated from Company Name</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Annual Revenue</label>
                <input
                  type="text"
                  name="annual_revenue"
                  value={formData.annual_revenue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Street Address *</label>
                <textarea
                  name="billing_street"
                  value={formData.billing_street}
                  onChange={handleInputChange}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.billing_street ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                  }`}
                />
                {fieldErrors.billing_street && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.billing_street}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">City *</label>
                  <input
                    type="text"
                    name="billing_city"
                    value={formData.billing_city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      fieldErrors.billing_city ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                  {fieldErrors.billing_city && (
                    <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.billing_city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">State *</label>
                  <select
                    name="billing_state"
                    value={formData.billing_state}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      fieldErrors.billing_state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  >
                    <option value="">Select State</option>
                    {Object.entries(states).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                  {fieldErrors.billing_state && (
                    <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.billing_state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Postal Code *</label>
                  <input
                    type="text"
                    name="billing_postal_code"
                    value={formData.billing_postal_code}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      fieldErrors.billing_postal_code ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                  {fieldErrors.billing_postal_code && (
                    <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.billing_postal_code}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Business Phone</label>
                <input
                  type="tel"
                  name="billing_phone"
                  value={formData.billing_phone}
                  onChange={handleInputChange}
                  placeholder="(xxx) xxx-xxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateBusinessTab()) {
                      setFieldErrors({});
                      setActiveTab('license');
                    }
                  }}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === 'license' && !registrationComplete && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">License Type *</label>
                <select
                  name="license_type"
                  value={formData.license_type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.license_type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                  }`}
                >
                  <option value="">Select License Type</option>
                  {licenseTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {fieldErrors.license_type && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.license_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">License Number *</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.license_number ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                  }`}
                />
                {fieldErrors.license_number && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.license_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Expiration Date *</label>
                <input
                  type="date"
                  name="expiration_date"
                  value={formData.expiration_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.expiration_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                  }`}
                />
                {fieldErrors.expiration_date && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.expiration_date}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab('business')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateLicenseTab()) {
                      setFieldErrors({});
                      setActiveTab('authentication');
                    }
                  }}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === 'authentication' && !registrationComplete && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                      fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                      fieldErrors.confirm_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-gray-500"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.confirm_password}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab('license')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}

          {registrationComplete && (
            <div className="space-y-6 py-8">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <Phone className="w-16 h-16 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
                <p className="text-gray-600">Verify your mobile number to activate your account</p>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-teal-600" />
                  <p className="text-sm font-medium text-teal-900">Enter Verification Code</p>
                </div>
                
                <div className="bg-white p-4 rounded border border-teal-200">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Mobile Number:</span> {formData.contact_mobile}
                  </p>
                  <p className="text-sm text-gray-600">
                    A 6-digit verification code has been sent to your mobile number
                  </p>
                </div>

                {showMobileVerification && !mobileVerified && (
                  <div className="space-y-3">
                    <p className="text-sm text-teal-700 font-medium">
                      Enter the 6-digit code sent to {formData.contact_mobile}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={verificationInput}
                        onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="flex-1 px-4 py-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-center text-3xl font-mono tracking-widest font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={verifyOTP}
                      disabled={verificationInput.length !== 6 || verifyingOTP}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        verifyingOTP || verificationInput.length !== 6
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-teal-600 text-white hover:bg-teal-700'
                      }`}
                    >
                      {verifyingOTP ? 'Verifying Code...' : 'Verify'}
                    </button>
                  </div>
                )}

                {mobileVerified && (
                  <div className="bg-green-50 border border-green-200 rounded p-4 text-center space-y-4">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">✓</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-green-700 font-bold text-lg">Verification Successful!</p>
                      <p className="text-sm text-green-600 mt-1">Your mobile number has been verified</p>
                    </div>
                  </div>
                )}
              </div>

              {mobileVerified && (
                <div className="flex gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      toast.success('Account verified! Redirecting to login...', {
                        position: 'bottom-center',
                        autoClose: 2000,
                      });
                      setTimeout(() => {
                        router.push('/login');
                      }, 500);
                    }}
                    className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}