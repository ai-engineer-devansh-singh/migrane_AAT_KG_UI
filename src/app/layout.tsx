import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MigraineAAT-KG",
  description: "Assertion-aware temporal migraine knowledge graph QA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inline script: apply the stored theme before paint to avoid a flash of the
  // wrong theme. Defaults to the OS preference when no choice is stored.
  const themeInit = `
    (function() {
      try {
        var t = localStorage.getItem('maat-theme');
        if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    })();
  `;
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-canvas text-ink min-h-screen antialiased">{children}</body>
    </html>
  );
}
