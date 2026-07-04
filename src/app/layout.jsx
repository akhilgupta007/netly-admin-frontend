import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest-var",
  subsets: ["latin"],
});

export const metadata = {
  title: "Netly – Admin Panel",
  description: "Netly Admin Panel for managing your platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${onest.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
