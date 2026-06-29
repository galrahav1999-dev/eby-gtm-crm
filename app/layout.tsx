import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });
const frank = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], variable: "--font-frank", display: "swap" });

export const metadata: Metadata = {
  title: "EBY GTM",
  description: "EBY go-to-market workspace: contacts, schools, deals, and discovery, in one place.",
};

export const viewport: Viewport = {
  themeColor: "#fbf8f1",
  width: "device-width",
  initialScale: 1,
};

// Sets the theme before first paint so there is no flash. light | dark | auto.
// Auto follows the time of day (bright by day, cosmic by night).
const themeInit = `(function(){try{
  var p = localStorage.getItem('eby-theme') || 'auto';
  var t = p;
  if (p === 'auto') { var h = new Date().getHours(); t = (h >= 6 && h < 18) ? 'light' : 'dark'; }
  document.documentElement.dataset.theme = t;
  document.documentElement.dataset.themePref = p;
}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${GeistSans.variable} ${GeistMono.variable} ${heebo.variable} ${frank.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
