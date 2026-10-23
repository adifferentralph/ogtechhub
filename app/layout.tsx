import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mayor Tech Hub | Premium Gadgets",
  description: "Shop phones, laptops, gaming gear and accessories from Mayor Tech Hub. Order securely through WhatsApp.",
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
    <html lang="en-NG">
      <body className="antialiased">{children}</body>
    </html>
  );
}
