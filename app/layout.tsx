import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "block",
  preload: true,
});

export const metadata: Metadata = {
  title: "Manabi - Learn Japanese Kanji",
  description: "Master Japanese kanji with Manabi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Manabi",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Manabi",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#f8f9fc" }} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme-color') || 'blue';
                  document.documentElement.setAttribute('data-theme', savedTheme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'blue');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${notoSansJP.variable} antialiased font-sans`} style={{ backgroundColor: "#f8f9fc" }} suppressHydrationWarning>
        {/* PWA Splash Screen */}
        <div id="splash-screen" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#ffffff',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 1,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: 'none'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#000000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              学
            </div>
            <div style={{
              color: '#000000',
              fontSize: '24px',
              fontWeight: '600',
              letterSpacing: '-0.025em',
              textAlign: 'center'
            }}>
              Manabi Learning
            </div>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var splash = document.getElementById('splash-screen');
                if (splash) {
                  splash.style.display = 'flex';
                  splash.style.opacity = '1';
                }
                
                function hideSplash() {
                  setTimeout(function() {
                    var splash = document.getElementById('splash-screen');
                    if (splash) {
                      splash.style.opacity = '0';
                      setTimeout(function() {
                        splash.style.display = 'none';
                      }, 300);
                    }
                  }, 100);
                }
                
                if (document.readyState === 'complete') {
                  hideSplash();
                } else {
                  window.addEventListener('load', hideSplash);
                }
              })();
            `,
          }}
        />
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
