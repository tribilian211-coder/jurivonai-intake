import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "JurivonAI · Lawyer Research Intake",
  description:
    "Tell us what frustrates you about legal research, drafting, and the tools you already use. Your answers shape what JurivonAI builds next.",
  keywords: ["JurivonAI", "legal AI", "Pakistan", "lawyers", "legal research", "Digilawyer"],
  authors: [{ name: "JurivonAI" }],
  openGraph: {
    title: "JurivonAI · Lawyer Research Intake",
    description: "Help us build the legal AI tool Pakistani lawyers actually want.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <SonnerToaster
          position="top-center"
          richColors
          toastOptions={{
            classNames: {
              toast: "font-sans",
            },
          }}
        />
      </body>
    </html>
  );
}
