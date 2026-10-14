import type { Metadata } from "next";

import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "إدارة طريق أكاديمي",
  description: "بوابة إدارة طريق أكاديمي",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
