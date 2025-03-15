import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AppProvider } from '@/context/AppContext';
import { I18nProvider } from '@/providers/I18nProvider';
import NotificationProvider from '@/providers/NotificationProvider';
import { Toaster } from '@/components/ui/toaster';
import InstallPWA from '@/components/InstallPWA';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Iftar-Sehri Timer',
  description: 'A simple Iftar and Sehri timer for Ramadan',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4CAF50',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AppProvider>
              <NotificationProvider>
                {children}
                <Toaster />
                <InstallPWA />
              </NotificationProvider>
            </AppProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
} 