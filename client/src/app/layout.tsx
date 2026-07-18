import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ModeProvider } from "@/context/ModeContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "MyUniQart — Rental & Finance Marketplace",
  description: "Rent Vehicles • Get Finance • Lend Money — All in One Trusted Marketplace",
  openGraph: {
    title: "MyUniQart — Rental & Finance Marketplace",
    description: "Rent Vehicles • Get Finance • Lend Money — All in One Trusted Marketplace",
    siteName: "MyUniQart"
  },
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ModeProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ModeProvider>
      </body>
    </html>
  );
}
