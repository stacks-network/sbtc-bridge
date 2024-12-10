import * as bip341 from "bitcoinjs-lib/src/payments/bip341";
import * as bitcoin from "bitcoinjs-lib";

import { Taptree } from "bitcoinjs-lib/src/types";
import { buildLeafIndexFinalizer } from "./validateTapLeaf";

import { hexToBytes as hexToUint8Array } from "@stacks/common";
import { NUMS_X_COORDINATE } from "./depositRequest";

export const finalizePsbt = (psbtHex: string) => {
  try {
    const network = bitcoin.networks.regtest;

    const psbt = bitcoin.Psbt.fromHex(psbtHex, { network });
    psbt.finalizeAllInputs();

    return psbt.extractTransaction().toHex();
  } catch (err) {
    console.error("Error finalizing PSBT:", err);
    throw new Error("Error finalizing PSBT");
  }
};

export const createTransactionFromHex = (hex: string) => {
  const transaction = bitcoin.Transaction.fromHex(hex);
  return transaction.getId();
};
type ReclaimDepositProps = {
  feeAmount: number;
  depositAmount: number;

  lockTime: number;
  depositScript: string;
  reclaimScript: string;
  txId: string;
  vout: number;

  bitcoinReturnAddress: string;
};

export const constructPsbtForReclaim = ({
  depositAmount,
  feeAmount,

  lockTime,
  depositScript,
  reclaimScript,

  txId,
  vout,

  bitcoinReturnAddress,
}: ReclaimDepositProps) => {
  const uInt8DepositScript = hexToUint8Array(depositScript);
  const uInt8ReclaimScript = hexToUint8Array(reclaimScript);

  const scriptTree: Taptree = [
    {
      output: uInt8DepositScript,
    },
    {
      output: uInt8ReclaimScript,
    },
  ];

  const merkleeTree = bip341.toHashTree([
    { output: uInt8DepositScript },
    { output: uInt8ReclaimScript },
  ]);

  // Ensure Merkle is computed
  if (!merkleeTree || !merkleeTree.hash) {
    throw new Error("Failed to compute Merkle root.");
  }

  const network = bitcoin.networks.regtest;
  const psbt = new bitcoin.Psbt({ network });

  const p2trRes = bitcoin.payments.p2tr({
    internalPubkey: NUMS_X_COORDINATE,
    scriptTree,
    redeem: {
      output: uInt8ReclaimScript,
      redeemVersion: 192,
    },

    network: network,
  });

  if (!p2trRes.output || !p2trRes.redeem) {
    throw new Error("Failed to construct P2TR output.");
  }

  const tapLeafScript = {
    leafVersion: p2trRes.redeemVersion || 192,
    script: uInt8ReclaimScript,
    controlBlock: p2trRes.witness![p2trRes.witness!.length - 1],
  };

  psbt.addInput({
    hash: txId,
    index: vout,
    sequence: lockTime,

    witnessUtxo: {
      script: p2trRes.output,
      value: BigInt(depositAmount),
    },
    tapLeafScript: [tapLeafScript],
  });

  const leafIndexFinalizerFn = buildLeafIndexFinalizer(tapLeafScript, lockTime);

  //psbt.finalizeInput(0, leafIndexFinalizerFn);

  // Add the fee payer inputs

  const change = BigInt(depositAmount) - BigInt(feeAmount);

  psbt.addOutput({
    address: bitcoinReturnAddress,
    value: BigInt(change),
  });

  const psbtHex = psbt.toHex();

  return psbtHex;
};
