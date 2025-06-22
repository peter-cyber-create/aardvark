'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const carouselImages = [
  // Safari lodge exterior
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80",
  // Wildlife/Safari view
  "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
  // Lodge interior
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
  // Sunset safari view
  "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80",
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Login error:', error);
        setError(`An error occurred: ${error.message}`);
      } else {
        console.error('An unknown login error occurred:', error);
        setError('An unknown error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white relative overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white/90 rounded-full p-6 shadow-xl">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      )}
      {/* Carousel Section */}
      <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-amber-200 flex-shrink-0">
        <Image
          src={carouselImages[carouselIndex]}
          alt="Scenic background"
          fill
          className="object-cover transition-all duration-700"
          priority
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
          <h2 className="text-xl md:text-3xl font-bold mb-1 drop-shadow-lg">Welcome to AARDVARK SAFARI LODGE</h2>
          <p className="text-sm md:text-lg font-medium drop-shadow-lg">Experience the magic of African wildlife and luxury</p>
        </div>
        {/* Carousel indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {carouselImages.map((_, idx) => (
            <span
              key={idx}
              className={`w-2.5 h-2.5 rounded-full border border-white transition-all duration-300 ${carouselIndex === idx ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
        {/* Carousel thumbnails - horizontal scroll on mobile, only show on md+ */}
        <div className="absolute bottom-16 left-0 w-full hidden md:flex overflow-x-auto justify-center px-2 space-x-2 scrollbar-hide">
          {carouselImages.map((img, idx) => (
            <button
              key={`carousel-thumb-${idx}`}
              onClick={() => setCarouselIndex(idx)}                className={`border-2 ${carouselIndex === idx ? 'border-gray-900' : 'border-white/50'} rounded overflow-hidden w-16 h-10 focus:outline-none transition-all duration-200 flex-shrink-0`}
              tabIndex={-1}
              aria-label={`Show image ${idx + 1}`}
            >
              <Image src={img} alt="thumb" width={64} height={40} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      </div>
      {/* Login Form Section */}
      <div className="flex flex-1 items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 shadow-2xl rounded-2xl bg-white p-6 sm:p-8 border border-gray-100">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-6">
              {/* Username Field with Floating Label */}
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="peer block w-full px-3 py-3 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-transparent text-base"
                  placeholder=" "
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="username"
                  className="absolute left-3 -top-2.5 text-gray-500 text-sm transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600 bg-white px-1"
                >
                  Username
                </label>
              </div>
              {/* Password Field with Floating Label and Toggle */}
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="peer block w-full px-3 py-3 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-transparent text-base"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="password"
                  className="absolute left-3 -top-2.5 text-gray-500 text-sm transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600 bg-white px-1"
                >
                  Password
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 focus:outline-none p-1"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.425A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.875 2.425A9.956 9.956 0 0112 21c-1.657 0-3.22-.403-4.575-1.125m-2.425-1.875A10.05 10.05 0 013 12c0-1.657.403-3.22 1.125-4.575" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center mt-4">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isLoading && <LoadingSpinner size="sm" />}
                <span>{isLoading ? "Signing in..." : "Sign in"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
