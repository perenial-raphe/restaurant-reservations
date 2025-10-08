import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";
import NavBar from "@/src/components/NavBar";

export const metadata: Metadata = {
  title: "Restaurant Reservations",
  description: "Book a table and manage your reservations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <Providers>
          <NavBar />
          <main style={{ maxWidth: 800, margin: "24px auto", padding: "0 16px" }}>{children}</main>
        </Providers>
      </body>
    </html>
  );
}