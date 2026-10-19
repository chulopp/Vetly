import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
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
      <body className="min-h-dvh bg-base-950 font-sans text-ink-100 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
