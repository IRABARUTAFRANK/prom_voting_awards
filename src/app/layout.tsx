import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Heart } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Promo Awards Vote '26",
  description: "School promotion party awards — register, nominate, and vote",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="page-bg min-h-full font-sans">
        {children}
        <footer className="mx-auto mt-8 max-w-5xl px-4 py-6 text-center text-sm text-emerald-200/60">
          Made with{" "}
          <Heart className="mx-0.5 inline h-3.5 w-3.5 fill-rose-600 text-rose-600" aria-hidden />{" "}
          by I.Frank &amp; B.Rhema
        </footer>
      </body>
    </html>
  );
}
