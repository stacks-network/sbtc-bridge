"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { AnimatePresence } from "framer-motion";
import { useAtomValue } from "jotai";

import useMintCaps from "@/hooks/use-mint-caps";
import { BridgeConfig, showTosAtom, walletInfoAtom } from "@/util/atoms";
import {
  useConnectWallet,
  useDisconnectWallet,
} from "../hooks/use-connect-wallet";
import { GetTestnetBTC } from "./get-testnet-btc";
import TOS from "./tos";
import SBTCBalance from "./ui/sbtc-balance";

// converting to lower case to avoid case sensitive issue

const Header = ({ config }: { config: BridgeConfig }) => {
  const showTos = useAtomValue(showTosAtom);

  const isTestnet =
    config.WALLET_NETWORK?.toLowerCase() === "sbtcTestnet".toLowerCase();

  const walletInfo = useAtomValue(walletInfoAtom);

  const connectWallet = useConnectWallet();
  const disconnectWallet = useDisconnectWallet();

  const isConnected = useMemo(() => !!walletInfo.selectedWallet, [walletInfo]);

  const { currentCap } = useMintCaps();

  const isMintCapReached = currentCap <= 0;

  const renderUserWalletInfo = () => {
    return (
      <>
        {isTestnet && <GetTestnetBTC />}
        <SBTCBalance address={walletInfo.addresses.stacks!.address} />
        <button
          onClick={() => disconnectWallet()}
          className="px-4 py-2 rounded-md border-2 border-orange"
        >
          <h3 className="font-Matter text-xs text-orange font-semibold tracking-wide">
            DISCONNECT WALLET
          </h3>
        </button>
      </>
    );
  };
  return (
    <>
      {config.BANNER_CONTENT && (
        <div
          className="w-full bg-[#F26969] text-white text-center py-2"
          dangerouslySetInnerHTML={{ __html: config.BANNER_CONTENT }}
        />
      )}
      <header className="w-full py-6 flex items-center justify-center">
        <div
          style={{
            maxWidth: "1200px",
          }}
          className="flex-1 px-4 flex-row flex items-center justify-between"
        >
          <Link href="/">
            <div className="">
              <Image
                src="/images/StacksNav.svg"
                alt="Stacks Logo"
                width={100}
                height={100}
              />
            </div>
          </Link>
          <div className="flex flex-row gap-10 items-center">
            {/* <h5 className="font-Matter text-xs text-black tracking-wide ">
              LEARN MORE
            </h5> */}
            {isConnected && config.WALLET_NETWORK !== "mainnet" && (
              <Link href="/withdraw" className="text-xs text-black underline">
                Withdraw
              </Link>
            )}
            {isConnected ? (
              renderUserWalletInfo()
            ) : (
              <button
                onClick={() => connectWallet()}
                disabled={isMintCapReached}
                className="bg-orange px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <h3 className="font-Matter text-xs font-semibold tracking-wide">
                  CONNECT WALLET
                </h3>
              </button>
            )}
          </div>
        </div>
      </header>
      {/* <Metrics /> */}

      <AnimatePresence>{showTos && <TOS />}</AnimatePresence>
    </>
  );
};

export default Header;
