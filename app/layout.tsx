import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta Trends Analyzer",
  description: "Unified trend analysis across Google, YouTube, TikTok, Pinterest, and Reddit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

