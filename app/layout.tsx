import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "./components/WalletContextProvider";
import "@solana/wallet-adapter-react-ui/styles.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CDEX Coin Presale - Next Generation DEX Token",
  description: "Join the CDEX Coin presale and be part of the next generation decentralized exchange. Secure your tokens at the best price.",
  keywords: ["CDEX", "presale", "DEX", "cryptocurrency", "token sale", "DeFi"],
  icons: {
    icon: '/CDXG.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
