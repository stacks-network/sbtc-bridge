import { DefaultNetworkConfigurations } from "@leather.io/models";
import { hexToBytes, bytesToHex } from "@stacks/common";
import { request } from "@stacks/connect";

type SignPSBTParams = {
  hex: string;
  network?: DefaultNetworkConfigurations;
  address: string;
};

export async function signPSBTRequest({ hex, address }: SignPSBTParams) {
  const base64 = hexToBase64(hex);

  try {
    const result = await request("signPsbt", {
      psbt: base64,
      signInputs: [{ index: 0, address }],
    });

    return base64ToHex(result.psbt);
  } catch (e) {
    if (e instanceof Error) throw new Error(`Error signing PSBT: ${e.message}`);
    throw new Error(`Error signing PSBT`);
  }
}

function base64ToHex(base64: string) {
  return bytesToHex(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
}

function hexToBase64(hex: string) {
  return btoa(String.fromCharCode(...hexToBytes(hex)));
}
