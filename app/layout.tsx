import type { Metadata } from "next";

import "./globals.css";
import { assertSupabaseEnv } from "@/lib/env";

assertSupabaseEnv();

export const metadata: Metadata = {
  title: "Inflowr",
  description: "Private influencer and UGC campaign workspace"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
