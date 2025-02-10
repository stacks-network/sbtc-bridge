import { motion } from "framer-motion";
import { Heading, SubText } from "./core/Heading";
import Image from "next/image";
import { ArrowRightIcon, ArrowUpRightIcon } from "@heroicons/react/20/solid";
import {
  bridgeConfigAtom,
  showTosAtom,
  walletInfoAtom,
  WalletProvider,
} from "@/util/atoms";
import {
  checkAvailableWallets,
  getAddressesLeather,
  getAddressesXverse,
} from "@/util/wallet-utils";
import { useAtomValue, useSetAtom } from "jotai";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationStatusType } from "./Notifications";
import { useEffect, useState } from "react";
import {
  getAddresses,
  getAddressesAsigna,
} from "@/util/wallet-utils/src/getAddress";
import { useAsignaConnect } from "@asigna/btc-connect";

const WALLET_PROVIDERS = [
  {
    image: "/images/leather.svg",
    name: "Leather",
    walletProvider: WalletProvider.LEATHER,
    installUrl: "https://leather.io",
  },
  {
    image: "/images/xverse.svg",
    name: "Xverse",
    walletProvider: WalletProvider.XVERSE,
    installUrl: "https://xverse.app",
  },
  {
    image: "/images/AsignaMultisig.svg",
    name: "Asigna Multisig",
    walletProvider: WalletProvider.ASIGNA,
    installUrl: "https://btc.asigna.io",
  },
];

type ConnectWalletProps = {
  onClose: () => void;
};
const ConnectWallet = ({ onClose }: ConnectWalletProps) => {
  const [availableWallets, setAvailableWallets] = useState<{
    [key in WalletProvider]: boolean;
  }>({
    leather: false,
    xverse: false,
    asigna: false,
  });
  useEffect(() => {
    checkAvailableWallets().then(setAvailableWallets);
  }, []);

  const setWalletInfo = useSetAtom(walletInfoAtom);

  const setShowTos = useSetAtom(showTosAtom);

  const { notify } = useNotifications();
  const { WALLET_NETWORK } = useAtomValue(bridgeConfigAtom);
  const { connect: asignaConnect } = useAsignaConnect();

  const handleSelectWallet = async (wallet: WalletProvider) => {
    try {
      let addresses: Awaited<ReturnType<getAddresses>> | null = null;
      switch (wallet) {
        case WalletProvider.LEATHER:
          addresses = await getAddressesLeather();
          break;
        case WalletProvider.XVERSE:
          addresses = await getAddressesXverse();
          break;
        case WalletProvider.ASIGNA:
          addresses = await getAddressesAsigna({ action: asignaConnect });
      }
      const isMainnetAddress =
        addresses.payment.address.startsWith("bc1") ||
        addresses.payment.address.startsWith("3");
      if (WALLET_NETWORK !== "mainnet" && isMainnetAddress) {
        throw new Error(`Please switch to ${WALLET_NETWORK} network`);
      } else if (WALLET_NETWORK === "mainnet" && !isMainnetAddress) {
        throw new Error(
          `Please switch to ${WALLET_NETWORK} network and use a segwit address`,
        );
      }

      setWalletInfo({
        selectedWallet: wallet,
        addresses: addresses,
      });
      onClose();

      setShowTos(true);
    } catch (error) {
      console.warn(error);
      if (error instanceof Error) {
        error = error.message;
      }
      notify({
        message: String(error),
        type: NotificationStatusType.ERROR,
        expire: 10000,
      });
    }
  };

  return (
    <motion.div
      initial={{ x: "0", opacity: 0 }}
      animate={{ x: "0", opacity: 1 }}
      onClick={() => onClose()}
      className="fixed inset-0 bg-black text-black bg-opacity-50 flex items-center justify-center md:p-4 z-20"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFF5EB",
        }}
        className=" rounded-lg  flex flex-col items-center justify-between p-6 w-full h-screen sm:h-[500px] sm:w-[340px]  shadow-lg"
      >
        <div className="w-full flex flex-col gap-2 items-center justify-center">
          <Heading>Connect Wallet</Heading>
          <SubText>To Start Using the Bridge</SubText>
        </div>
        <Image
          src="/images/StacksBitcoin.svg"
          alt="Stacks Bitcoin"
          width={150}
          height={150}
        />
        <div className="w-full flex flex-col gap-4 items-center justify-center">
          {WALLET_PROVIDERS.map((provider, index) => {
            const available = availableWallets[provider.walletProvider];
            const openInstall = () => {
              if (available) {
                handleSelectWallet(provider.walletProvider);
              } else {
                window.open(provider.installUrl, "_blank");
              }
            };

            return (
              <button
                type="button"
                key={`wallet-${index}-${provider.walletProvider}`}
                onClick={openInstall}
                className={
                  "font-Matter flex w-full items-center justify-between p-3 hover:bg-gray-100 rounded cursor-pointer transition"
                }
              >
                <div className="flex items-center">
                  <Image
                    className={
                      (available ? "" : "opacity-50 grayscale ") + "rounded"
                    }
                    src={provider.image}
                    height={48}
                    width={48}
                    alt={provider.name}
                  />
                  <p className="ml-4 text-black">
                    {provider.walletProvider === WalletProvider.ASIGNA &&
                    !available ? (
                      "Open as an embedded app in Asigna"
                    ) : (
                      <>
                        {provider.name}
                        {""}
                        {!available && " is not available click to install"}
                      </>
                    )}
                  </p>
                </div>
                {available ? (
                  <ArrowRightIcon className="h-6 w-6" />
                ) : (
                  <ArrowUpRightIcon className="h-8 w-8" />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConnectWallet;
