import {
  getProviderOrThrow,
  RpcErrorResponse,
  RpcSuccessResponse,
} from "sats-connect";
import {
  getFordefiBTCProviderOrThrow,
  getLeatherBTCProviderOrThrow,
} from "./util/btc-provider";
import { DefaultNetworkConfigurations } from "@leather.io/models";

type Payload = {
  recipient: string;
  amountInSats: number;
  network?: DefaultNetworkConfigurations;
};

export async function sendBTCLeather({
  amountInSats,
  recipient,
  network,
}: Payload) {
  const btc = getLeatherBTCProviderOrThrow();
  const response = await btc.request("sendTransfer", {
    recipients: [
      {
        address: recipient,
        amount: String(amountInSats),
      },
    ],
    network,
  });

  const result = response.result;
  return result.txid.replace(/"|'/g, "");
}

export async function sendBTCXverse({ amountInSats, recipient }: Payload) {
  const btc = await getProviderOrThrow();
  const response = await btc.request("sendTransfer", {
    recipients: [
      {
        address: recipient,
        amount: amountInSats,
      },
    ],
  });

  const error = (response as RpcErrorResponse).error;
  if (error) {
    throw new Error(error.message);
  }
  const result = (response as RpcSuccessResponse<"sendTransfer">).result;
  return result.txid;
}

export async function sendBTCFordefi({ amountInSats, recipient }: Payload) {
  const btc = await getFordefiBTCProviderOrThrow();
  const response = await btc.request("sendTransfer", {
    recipients: [
      {
        address: recipient,
        amount: amountInSats,
      },
    ],
  });

  const error = (response as RpcErrorResponse).error;
  if (error) {
    throw new Error(error.message);
  }
  const result = (response as any).result;
  return result.txId;
}
