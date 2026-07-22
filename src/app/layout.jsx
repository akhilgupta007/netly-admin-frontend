import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest-var",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"]
});

export const metadata = {
  title: "Netly – Admin Panel",
  description: "Netly Admin Panel for managing your platform.",
};

import QueryProvider from "@/providers/QueryProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${onest.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
