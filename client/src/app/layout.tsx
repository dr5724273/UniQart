import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ModeProvider } from "@/context/ModeContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "UniQart — Rental & Finance Marketplace",
  description: "Rent Vehicles • Get Finance • Lend Money — All in One Trusted Marketplace"
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
