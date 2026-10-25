import type { Metadata, Viewport } from "next";
import { Montserrat, Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({ variable: "--font-rubik", subsets: ["hebrew", "latin"] });

// Montserrat is only for the "Lobby" wordmark.
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: "900" });

export const metadata: Metadata = {
  title: "לובי — מועדון הטבות לבניין",
  description: "מועדון הטבות סגור לדיירי בנייני מגורים",
  icons: { icon: "/logo.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#1F3A5F",
  // cover: draw under the notch / home bar; globals.css pads with env(safe-area-inset-*).
  viewportFit: "cover",
};

/** Root layout: Hebrew, right-to-left, brand fonts. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
