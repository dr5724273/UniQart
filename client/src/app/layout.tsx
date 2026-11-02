import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ModeProvider } from "@/context/ModeContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.myuniqart.com"),
  title: "UniQart | Car & Bike Rentals, Finance in Kharar & Gharaun",
  description: "Explore car rentals, bikes on rent and finance offers in Kharar and Gharaun with UniQart (MyUniQart). Review vehicle prices, loan terms and availability.",
  openGraph: {
    title: "UniQart | Car & Bike Rentals, Finance in Kharar & Gharaun",
    description: "Find a car or bike on rent and explore finance offers in Kharar and Gharaun with MyUniQart.",
    siteName: "MyUniQart",
    type: "website",
    locale: "en_IN"
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ModeProvider>
          <AuthProvider>
            <Navbar />
            <div id="page-content" tabIndex={-1}>{children}</div>
          </AuthProvider>
        </ModeProvider>
      </body>
    </html>
  );
}
