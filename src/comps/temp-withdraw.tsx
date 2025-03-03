"use client";

import { useState } from "react";
import { FlowContainer } from "./core/FlowContainer";
import { FlowFormDynamic, NameKeysInfo } from "./core/Form";
import { Heading, SubText } from "./core/Heading";
import LandingAnimation from "./core/LandingAnimation";
import { DefaultNetworkConfigurations } from "@leather.io/models";
import { useRouter } from "next/navigation";

import { bytesToHex, hexToBytes } from "@stacks/common";

import * as bitcoin from "bitcoinjs-lib";
import { useAtomValue } from "jotai";
import { bridgeConfigAtom, walletInfoAtom } from "@/util/atoms";
import {
  bufferCV,
  makeUnsignedContractCall,
  PostConditionMode,
  serializeTransaction,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { serverBroadcastTx } from "@/actions/server-broadcast-tx";
import {
  callContract
} from "@/util/wallet-utils";
import { getStacksNetwork } from "@/util/get-stacks-network";

const decodeBitcoinAddressToClarityRecipient = (
  address: string,
  network: DefaultNetworkConfigurations,
) => {
  const lower = address.toLowerCase();
  const isMainnet = network === "mainnet";

  // check if passed in address is bech32
  let decodedBech32;
  let isBech32 = false;
  if (lower.startsWith("bc1") || lower.startsWith("bcrt1")) {
    try {
      decodedBech32 = bitcoin.address.fromBech32(address);
      isBech32 = true;
    } catch (err: any) {
      throw new Error(`Invalid bech32 address: ${err.message}`);
    }
  }

  if (isBech32 && decodedBech32) {
    const {
      prefix,
      version: witnessVersion,
      data: witnessProgram,
    } = decodedBech32;

    const hexHash = "0x" + bytesToHex(witnessProgram);
    if (isMainnet) {
      if (prefix !== "bc") {
        throw new Error(`Expected mainnet bech32 (bc1...), got ${prefix}`);
      }
    } else if (!isMainnet) {
      // regtest typically uses prefix 'bcrt'
      if (prefix !== "bcrt") {
        throw new Error(`Expected regtest bech32 (bcrt1...), got ${prefix}`);
      }
    }

    if (witnessVersion === 0) {
      if (witnessProgram.length === 20) {
        // P2WPKH
        return { version: "0x04", hashbytes: hexHash };
      } else if (witnessProgram.length === 32) {
        // P2WSH
        return { version: "0x05", hashbytes: hexHash };
      } else {
        throw new Error(
          `Unsupported witness v0 length=${witnessProgram.length}`,
        );
      }
    } else if (witnessVersion === 1 && witnessProgram.length === 32) {
      // P2TR
      return { version: "0x06", hashbytes: hexHash };
    } else {
      throw new Error(
        `Unrecognized witnessVersion=${witnessVersion}, length=${witnessProgram.length}`,
      );
    }
  }
};

const data: NameKeysInfo[] = [
  {
    nameKey: "address",
    type: "text",
    initValue: "",
    placeholder: "address to receive your Bitcoin",
  },
  {
    nameKey: "amount",
    type: "number",
    initValue: "",
    placeholder: "withdraw amount",
  },
  {
    nameKey: "fee",
    type: "number",
    initValue: "0.0008",
    placeholder: "the max fee",
  },
];

const BasicWithdraw = () => {
  const [txId, setTxId] = useState<string | null>(null);
  const { addresses } = useAtomValue(walletInfoAtom);
  const router = useRouter();

  const { WALLET_NETWORK, SBTC_CONTRACT_DEPLOYER } =
    useAtomValue(bridgeConfigAtom);

  const handleSubmit = async (values: Record<string, string>) => {
    console.log(values);
    const { address, amount, fee } = values;

    if (!WALLET_NETWORK) {
      throw new Error("Invalid network");
    }
    if (!SBTC_CONTRACT_DEPLOYER) {
      throw new Error("Invalid contract deployer");
    }
    // get the proper data for the address
    const recipient = decodeBitcoinAddressToClarityRecipient(
      address,
      WALLET_NETWORK,
    );

    if (!recipient) {
      throw new Error("Invalid recipient address");
    }
    const publicKey = addresses.stacks?.publicKey;

    if (!publicKey) {
      throw new Error("Invalid public key");
    }
    console.log(recipient);

    // convert the amount to satoshis
    const satoshiAmount = Math.round(parseFloat(amount) * 1e8);
    console.log("satoshiAmount", satoshiAmount);

    // convert the fee to satoshis
    const satoshiFee = Math.round(parseFloat(fee) * 1e8);

    const contractArgs = [
      uintCV(satoshiAmount),
      tupleCV({
        version: bufferCV(hexToBytes(recipient.version)),
        hashbytes: bufferCV(hexToBytes(recipient.hashbytes)),
      }),
      uintCV(satoshiFee),
    ];

    const stacksNetwork = getStacksNetwork(WALLET_NETWORK);

    const transaction = await makeUnsignedContractCall({
      contractAddress: SBTC_CONTRACT_DEPLOYER,
      contractName: "sbtc-withdrawal",
      functionName: "initiate-withdrawal-request",
      functionArgs: contractArgs,
      publicKey,
      validateWithAbi: true,
      network: stacksNetwork,
      fee: WALLET_NETWORK === "mainnet" ? undefined : 10_000,
      postConditionMode: PostConditionMode.Allow,
    });

    const signedTx = await callContract({
      txHex: serializeTransaction(transaction),
      network: stacksNetwork,
    });

    const broadcastResponse = await serverBroadcastTx({
      txHex: signedTx,
    });
    const txId = broadcastResponse.txid;
    router.push(`/withdraw?txId=${txId}`);
    // add tx to search query for the user to have a link to the tx

    setTxId(txId);
  };

  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Start Withdraw Transfer</Heading>
        </div>
        {txId && (
          <div className="flex flex-col gap-1">
            <SubText>Stacks TxID</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {txId}
            </p>
          </div>
        )}
        <FlowFormDynamic
          nameKeys={data}
          handleSubmit={(values) => handleSubmit(values)}
        />
      </>
    </FlowContainer>
  );
};

const TempWithdraw = () => {
  return (
    <>
      <LandingAnimation>
        <div className="w-screen flex "></div>
        <BasicWithdraw />
        <div
          style={{
            margin: "16px 0",
          }}
        />
      </LandingAnimation>
    </>
  );
};

export default TempWithdraw;
