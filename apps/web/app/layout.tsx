import "./globals.css";
import type { Metadata } from "next";
import { splineSans } from "./fonts";


export const metadata: Metadata = {
  title: "Mocksi register",
  description: "Start with Mocksi!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={splineSans.className}>{children}</body>
    </html>
  );
}
