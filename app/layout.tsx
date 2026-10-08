import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabelPro — Labels, Barcodes & Printing",
  description:
    "Professional label, barcode, QR code and printing management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
