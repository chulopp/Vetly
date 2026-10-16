import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import './globals.css';

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
    <html lang="en">
      <body className="min-h-dvh bg-base-950 font-sans text-ink-100 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
