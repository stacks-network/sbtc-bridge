"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo } from "react";

import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import Btc from "@ledgerhq/hw-app-btc";

import { AnimatePresence } from "framer-motion";
import { useAtom, useAtomValue } from "jotai";
import {
  BridgeConfig,
  showConnectWalletAtom,
  showTosAtom,
  walletInfoAtom,
  showConnectLedgerAtom,
  hardwareWalletInfoAtom,
  HardwareWalletProvider,
  ledgerTransportAtom,
  ledgerBtcAtom,
} from "@/util/atoms";

import ConnectWallet from "./ConnectWallet";
import { GetTestnetBTC } from "./get-testnet-btc";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationStatusType } from "./Notifications";
import SBTCBalance from "./ui/sbtc-balance";
import TOS from "./tos";
import useMintCaps from "@/hooks/use-mint-caps";
import LedgerConnect from "./ledger/ledger-connect";

// converting to lower case to avoid case sensitive issue

const Header = ({ config }: { config: BridgeConfig }) => {
  const { notify } = useNotifications();

  const { currentCap } = useMintCaps();

  const showTos = useAtomValue(showTosAtom);

  const [walletInfo, setWalletInfo] = useAtom(walletInfoAtom);

  const [hardwareWalletInfo, setHardwareWalletInfo] = useAtom(
    hardwareWalletInfoAtom,
  );

  const [transport, setTransport] = useAtom(ledgerTransportAtom);

  const [btc, setBtc] = useAtom(ledgerBtcAtom);

  const [showConnectWallet, setShowConnectWallet] = useAtom(
    showConnectWalletAtom,
  );

  const [showConnectLedger, setShowConnectLedger] = useAtom(
    showConnectLedgerAtom,
  );

  useEffect(() => {
    // ensure that if the hardware wallet is in local storage, we connect to it
    if (
      hardwareWalletInfo.selectedHardware === HardwareWalletProvider.LEDGER &&
      (transport === null || btc === null)
    ) {
      // only attempt to connect to it if the isConnected flag is false
      handleConnectLedger();
    }
  }, [hardwareWalletInfo]);

  const isConnected = useMemo(() => {
    return (
      !!walletInfo.selectedWallet ||
      // not as elegant for a check but at the moment this is the only hardware wallet we have in the app
      (!!hardwareWalletInfo.selectedHardware && !!transport && !!btc)
    );
  }, [walletInfo, hardwareWalletInfo]);

  const stacksAddress = useMemo(() => {
    if (walletInfo.selectedWallet) {
      return walletInfo.addresses.stacks!.address;
    } else {
      // if we're using a hardware wallet we won't be able to know the stx address
      return "";
    }
  }, [walletInfo, hardwareWalletInfo]);

  const handleSignOut = () => {
    setWalletInfo({
      selectedWallet: null,
      addresses: {
        payment: null,
        taproot: null,
        stacks: null,
      },
    });
    setHardwareWalletInfo({
      selectedHardware: null,
      addresses: {
        payment: null,
      },
    });
    setTransport(null);
    setBtc(null);
    notify({
      type: NotificationStatusType.SUCCESS,
      message: `Wallet disconnected`,
    });
  };

  const handleConnectLedger = async () => {
    try {
      // Request permission from the browser to access USB

      // Prompt user for Ledger device via WebHID
      const t = await TransportWebHID.create();
      console.log("t", t);

      if (!t) {
        console.error("Failed to connect to Ledger: No transport found");

        notify({
          message: "Failed to connect to Ledger: No transport found",
          type: NotificationStatusType.ERROR,
          expire: 10000,
        });

        return;
      }

      const btcApp = new Btc({
        transport: t,
      });

      console.log("btcApp", btcApp);

      setTransport(t as TransportWebHID);
      setBtc(btcApp);

      const derivationPath = "44'/1'/0'/0/0";

      const res = await btcApp.getWalletPublicKey(derivationPath, {
        verify: false, // set true if you want to confirm on-device
        format: "bech32", // e.g. for native SegWit addresses starting with tb1...
      });

      console.log("Testnet/Regtest Public Key Info:", res);

      console.log("Ledger connected successfully!");

      // set the hardware wallet info
      setHardwareWalletInfo({
        selectedHardware: HardwareWalletProvider.LEDGER,
        addresses: {
          payment: {
            address: res.bitcoinAddress,
            publicKey: res.publicKey,
          },
        },
      });
    } catch (err) {
      setHardwareWalletInfo({
        selectedHardware: null,
        addresses: {
          payment: null,
        },
      });

      console.error(err);
      notify({
        message: "Failed to connect to Ledger Please try again",
        type: NotificationStatusType.ERROR,
        expire: 10000,
      });
    }
  };

  const isMintCapReached = currentCap <= 0;
  const isTestnet =
    config.WALLET_NETWORK?.toLowerCase() === "sbtcTestnet".toLowerCase();

  const renderUserWalletInfo = () => {
    return (
      <>
        {isTestnet && <GetTestnetBTC />}
        {stacksAddress !== "" && <SBTCBalance address={stacksAddress} />}

        <button
          onClick={() => handleSignOut()}
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
            </h5>
            <h4 className="font-Matter text-xs text-black tracking-wide ">
              HISTORY
            </h4> */}
            {isConnected ? (
              renderUserWalletInfo()
            ) : (
              <button
                onClick={() => setShowConnectWallet(true)}
                disabled={isMintCapReached}
                className=" bg-orange  px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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

      <AnimatePresence>
        {showConnectWallet && (
          <ConnectWallet onClose={() => setShowConnectWallet(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showConnectLedger && (
          <LedgerConnect onClose={() => setShowConnectLedger(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>{showTos && <TOS />}</AnimatePresence>
    </>
  );
};

export default Header;
