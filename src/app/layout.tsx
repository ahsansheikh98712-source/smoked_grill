import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import OnboardingGate from "@/components/OnboardingGate";
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Que-Munity - BBQ Recipe Community",
  description: "Join the ultimate BBQ recipe community. Share, discover, and master the art of smoking meats.",
  keywords: "BBQ recipes, smoking, barbecue, grilling, recipes, cooking, meat, brisket, ribs",
  authors: [{ name: "Que-Munity" }],
  creator: "Que-Munity",
  publisher: "Que-Munity",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://quemunity.app",
    siteName: "Que-Munity",
    title: "Que-Munity - BBQ Recipe Community",
    description: "Join the ultimate BBQ recipe community. Share, discover, and master the art of smoking meats.",
  },
  verification: {
    google: "google-site-verification-code-here", // You'll need to add this later
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="your-verification-code-here" />
        
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4348399182192761"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        <SessionProvider>
          <Navigation />
          <SubscriptionBanner />
          <OnboardingGate />
          <main>
            {children}
          </main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
