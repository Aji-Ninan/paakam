import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { HealthProvider } from "@/context/HealthContext";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "paakam — Daily Nutrition & Health",
  description:
    "Mobile-first nutrition tracker with sodium guards, meal logs, and local-only storage.",
  applicationName: "paakam",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "paakam",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0f0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <HealthProvider>
          {children}
          <ServiceWorkerRegister />
        </HealthProvider>
      </body>
    </html>
  );
}
