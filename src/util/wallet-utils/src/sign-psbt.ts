import { request } from "sats-connect";
import { DefaultNetworkConfigurations } from "@leather.io/models";
import { hexToBytes, bytesToHex } from "@stacks/common";
import {
  getFordefiBTCProviderOrThrow,
  getLeatherBTCProviderOrThrow,
} from "./util/btc-provider";

type SignPSBTParams = {
  hex: string;
  network?: DefaultNetworkConfigurations;
  address: string;
};
export async function signPSBTLeather({ hex, network }: SignPSBTParams) {
  const response = await getLeatherBTCProviderOrThrow()?.request("signPsbt", {
    network,
    hex,
  });
  if (!response) {
    throw new Error(`Error signing PSBT`);
  }
  return response.result.hex;
}

export async function signPSBTXverse({ hex, address }: SignPSBTParams) {
  const bytes = hexToBytes(hex);
  const base64 = btoa(String.fromCharCode(...bytes));

  const response = await request("signPsbt", {
    psbt: base64,
    signInputs: {
      [address]: [0],
    },
  });
  if (response.status === "error") {
    throw new Error(`Error signing PSBT`);
  }

  return base64ToHex(response.result.psbt);
}

export async function signPSBTFordefi({ hex, address }: SignPSBTParams) {
  const provider = await getFordefiBTCProviderOrThrow();
  const response = await provider.unisatProvider.signOrSignAndSendPsbt(hex, {
    autoFinalized: false,
    toSignInputs: [
      {
        index: 0,
        address,
      },
    ],
  });

  return response.hex;
}

export function base64ToHex(base64: string) {
  return bytesToHex(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
}
