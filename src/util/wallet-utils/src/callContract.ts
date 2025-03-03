import { StacksNetwork, StacksNetworkName } from "@stacks/network";
import { request } from '@stacks/connect'

type RequestArgs = {
  txHex: string;
  network?: StacksNetworkName | StacksNetwork;
};

type CallContract = (params: RequestArgs) => Promise<string>;

export const callContract: CallContract = async (params) => {
  const response = await request("stx_signTransaction", {
    transaction: params.txHex,
    broadcast: false,
  });

  return response.transaction;
};
