import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta Trends Analyzer",
  description:
    "Unified trend analysis across Google, YouTube, TikTok, Pinterest, and Reddit",
  authors: [
    { name: "שגיא נבט" },
    { name: "פרופסור אריק שדה" },
  ],
  other: {
    "copyright": "© Meta Trends Analyzer — שותפי הפרויקט: שגיא נבט, פרופסור אריק שדה. כל הזכויות שמורות.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

