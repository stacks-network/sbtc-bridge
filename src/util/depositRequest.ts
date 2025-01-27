import * as bitcoin from "bitcoinjs-lib";

import { hexToBytes as hexToUint8Array } from "@stacks/common";

import { Taptree } from "bitcoinjs-lib/src/types";

import * as bip341 from "bitcoinjs-lib/src/payments/bip341";

import ecc from "@bitcoinerlab/secp256k1";

bitcoin.initEccLib(ecc);

// Pubkey, derived from NUMS pubkey with derivation path "0/0".
// Read about NUMS:
// https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#constructing-and-spending-taproot-outputs
export const DERIVED_NUMS_X_COORDINATE = new Uint8Array([
  0x4a, 0x30, 0xb2, 0xe4, 0x61, 0xb2, 0x80, 0xc0, 0xb1, 0x3a, 0x03, 0x79, 0x90,
  0x96, 0xab, 0x12, 0x56, 0x58, 0x91, 0x53, 0xfc, 0x4b, 0x9c, 0x8c, 0xea, 0xd1,
  0x6d, 0xc0, 0xb6, 0x42, 0x06, 0x97,
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
  userPublicKey: string,
): Uint8Array => {
  const { script, opcodes } = bitcoin;

  // Convert the user public key to a Uint8Array
  const pubkey = hexToUint8Array(userPublicKey);
  // remove the 0x04 prefix
  const schnorrPublicKey = pubkey.slice(1);

  // Encode lockTime
  const lockTimeEncoded = script.number.encode(lockTime);

  // Return the combined Uint8Array
  const buildScript = script.compile([
    lockTimeEncoded,
    opcodes.OP_CHECKSEQUENCEVERIFY,
    opcodes.OP_DROP,
    schnorrPublicKey,
    opcodes.OP_CHECKSIG,
  ]);

  return buildScript;
};

export const createDepositAddress = (
  stxAddress: Uint8Array,
  signerPubKey: string,
  maxFee: number,
  lockTime: number,
  network: bitcoin.networks.Network,
  reclaimPublicKey: string,
): string => {
  const internalPubkey = hexToUint8Array(signerPubKey);

  // Create the reclaim script and convert to Buffer
  const reclaimScript = Buffer.from(
    createReclaimScript(lockTime, reclaimPublicKey),
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

  const tweak = bip341.tapTweakHash(DERIVED_NUMS_X_COORDINATE, merkleRoot.hash);

  // Step 2: Apply the tweak to the internal public key to get the tweaked Taproot output key

  const taprootPubKey = bip341.tweakKey(DERIVED_NUMS_X_COORDINATE, tweak);

  if (taprootPubKey === null) {
    throw new Error("Failed to tweak the internal public key.");
  }

  // Step 1: Convert the Taproot public key to a P2TR address
  const p2tr = bitcoin.payments.p2tr({
    internalPubkey: DERIVED_NUMS_X_COORDINATE, // The tweaked Taproot public key
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
