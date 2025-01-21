import { disconnect, getSelectedProviderId, request } from "@stacks/connect";
import { useAtomValue, useSetAtom } from "jotai";
import { NotificationStatusType } from "../comps/Notifications";
import {
  bridgeConfigAtom,
  showTosAtom,
  walletInfoAtom,
  WalletProvider,
} from "../util/atoms";
import { useNotifications } from "./use-notifications";

export function useConnectWallet() {
  const { notify } = useNotifications();

  const { WALLET_NETWORK } = useAtomValue(bridgeConfigAtom);

  const setWalletInfo = useSetAtom(walletInfoAtom);
  const setShowTos = useSetAtom(showTosAtom);

  return async () => {
    try {
      const res = await request({ forceWalletSelect: true }, "getAddresses");

      const stx = res.addresses.find((a) => a.address.startsWith("S"));
      const taproot = res.addresses.find((a) => isAddressTaproot(a.address));
      const payment = res.addresses.find(
        (a) =>
          a.address !== stx?.address &&
          a.address !== taproot?.address &&
          ("purpose" in a && a.purpose) !== "ordinals",
      );

      const isMainnetAddress =
        payment?.address.startsWith("bc1") || payment?.address.startsWith("3");
      if (WALLET_NETWORK !== "mainnet" && isMainnetAddress) {
        throw new Error(`Please switch to ${WALLET_NETWORK} network`);
      } else if (WALLET_NETWORK === "mainnet" && !isMainnetAddress) {
        throw new Error(
          `Please switch to ${WALLET_NETWORK} network and use a segwit address`,
        );
      }

      setWalletInfo({
        selectedWallet: providerIdToEnum(getSelectedProviderId()) || null,
        addresses: {
          payment: payment || taproot || null,
          taproot: taproot || null,
          stacks: stx || null,
        },
      });
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
}

export function useDisconnectWallet() {
  const { notify } = useNotifications();
  const setWalletInfo = useSetAtom(walletInfoAtom);

  return () => {
    disconnect();
    setWalletInfo({
      selectedWallet: null,
      addresses: {
        payment: null,
        taproot: null,
        stacks: null,
      },
    });
    notify({
      type: NotificationStatusType.SUCCESS,
      message: `Wallet disconnected`,
    });
  };
}

function isAddressTaproot(address: string) {
  const PREFIXES = ["bc1p", "tb1p", "bcrt1p"];
  const LENGTHS = [62, 62, 64];

  const index = PREFIXES.findIndex((p) => address.startsWith(p));
  if (index === -1) return false;

  return address.length === LENGTHS[index];
}

function providerIdToEnum(
  providerId: string | null,
): WalletProvider | undefined {
  if (!providerId) return undefined;
  providerId = providerId.toLowerCase();
  if (providerId.includes("leather")) return WalletProvider.LEATHER;
  if (providerId.includes("xverse")) return WalletProvider.XVERSE;
}
