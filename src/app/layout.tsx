import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#F5F5F7" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
        <SonnerToaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "glass-strong rounded-xl border-white/60 shadow-macos-md font-sans",
            },
          }}
        />
      </body>
    </html>
  );
}
