"use client";
import { useState } from "react";
import { PrimaryButton, PrimaryButtonExtended } from "../core/FlowButtons";
import Image from "next/image";

import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import Btc from "@ledgerhq/hw-app-btc";

import { useNotifications } from "@/hooks/use-notifications";
import { NotificationStatusType } from "../Notifications";

import {
  ledgerTransportAtom,
  ledgerBtcAtom,
  hardwareWalletInfoAtom,
  HardwareWalletProvider,
} from "@/util/atoms";
import { useAtom, useSetAtom } from "jotai";
import * as bitcoin from "bitcoinjs-lib";

import { Network, networks } from "bitcoinjs-lib";

import {
  bytesToHex as uint8ArrayToHexString,
  hexToBytes as hexToUint8Array,
} from "@stacks/common";

export const regtest: Network = {
  ...networks.testnet,
  bech32: "bcrt", // for addresses like bcrt1...
  // Optionally adjust these if needed:
  bip32: {
    public: 0x043587cf, // same as testnet
    private: 0x04358394,
  },
};

function compressPubKeyToUint8(pubKey: Uint8Array): Uint8Array {
  // If it's already compressed, just return it
  if (pubKey.length === 33 && (pubKey[0] === 0x02 || pubKey[0] === 0x03)) {
    return pubKey; // Already compressed
  }

  // Check for uncompressed (0x04 prefix, length 65)
  if (pubKey[0] !== 0x04 || pubKey.length !== 65) {
    throw new Error(
      "Invalid pubKey format. Expected uncompressed (65 bytes, starts with 0x04).",
    );
  }

  // The first 1 byte is 0x04. Next 32 bytes are the X coordinate; last 32 bytes are the Y coordinate.
  const x = pubKey.subarray(1, 33); // X coordinate
  const yIsOdd = (pubKey[64] & 1) === 1;
  const prefix = yIsOdd ? 0x03 : 0x02;

  // Create a new 33-byte array [prefix + X]
  const compressed = new Uint8Array(1 + x.length);
  compressed[0] = prefix;
  compressed.set(x, 1);

  return compressed;
}

const LedgerDevice = ({
  setCurrentStep,
}: {
  setCurrentStep: (step: number) => void;
}) => {
  const { notify } = useNotifications();

  const setTransport = useSetAtom(ledgerTransportAtom);
  const setBtc = useSetAtom(ledgerBtcAtom);
  const setHardwareWalletInfo = useSetAtom(hardwareWalletInfoAtom);

  /**
   * Connects to the Ledger device via WebUSB
   */
  const connectLedger = async () => {
    try {
      // Request permission from the browser to access USB

      // Prompt user for Ledger device via WebHID
      const t = await TransportWebHID.create();
      console.log("t", t);

      if (!t) {
        console.error("Failed to connect to Ledger: No transport found");

        notify({
          message: "Failed to connect to Ledger: No transport found",
          type: NotificationStatusType.ERROR,
          expire: 10000,
        });

        return;
      }

      const btcApp = new Btc({
        transport: t,
      });

      console.log("btcApp", btcApp);

      setTransport(t as TransportWebHID);
      setBtc(btcApp);

      const derivationPath = "44'/1'/0'/0/0";

      const res = await btcApp.getWalletPublicKey(derivationPath, {
        verify: false, // set true if you want to confirm on-device
        format: "bech32", // e.g. for native SegWit addresses starting with tb1...
      });

      console.log("Testnet/Regtest Public Key Info:", res);

      console.log("Ledger connected successfully!");

      // 4) Convert the Ledger’s public key (string hex) into a Buffer for bitcoinjs-lib
      const pubkeyUint = hexToUint8Array(res.publicKey);

      console.log("pubkeyUint", pubkeyUint);
      // 5) Build a P2WPKH address using our custom "regtest" network definition
      //    so it will begin with bcrt1...

      const compressedKeyUint8 = compressPubKeyToUint8(pubkeyUint);

      console.log("compressedKeyUint8", compressedKeyUint8);

      const { address: regtestAddress } = bitcoin.payments.p2wpkh({
        pubkey: compressedKeyUint8,
        network: regtest,
      });

      console.log("Regtest address:", regtestAddress);

      if (!regtestAddress) {
        notify({
          message: "Failed to generate regtest address",
          type: NotificationStatusType.ERROR,
          expire: 10000,
        });
        return;
      }

      // set the hardware wallet info
      setHardwareWalletInfo({
        selectedHardware: HardwareWalletProvider.LEDGER,
        addresses: {
          payment: {
            address: regtestAddress,
            publicKey: uint8ArrayToHexString(compressedKeyUint8),
          },
        },
      });
      setCurrentStep(2);

      t.close();
    } catch (error) {
      notify({
        message: "Ledger Error" + error,
        type: NotificationStatusType.ERROR,
        expire: 10000,
      });
      setCurrentStep(0);
      console.error("Failed to connect to Ledger:", error);
    }
  };

  return (
    <>
      <Image
        src="/images/ledgerLogo.svg"
        alt="Ledger Logo"
        width={150}
        height={150}
      />
      <PrimaryButtonExtended
        type="button"
        isValid={true}
        onClick={() => connectLedger()}
        buttonStyle="w-full mt-4"
      >
        Connect Ledger
      </PrimaryButtonExtended>
    </>
  );
};

export default LedgerDevice;
