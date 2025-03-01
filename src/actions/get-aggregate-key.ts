"use server";
import { fetchCallReadOnlyFunction, BufferCV } from "@stacks/transactions";
import { getStacksNetwork } from "../util/get-stacks-network";
import { env } from "@/env";

export async function getAggregateKey() {
  const { WALLET_NETWORK, SBTC_CONTRACT_DEPLOYER, STACKS_API_URL } = env;
  const network = getStacksNetwork(WALLET_NETWORK);

  const result = (await fetchCallReadOnlyFunction({
    contractName: "sbtc-registry",
    contractAddress: SBTC_CONTRACT_DEPLOYER!,
    functionName: "get-current-aggregate-pubkey",
    functionArgs: [],
    network: network,
    senderAddress: SBTC_CONTRACT_DEPLOYER!,
    client: {
      baseUrl: STACKS_API_URL,
    },
  })) as BufferCV;

  return result.value;
}
