import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION, APP_URL } from "@/lib/constants";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WalletProvider } from "@/providers/WalletProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     <head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
  <link href="..." rel="stylesheet" />
  <meta name="talentapp:project_verification" content="86558d79e107647d4dd8883335938b2b84e98404e5dba5a504659db4e5ab94d78ea48670dab74d9f5b13dc4ef746a3502e29bf14c6bb6303ebe9cd6116c90886" />
</head>
      <body className="min-h-screen bg-bg-primary text-text-primary font-body antialiased">
        <WalletProvider>
          <QueryProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 pt-[68px]">{children}</main>
              <Footer />
            </div>
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "rgba(13, 17, 23, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  color: "#fff",
                  backdropFilter: "blur(12px)",
                },
              }}
            />
          </QueryProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
