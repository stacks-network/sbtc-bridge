"use server";

import { env } from "@/env";
import { bitcoindUtxoFetch, mempoolFetchUntilOk } from "./mempool-api";

export interface BitcoinTransactionResponse {
  txid: string;
  version: number;
  locktime: number;
  size: number;
  weight: number;
  fee: number;
  vin: Vin[];
  vout: Vout[];
  status: Status;
  order: number;
  vsize: number;
  adjustedVsize: number;
  sigops: number;
  feePerVsize: number;
  adjustedFeePerVsize: number;
  effectiveFeePerVsize: number;
}

interface Vin {
  is_coinbase: boolean;
  prevout: Prevout;
  scriptsig: string;
  scriptsig_asm: string;
  sequence: number;
  txid: string;
  vout: number;
  witness: any[];
  inner_redeemscript_asm: string;
  inner_witnessscript_asm: string;
}

interface Prevout {
  value: number;
  scriptpubkey: string;
  scriptpubkey_address: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
}

interface Vout {
  value: number;
  scriptpubkey: string;
  scriptpubkey_address: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
}

interface Status {
  confirmed: boolean;
  block_height: number;
  block_hash: string;
  block_time: number;
}

export interface AddressUtxos {
  txid: string;
  vout: number;
  scriptPubKey: string;
  status: Status;
  value: number;
}

// Function to scan the UTXO set for an address
export const scanTxOutSet = async (
  address: string,
): Promise<AddressUtxos[]> => {
  if (env.WALLET_NETWORK !== "mainnet") {
    return bitcoindUtxoFetch(address).then((res) => res.json());
  }
  const result = await fetch(`${env.MEMPOOL_API_URL}/address/${address}/utxo`);
  return await result.json();
};

// Function to get a raw transaction
export const getRawTransaction = async (
  txid: string,
): Promise<BitcoinTransactionResponse | null> => {
  const result = await fetch(`${env.MEMPOOL_API_URL}/tx/${txid}`);
  if (result.status === 404) {
    return null;
  }
  return await result.json();
};

export const getTransactionHex = async (txid: string): Promise<string> => {
  const result = await mempoolFetchUntilOk(
    `${env.MEMPOOL_API_URL}/tx/${txid}/hex`,
  );
  if (result.status === 404) {
    throw new Error("Transaction not found");
  }

  if (!result.ok) {
    throw new Error("Error fetching transaction hex");
  }
  return await result.text();
};

export const getTxRbf = async (txid: string): Promise<boolean> => {
  const result = await fetch(`${env.MEMPOOL_API_URL}/v1/tx/${txid}/rbf`);
  return await result.json();
};

// Function to transmit a raw transaction to the network
export const transmitRawTransaction = async (hex: string): Promise<any> => {
  const baseURL = env.MEMPOOL_API_URL;

  const result = await fetch(`${baseURL}/tx`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: hex,
  });

  const res = await result.text();

  return res;
};

export const getCurrentBlockHeight = async () => {
  const result = await fetch(`${env.MEMPOOL_API_URL}/blocks/tip/height`);
  return Number(await result.text());
};
