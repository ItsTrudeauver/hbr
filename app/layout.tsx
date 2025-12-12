import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HBR Tier List",
  description: "Heaven Burns Red Tier List Viewer",
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