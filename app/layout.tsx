import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import { AppToaster } from "@/components/ui/AppToaster";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./marketing.css";
import ScrollToTop from "@/components/ScrollToTop";
import SiteChrome from "@/components/SiteChrome";
import { PRODUCT_NAME, PRODUCT_TAGLINE, PRODUCT_WORDMARK } from "@/lib/brand/product";
import { websiteJsonLd } from "@/lib/seo/json-ld";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: PRODUCT_WORDMARK,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: PRODUCT_TAGLINE,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000"
  ),
  openGraph: {
    title: PRODUCT_WORDMARK,
    description: PRODUCT_TAGLINE,
    type: "website",
    images: [{ url: "/apple-icon", width: 180, height: 180, alt: PRODUCT_NAME }],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    // ICO + PNG first: Safari and older Chromium still prefer these over SVG.
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon", sizes: "32x32", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <Script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <Providers>
          <ScrollToTop />
          <SiteChrome>{children}</SiteChrome>
          <AppToaster />
        </Providers>
      </body>
    </html>
  );
}
