import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import clsx from 'clsx';
import type { Metadata } from 'next';
import { BRANDING } from '@/lib/branding/branding';

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"], 
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: BRANDING.name,
  description: BRANDING.description,
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={clsx(manrope.variable, spaceGrotesk.variable, "antialiased bg-[#0b0e11] text-[#f8f9fe]")}>
        <div className="fixed inset-0 pointer-events-none z-[-1] opacity-5 bg-[linear-gradient(#282d31_1px,transparent_1px),linear-gradient(90deg,#282d31_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
