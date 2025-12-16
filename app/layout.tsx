import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/lib/redux/ReduxProvider";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Manabi - Learn Japanese Kanji",
  description: "Master Japanese kanji with spaced repetition learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSansJP.variable} antialiased font-sans`}
      >
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
