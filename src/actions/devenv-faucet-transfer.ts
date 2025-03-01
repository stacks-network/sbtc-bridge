"use server";

import {
  rpcHandlerCore,
  RpcMethods,
} from "@/app/api/proxy/[...proxy]/rpc-handler-core";
import { env } from "@/env";
import * as bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import { ECPairFactory, ECPairAPI } from "ecpair";

const ECPair: ECPairAPI = ECPairFactory(ecc);

const senderAddy = "miEJtNKa3ASpA19v5ZhvbKTEieYjLpzCYT";
const network = bitcoin.networks.regtest;
export const devenvFaucetTransfer = async (value: {
  amount: string;
  receiverAddy: string;
}) => {
  try {
    if (env.WALLET_NETWORK !== "sbtcDevenv") {
      throw new Error("Only allowed in devenv")!;
    }
    const amount = parseInt(value.amount) || 0;
    const receiverAddy = value.receiverAddy || "";

    const senderPrivateKey = Buffer.from(
      "9e446f6b0c6a96cf2190e54bcd5a8569c3e386f091605499464389b8d4e0bfc2",
      "hex",
    );
    const senderKeyPair = ECPair.fromPrivateKey(senderPrivateKey, {
      network,
    });

    const utxosRes = await rpcHandlerCore(RpcMethods.scantxoutset, [
      "start",
      [{ desc: `addr(${senderAddy})`, range: 10000 }],
    ])
      .then((res) => res.json())
      .then((res) => res.result);
    // console.log("utxosRes", utxosRes);

    if (utxosRes.unspent === 0)
      throw new Error(`No UTXOs available for address ${senderAddy}`);

    let totalInput = 0;
    utxosRes.unspents.sort((a: any, b: any) => a.height - b.height);
    const inputs = [];
    for (const utxo of utxosRes.unspents) {
      const rawTxHex = await rpcHandlerCore(RpcMethods.getRawTransaction, [
        utxo.txid,
        true,
      ])
        .then((res) => res.json())
        .then((res) => res.result);
      // console.log("TransferAction -> Raw Transaction Hex:", rawTxHex);
      inputs.push({
        txid: utxo.txid,
        vout: utxo.vout,
        amount: utxo.amount,
        rawTxHex: rawTxHex.hex, // Store raw transaction hex for signing
        height: utxo.height,
      });
      totalInput += utxo.amount;
      if (totalInput >= amount) break;
    }

    if (totalInput < amount) throw new Error("Insufficient funds");

    const fee = 0.0002; // Adjust fee as needed
    const change = totalInput - amount - fee;

    const psbt = new bitcoin.Psbt({ network });

    // console.log("inputs", inputs);
    // Add inputs with nonWitnessUtxo for legacy address
    inputs.forEach((input) => {
      psbt.addInput({
        hash: input.txid,
        index: input.vout,
        nonWitnessUtxo: Buffer.from(input.rawTxHex, "hex"), // Use nonWitnessUtxo for legacy inputs
      });
    });

    // Add output to the receiver
    psbt.addOutput({
      address: receiverAddy,
      value: BigInt(Math.floor(amount * 1e8)), // Convert to satoshis
    });

    // Add change output if there's leftover
    if (change > 0) {
      psbt.addOutput({
        address: senderAddy,
        value: BigInt(Math.floor(change * 1e8)), // Convert to satoshis
      });
    }

    // Sign all inputs with the private key
    inputs.forEach((_, index) => {
      psbt.signInput(index, senderKeyPair);
    });

    // Finalize and extract the transaction
    psbt.finalizeAllInputs();
    const signedTx = psbt.extractTransaction().toHex();
    // console.log("Signed Transaction Hex:", signedTx);

    // Send the transaction to the Bitcoin network
    const txId = await rpcHandlerCore(RpcMethods.sendRawTransaction, [signedTx])
      .then((res) => res.json())
      .then((res) => res.result);
    // console.log("Transaction ID:", txId);

    return txId;
  } catch (err) {
    // console.log("err", err);
  }
};
