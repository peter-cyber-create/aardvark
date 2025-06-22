'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid username or password';
      case 'AccessDenied':
        return 'You do not have permission to access this resource';
      case 'SessionRequired':
        return 'Please sign in to access this page';
      default:
        return 'An error occurred during authentication';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>
        <div className="flex justify-center">
          <Link href="/auth/login">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 