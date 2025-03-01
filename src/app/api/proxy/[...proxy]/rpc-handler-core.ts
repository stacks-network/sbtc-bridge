import "server-only";
import { env } from "@/env";

const { BITCOIND_URL, BITCOIN_RPC_PASSWORD, BITCOIN_RPC_USER_NAME } = env;
//  supported prc methods
export enum RpcMethods {
  sendRawTransaction = "sendrawtransaction",
  scantxoutset = "scantxoutset",
  getRawTransaction = "getrawtransaction",
}

export type RpcRequestParams = any[];

export const rpcHandlerCore = async (
  method: RpcMethods,
  params: RpcRequestParams,
): Promise<any> => {
  const headers = {
    "Content-Type": "application/json",
    Authorization:
      "Basic " + btoa(`${BITCOIN_RPC_USER_NAME}:${BITCOIN_RPC_PASSWORD}`),
  };

  const body = JSON.stringify({
    jsonrpc: "1.0",
    id: `${method}-${Date.now()}`,
    method: method,
    params,
  });

  try {
    const response = await fetch(BITCOIND_URL, {
      method: "POST",
      headers: headers,
      body: body,
    });

    return response;
  } catch (err) {
    // good for debugging
    // eslint-disable-next-line no-console
    console.error(`rpcHandlerCore ${method} error:`, err);
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

export async function getUtxosBitcoinDaemon(address: string) {
  const args = ["start", [{ desc: `addr(${address})`, range: 10000 }]];

  const result = await rpcHandlerCore(RpcMethods.scantxoutset, args)
    .then((res) => res.json())
    .then((res) => res.result);
  if (!result || !result.unspents || result.unspents.length === 0) {
    return Response.json([]);
  }
  const utxos = result.unspents.map((utxo: any) => ({
    txid: utxo.txid,
    vout: utxo.vout,
    scriptPubKey: utxo.scriptPubKey,
    status: {
      confirmed: true,
      block_height: utxo.height, // Use the height from the main RPC result
      block_hash: result.bestblock, // Use the bestblock from the RPC result
      block_time: Math.floor(Date.now() / 1000), // You can replace this with an actual block time if available
    },
    value: Math.round(utxo.amount * 1e8), // Convert BTC amount to satoshis
  }));
  return Response.json(utxos);
}
