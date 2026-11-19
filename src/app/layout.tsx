import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://margin-student.vercel.app"
  ),
  title: "Margin — Student Task & Assignment Manager",
  description: "Minimalist student personal task manager with Canvas LMS and Google Calendar integration.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Margin",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Margin — Student Task & Assignment Manager",
    description: "Minimalist student personal task manager with Canvas LMS and Google Calendar integration.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Margin — Student Task & Assignment Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Margin — Student Task & Assignment Manager",
    description: "Minimalist student personal task manager with Canvas LMS and Google Calendar integration.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground transition-colors selection:bg-blue-500 selection:text-white">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration skipped or failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
