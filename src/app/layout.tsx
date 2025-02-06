import { Inter } from "next/font/google";

import "./globals.css";
import LayoutClient from "./layout-client";
import getSbtcBridgeConfig from "@/actions/get-sbtc-bridge-config";
import { ChatBubbleLeftIcon } from "@heroicons/react/20/solid";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sBTCBridgeConfig = await getSbtcBridgeConfig();

  return (
    <html lang="en">
      <head>
        <title>sBTC Bridge</title>
        <meta name="description" content="sBTC Bridge" />
        <meta property="og:title" content="sBTC Bridge" />
        <meta property="og:description" content="sBTC Bridge" />
        <meta property="og:site_name" content="sBTC Bridge" />
        <meta property="og:image:alt" content="sBTC Bridge" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@stacks" />
        <meta name="twitter:title" content="sBTC Bridge" />
        <meta name="twitter:description" content="sBTC Bridge" />
        <meta name="twitter:image" content="/images/icon.png" />
        <meta name="twitter:image:alt" content="sBTC Bridge" />
      </head>
      <body className={inter.className}>
        <LayoutClient config={sBTCBridgeConfig}>{children}</LayoutClient>
        {sBTCBridgeConfig.SUPPORT_LINK && (
          <a
            href={sBTCBridgeConfig.SUPPORT_LINK}
            target="_blank"
            title="Support"
            className={
              "fixed z-90 bottom-20 right-8 bg-orange w-20 " +
              "h-20 rounded-full drop-shadow-lg flex justify-center " +
              "items-center text-white text-4xl"
            }
          >
            <ChatBubbleLeftIcon className="w-8 h-8 text-black" />
          </a>
        )}
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
