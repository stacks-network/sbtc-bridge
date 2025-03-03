"use client";

import { atom, createStore } from "jotai";
import { NotificationEventType } from "@/comps/Notifications";
import getSbtcBridgeConfig from "@/actions/get-sbtc-bridge-config";
import { atomWithStorage } from "jotai/utils";

type AsignaUser = {
  _id: string;
  address: string;
  __v: number;
  publicKey: string;
  walletClass: string;
  walletType: string;
};

export const store = createStore();

export type BridgeConfig = Awaited<ReturnType<typeof getSbtcBridgeConfig>>;

export const bridgeConfigAtom = atom<BridgeConfig>({
  EMILY_URL: undefined,
  WALLET_NETWORK: undefined,
  SBTC_CONTRACT_DEPLOYER: undefined,
  BANNER_CONTENT: undefined,
  RECLAIM_LOCK_TIME: undefined,
  PUBLIC_MEMPOOL_URL: "",
  SUPPORT_LINK: undefined,
  POLLING_INTERVAL: 5000,
  MEMPOOL_API_URL: "",
});
export const depositMaxFeeAtom = atom(80000);

export const showTosAtom = atom<boolean>(false);

export const eventsAtom = atom<NotificationEventType[]>([]);
export enum WalletProvider {
  LEATHER = "leather",
  XVERSE = "xverse",
  ASIGNA = "asigna",
  FORDEFI = "fordefi",
}

type Address = {
  address: string;
  publicKey: string;
};

export const walletInfoAtom = atomWithStorage<{
  selectedWallet: WalletProvider | null;
  addresses: {
    // can't call this p2wpkh because xverse sometimes uses segwit rather than native segwit
    payment: Address | null;
    taproot: Address | null;
    stacks: Address | null;
    musig: {
      users: AsignaUser[];
      threshold: number;
    } | null;
  };
}>("walletInfoV3", {
  selectedWallet: null,
  addresses: {
    payment: null,
    taproot: null,
    stacks: null,
    musig: null,
  },
});
