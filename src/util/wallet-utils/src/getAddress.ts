import { AddressPurpose, request, RpcSuccessResponse } from "sats-connect";
import { DefaultNetworkConfigurations } from "@leather.io/models";

import { Address, BtcAddress } from "@leather.io/rpc";
import { getLeatherBTCProviderOrThrow } from "./util/btc-provider";

type Results = {
  /** @description payment address can be native segwit or segwit */
  payment: {
    address: string;
    publicKey: string;
  };
  /** @description taproot address */
  taproot: {
    address: string;
    publicKey: string;
  };
  /** @description stacks address */
  stacks: {
    address: string;
    publicKey: string;
  };
  musig: {
    users: AsignaUser[];
    threshold: number;
  } | null;
};

export type AsignaUser = {
  _id: string;
  address: string;
  __v: number;
  publicKey: string;
  walletClass: string;
  walletType: string;
};

export type getAddresses = (params?: {
  message?: string;
  network?: DefaultNetworkConfigurations;
  action?: () => Promise<any>;
}) => Promise<Results>;

const getAddressByPurpose = (
  response: RpcSuccessResponse<"getAddresses">["result"],
  purpose: AddressPurpose,
) => response.addresses.find((item) => item.purpose === purpose);

export function getWalletAddresses(
  response: RpcSuccessResponse<"getAddresses">["result"],
) {
  const taproot = getAddressByPurpose(response, AddressPurpose.Ordinals);
  if (!taproot) {
    throw new Error("Taproot address not found");
  }
  const payment = getAddressByPurpose(response, AddressPurpose.Payment);
  if (!payment) {
    throw new Error("Payment address not found");
  }

  const stacks = getAddressByPurpose(response, AddressPurpose.Stacks);
  if (!stacks) {
    throw new Error("Stacks address not found");
  }
  return {
    taproot: {
      address: taproot.address,
      publicKey: taproot.publicKey,
    },
    payment: {
      address: payment.address,
      publicKey: payment.publicKey,
    },
    stacks: {
      address: stacks.address,
      publicKey: stacks.publicKey,
    },
    musig: null,
  };
}

/**
 * @name getAddressXverse
 * @description Get the address for the user
 */
export const getAddressesXverse: getAddresses = async (params) => {
  const response = await request("getAddresses", {
    purposes: [
      AddressPurpose.Ordinals,
      AddressPurpose.Payment,
      AddressPurpose.Stacks,
    ],
  });

  if (response.status === "error") {
    throw new Error(response.error.message);
  }

  const result = response.result;
  return getWalletAddresses(result);
};

export const getAddressesAsigna: getAddresses = async (params) => {
  if (!params?.action) {
    throw new Error("Action is required");
  }
  const response = await params.action();
  return {
    taproot: {
      address: "",
      publicKey: "",
    },
    payment: {
      address: response.address,
      publicKey: response.publicKey,
    },
    stacks: {
      address: "",
      publicKey: "",
    },
    musig: {
      users: response.users,
      threshold: response.threshold,
    },
  };
};

const extractAddressByType = (
  addresses: Address[],
  addressType: BtcAddress["type"],
) => {
  const addressInfo = addresses.find(
    (address) => address.symbol === "BTC" && address.type === addressType,
  );
  if (!addressInfo) {
    throw new Error(
      "BTC address not found, please make sure to connect your bitcoin wallet on leather and try again",
    );
  }
  return {
    address: addressInfo.address,
    publicKey: addressInfo.publicKey,
  };
};
/**
 * @name getAddressesLeather
 * @description Get addresses for leather wallet
 */
export const getAddressesLeather: getAddresses = async () => {
  const btc = getLeatherBTCProviderOrThrow();
  const response = await btc.request("getAddresses");

  const { addresses } = response.result;
  const payment = extractAddressByType(addresses, "p2wpkh")!;
  const taproot = extractAddressByType(addresses, "p2tr")!;
  const stacks = addresses.find((address) => address.symbol === "STX");
  if (!stacks) {
    throw new Error(
      "No STX address found, please make sure to connect your stacks wallet on leather and try again",
    );
  }
  return {
    payment,
    taproot,
    stacks,
    musig: null,
  };
};
