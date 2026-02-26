import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { XPProvider } from "@/contexts/XPContext";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import FloatingActionButton from "@/components/FloatingActionButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mi Vida App",
  description: "PWA de productividad gamificada",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mi Vida",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#F9FAFB" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        <XPProvider>
          <AppHeader />
          {/* Contenido principal: pt-14 por header fijo, pb-24 por bottom nav fijo */}
          <main className="max-w-lg mx-auto px-4 pt-20 pb-28 min-h-screen">
            {children}
          </main>
          <BottomNav />
          <FloatingActionButton />
        </XPProvider>
      </body>
    </html>
  );
}
