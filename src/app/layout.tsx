import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopLoader from '@/components/layout/TopLoader';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Vetly — know what a project offer is really worth before you say yes',
  description:
    'Vetly shows the real effective hourly rate of a freelance project offer after fees and scope creep, scores the client risk, and gives a clear Accept / Negotiate / Reject verdict — with a counter-offer ready to send.',
  icons: { icon: '/vetly-icon.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-dvh flex-col font-sans text-ink-100 antialiased">
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        <div className="bg-aurora-fixed" aria-hidden="true" />
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
