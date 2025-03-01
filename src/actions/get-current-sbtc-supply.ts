"use server";

import { env } from "@/env";
import {
  fetchCallReadOnlyFunction,
  type ResponseOkCV,
  type UIntCV,
} from "@stacks/transactions";

import { getStacksNetwork } from "@/util/get-stacks-network";
export default async function getCurrentSbtcSupply() {
  const response = (await fetchCallReadOnlyFunction({
    contractAddress: env.SBTC_CONTRACT_DEPLOYER!,
    contractName: "sbtc-token",
    functionName: "get-total-supply",
    functionArgs: [],
    network: getStacksNetwork(env.WALLET_NETWORK),
    senderAddress: env.SBTC_CONTRACT_DEPLOYER!,
    client: {
      baseUrl: env.STACKS_API_URL,
    },
  })) as ResponseOkCV<UIntCV>;

  return response;
}
