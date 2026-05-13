import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TML Vietoris-Rips Demo",
  description: "Interactive Rotatable Vietoris-Rips Filtration demo for the TML point-cloud pipeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
