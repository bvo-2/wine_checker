import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Decant", template: "%s · Decant" },
  description: "Find a bottle, rate it, keep a cellar of what you loved.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
