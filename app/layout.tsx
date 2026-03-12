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
        {/* iOS PWA splash screens */}
        {/* iPhone 16 Pro Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/api/splash?w=1320&h=2868" />
        {/* iPhone 16 Pro */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/api/splash?w=1206&h=2622" />
        {/* iPhone 16 Plus / 15 Plus / 15 Pro Max / 14 Pro Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/api/splash?w=1290&h=2796" />
        {/* iPhone 16 / 15 / 15 Pro / 14 Pro */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/api/splash?w=1179&h=2556" />
        {/* iPhone 14 Plus / 13 Pro Max / 12 Pro Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/api/splash?w=1284&h=2778" />
        {/* iPhone 14 / 13 / 13 Pro / 12 / 12 Pro */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/api/splash?w=1170&h=2532" />
        {/* iPhone 13 mini / 12 mini */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/api/splash?w=1125&h=2436" />
        {/* iPhone 11 Pro Max / XS Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/api/splash?w=1242&h=2688" />
        {/* iPhone 11 / XR */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/api/splash?w=828&h=1792" />
        {/* iPhone SE 3rd/2nd gen / 8 / 7 */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/api/splash?w=750&h=1334" />
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
