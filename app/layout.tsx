import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://localhost:3000'), // لحل التنبيه الأصفر في الـ Terminal
  title: 'المتجر الذكي',
  description: 'تطبيق إدارة المتجر الذكي',
  manifest: '/manifest.json', // لربط التطبيق بملف PWA
};

export const viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
