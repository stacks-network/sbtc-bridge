"use server";
import {
  Cl,
  fetchCallReadOnlyFunction,
  ResponseOkCV,
  UIntCV,
} from "@stacks/transactions";
import { env } from "@/env";
import { getStacksNetwork } from "@/util/get-stacks-network";

/**
 *
 * @description gets the total sbtc balance of an address this includes both locked and avaialable sbtc
 */
export default async function getSbtcTotalBalance({
  address,
}: {
  address: string;
}) {
  const { WALLET_NETWORK, SBTC_CONTRACT_DEPLOYER, STACKS_API_URL } = env;
  const network = getStacksNetwork(WALLET_NETWORK);

  const response = (await fetchCallReadOnlyFunction({
    contractAddress: SBTC_CONTRACT_DEPLOYER!,
    contractName: "sbtc-token",
    functionName: "get-balance",
    functionArgs: [Cl.address(address)],
    network: network,
    senderAddress: address,
    client: {
      baseUrl: STACKS_API_URL,
    },
  })) as ResponseOkCV<UIntCV>;

  return response.value.value;
}
