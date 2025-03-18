import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AppProvider } from '@/context/AppContext';
import { I18nProvider } from '@/providers/I18nProvider';
import { Toaster } from '@/components/ui/toaster';
import { NotificationProvider } from '@/providers/NotificationProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ramadan Timer',
  description: 'Track Sehri and Iftar times during Ramadan',
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
              </NotificationProvider>
            </AppProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
} 