import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "DataShield — AI Training Data Marketplace",
  description: "The trust layer for AI training data. Upload, certify, and trade datasets on 0G.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <div className="pt-[84px]">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
