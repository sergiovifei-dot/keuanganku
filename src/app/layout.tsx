import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Keuanganku",
  description: "Pencatatan keuangan pribadi",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Keuanganku" },
};

export const viewport: Viewport = {
  themeColor: "#7c5cff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
