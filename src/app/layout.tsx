import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/auth';
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from 'react-hot-toast';
import { ClientInitializer } from '@/components/ClientInitializer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aardvark Safari Lodge",
  description: "Experience the magic of African wildlife and luxury",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SessionProvider session={session}>
          <ErrorBoundary>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            }>
              <ClientInitializer>
                {children}
              </ClientInitializer>
            </Suspense>
          </ErrorBoundary>
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
