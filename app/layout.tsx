import type { Metadata } from "next";
import { Archivo, Patrick_Hand } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hand-src",
});

export const metadata: Metadata = {
  title: "Personal Swiftboard",
  description: "Your week, one sticky note at a time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${patrickHand.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
