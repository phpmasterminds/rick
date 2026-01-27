import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PermissionDeniedProps {
  featureName: string;
  description?: string;
  showBackButton?: boolean;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  featureName,
  description,
  showBackButton = true,
}) => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Access Denied
        </h1>

        {/* Feature Name */}
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {featureName}
        </p>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {description || 'You do not have permission to access this page. Please contact your administrator to request access.'}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          )}
          
          <button
            onClick={() => router.push('/home')}
            className="w-full px-4 py-3 rounded-lg bg-teal-600 dark:bg-teal-700 text-white font-medium hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors"
          >
            Back to Home
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};