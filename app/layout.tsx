import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "اليوم الوطني السعودي 96 | نادي مداد الصيدلة",
  description: "تجربة تفاعلية لنادي مداد الصيدلة بجامعة نجران بمناسبة اليوم الوطني السعودي 96",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
