import * as bitcoin from "bitcoinjs-lib";

import { hexToBytes as hexToUint8Array } from "@stacks/common";

import { Taptree } from "bitcoinjs-lib/src/types";

import * as bip341 from "bitcoinjs-lib/src/payments/bip341";

import ecc from "@bitcoinerlab/secp256k1";
import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";
import { hexToBytes } from "@stacks/common";

bitcoin.initEccLib(ecc);

export const NUMS_X_COORDINATE = new Uint8Array([
  0x50, 0x92, 0x9b, 0x74, 0xc1, 0xa0, 0x49, 0x54, 0xb7, 0x8b, 0x4b, 0x60, 0x35,
  0xe9, 0x7a, 0x5e, 0x07, 0x8a, 0x5a, 0x0f, 0x28, 0xec, 0x96, 0xd5, 0x47, 0xbf,
  0xee, 0x9a, 0xce, 0x80, 0x3a, 0xc0,
]);

// Helper function to convert a little-endian 8-byte number to big-endian
const flipEndian = (buffer: Uint8Array): Uint8Array => {
  const flipped = new Uint8Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    flipped[i] = buffer[buffer.length - 1 - i];
  }
  return flipped;
};

export const createDepositScript = (
  signersPubKey: Uint8Array,
  maxFee: number,
  recipientBytes: Uint8Array,
) => {
  const opDropData = recipientBytes;

  // maxFee should be BE its in LE rn

  // Convert maxFee to LE buffer (as an 8-byte buffer)
  const LEmaxFee = Buffer.alloc(8);
  // We use UInt32LE for writing the fee
  LEmaxFee.writeUInt32LE(maxFee, 0);

  // Convert the little-endian maxFee to big-endian
  const BEmaxFee = flipEndian(LEmaxFee);

  // Concat maxfee and opdropdata
  const opDropDataTogether = new Uint8Array(
    BEmaxFee.length + opDropData.length,
  );
  opDropDataTogether.set(BEmaxFee);
  opDropDataTogether.set(opDropData, BEmaxFee.length);

  return bitcoin.script.compile([
    opDropDataTogether,
    bitcoin.opcodes.OP_DROP,
    signersPubKey,
    bitcoin.opcodes.OP_CHECKSIG,
  ]);
};

export const createReclaimScript = (
  lockTime: number,
  leafPubkeys: string[],
  threshold: number = 1,
) => {
  const { script, opcodes } = bitcoin;

  if (leafPubkeys.length < 1) {
    throw new Error("Incorrect number of leaf public keys");
  }

  if (threshold > leafPubkeys.length || threshold <= 0) {
    throw new Error("Incorrect threshold");
  }

  let leafScriptAsm = [
    toXOnly(hexToBytes(leafPubkeys[0])),
    opcodes.OP_CHECKSIG,
  ];

  if (leafPubkeys.length > 1) {
    leafScriptAsm = [
      ...leafScriptAsm,
      ...leafPubkeys
        .slice(1)
        .flatMap((p) => [toXOnly(hexToBytes(p)), opcodes.OP_CHECKSIGADD]),
      script.number.encode(threshold),
      opcodes.OP_NUMEQUAL,
    ];
  }

  const lockTimeEncoded = script.number.encode(lockTime);

  const buildScript = script.compile([
    lockTimeEncoded,
    opcodes.OP_CHECKSEQUENCEVERIFY,
    opcodes.OP_DROP,
    ...leafScriptAsm,
  ]);

  return buildScript;
};

export const createDepositAddress = (
  stxAddress: Uint8Array,
  signerPubKey: string,
  maxFee: number,
  lockTime: number,
  network: bitcoin.networks.Network,
  reclaimPublicKeys: string[],
  threshold: number = 1,
): string => {
  const internalPubkey = hexToUint8Array(signerPubKey);

  // Create the reclaim script and convert to Buffer
  const reclaimScript = Buffer.from(
    createReclaimScript(lockTime, reclaimPublicKeys, threshold),
  );

  // Create the deposit script and convert to Buffer

  const recipientBytes = stxAddress;
  const depositScript = Buffer.from(
    createDepositScript(internalPubkey, maxFee, recipientBytes),
  );

  // Combine the leaves into a Merkle root
  const merkleRoot = bip341.toHashTree([
    { output: depositScript },
    { output: reclaimScript },
  ]);

  const scriptTree: Taptree = [
    {
      output: depositScript,
    },
    {
      output: reclaimScript,
    },
  ];

  // Create an internal public key (replace with actual internal public key if available)

  // Create the final taproot public key by tweaking internalPubkey with merkleRoot

  // Step 1: Generate the tweak

  const tweak = bip341.tapTweakHash(NUMS_X_COORDINATE, merkleRoot.hash);

  // Step 2: Apply the tweak to the internal public key to get the tweaked Taproot output key

  const taprootPubKey = bip341.tweakKey(NUMS_X_COORDINATE, tweak);

  if (taprootPubKey === null) {
    throw new Error("Failed to tweak the internal public key.");
  }

  // Step 1: Convert the Taproot public key to a P2TR address
  const p2tr = bitcoin.payments.p2tr({
    internalPubkey: NUMS_X_COORDINATE, // The tweaked Taproot public key
    network: network,
    scriptTree: scriptTree,
  }) as bitcoin.Payment;

  // Validate the output script is correct (P2TR has a specific witness program structure)
  const outputScript = p2tr.output;
  if (outputScript) {
    const isValid = outputScript.length === 34 && outputScript[0] === 0x51; // P2TR is version 1 witness program
    if (!isValid) {
      throw new Error("P2TR output is invalid.");
    }
  } else {
    throw new Error("Failed to generate P2TR output.");
  }

  if (p2tr === undefined) {
    throw new Error("Output is undefined");
  }

  if ("address" in p2tr && typeof p2tr.address === "string") {
    return p2tr.address;
  } else {
    throw new Error("Could not create address");
  }
};
