import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuizUstoz",
  description: "Uzbek learners uchun classroom English quiz platforma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
