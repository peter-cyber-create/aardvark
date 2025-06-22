'use client';

import React from 'react';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/Button';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isAdmin = session?.user?.role === 'ADMIN';
  const isStaff = session?.user?.role === 'STAFF';

  // Updated navigation array with correct order and access control
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Check In', href: '/dashboard/checkins', current: pathname === '/dashboard/checkins', roles: ['STAFF'] },
    { name: 'Check Out', href: '/dashboard/checkout', current: pathname === '/dashboard/checkout', roles: ['STAFF'] },
    { name: 'Guest Activities', href: '/dashboard/activities', current: pathname === '/dashboard/activities', roles: ['STAFF'] },
    { name: 'Cottages', href: '/dashboard/rooms', current: pathname === '/dashboard/rooms', roles: ['ADMIN'] },
    { name: 'Activities Management', href: '/dashboard/activities', current: pathname === '/dashboard/activities', roles: ['ADMIN'] },
    { name: 'Reports', href: '/dashboard/reports', current: pathname === '/dashboard/reports', roles: ['ADMIN'] },
    { name: 'Staff', href: '/dashboard/users', current: pathname === '/dashboard/users', roles: ['ADMIN'] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with shadow and gradient border bottom */}
      <header className="bg-black text-white sticky top-0 z-20 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Name */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AARDVARK SAFARI LODGE
              </h1>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-6">
              <ConnectionStatus />
              <span className="text-gray-300 font-medium">
                {session?.user?.role === 'ADMIN' ? 'Administrator' : 'Staff'}: {session?.user?.username}
              </span>
              <Button
                onClick={() => signOut()}
                className="bg-transparent hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors border border-white/20"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-4">
            <div className="flex items-center justify-center space-x-1">
              {sessionStatus !== 'loading' && navigation.map((item) => {
                if (item.roles && !item.roles.includes(session?.user?.role as string)) {
                  return null;
                }
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-white text-black shadow-lg' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content with improved card styling */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}