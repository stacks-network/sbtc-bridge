"use client";

import { useNotifications } from "@/hooks/use-notifications";
import {
  bridgeConfigAtom,
  depositMaxFeeAtom,
  showConnectWalletAtom,
  walletInfoAtom,
} from "@/util/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { NotificationStatusType } from "./Notifications";
import { getAggregateKey } from "@/util/get-aggregate-key";
import { principalCV, serializeCVBytes } from "@stacks/transactions";
import {
  createDepositAddress,
  createDepositScript,
  createReclaimScript,
} from "@/util/depositRequest";

import {
  bytesToHex as uint8ArrayToHexString,
  hexToBytes as hexToUint8Array,
} from "@stacks/common";
import { FlowContainer } from "./core/FlowContainer";
import { Heading, SubText } from "./core/Heading";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { PrimaryButton } from "./core/FlowButtons";

import { getEmilyDepositInfo } from "@/util/tx-utils";
import { getRawTransaction } from "@/actions/bitcoinClient";
import getBitcoinNetwork from "@/util/get-bitcoin-network";

const RecoverManager = () => {
  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();

  const { notify } = useNotifications();

  const walletInfo = useAtomValue(walletInfoAtom);
  const maxFee = useAtomValue(depositMaxFeeAtom);

  const setShowConnectWallet = useSetAtom(showConnectWalletAtom);
  const config = useAtomValue(bridgeConfigAtom);

  const isConnected = useMemo(() => !!walletInfo.selectedWallet, [walletInfo]);

  const txId = useMemo(
    () => searchParams.get("txId") || searchParams.get("txid"),
    [searchParams],
  );

  const stxAddress = useMemo(
    () => searchParams.get("stxAddress") || searchParams.get("stxaddress"),
    [searchParams],
  );
  useEffect(() => {
    checkIfEmilyIsAware();
  }, []);

  const checkIfEmilyIsAware = async () => {
    try {
      // ensure txId is present
      if (!txId) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "Invalid URL parameters",
        });
        throw new Error("Invalid URL parameters");
      }

      const txInfo = await getEmilyDepositInfo({
        txId,
        emilyURL: config.EMILY_URL!,
      });

      if (txInfo.reclaimScript) {
        //setShowStepper(true);
        getTransactionAmount();
      }
    } catch (err: any) {
      console.warn("checkIfEmilyIsAware", err);
      throw new Error(err);
    }
  };

  // reuse some logic to get the amount in order to return the user to their status check
  const getTransactionAmount = async () => {
    try {
      if (!stxAddress || !txId) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "Invalid URL parameters",
        });
        throw new Error("User not connected");
      }

      const signersAggregatePubKey = (await getAggregateKey()).slice(2);

      const serializedAddress = serializeCVBytes(principalCV(stxAddress));

      const paymentAddress = walletInfo.addresses.payment!;

      const reclaimPublicKey = paymentAddress.publicKey;

      const parsedLockTime = parseInt(config.RECLAIM_LOCK_TIME! || "144");

      const p2trAddress = createDepositAddress(
        serializedAddress,
        signersAggregatePubKey!,
        maxFee,
        parsedLockTime,
        getBitcoinNetwork(config.WALLET_NETWORK),
        reclaimPublicKey,
      );

      const bitcoinReclaimTxInfo = (await getRawTransaction(txId))!;

      const outputs = bitcoinReclaimTxInfo.vout;

      const outputMatch = outputs.find((output: any) => {
        if (output.scriptpubkey_address) {
          return output.scriptpubkey_address === p2trAddress;
        } else {
          return false;
        }
      });

      if (!outputMatch) {
        notify({
          type: NotificationStatusType.ERROR,
          message: `No matching output address found tied to the transaction`,
        });
        throw new Error("No matching output address found");
      }

      const amount = outputMatch.value;

      const params = new URLSearchParams();

      params.set("txId", txId);
      params.set("step", String(1));
      params.set("amount", String(amount));
      params.set("stxaddress", String(stxAddress));
      router.push(`${pathname}?${params.toString()}`);
    } catch (err) {
      console.log("getTransactionAmount", err);
    }
  };

  const generateScripts = async () => {
    try {
      // ensure the user is signed in before proceeding
      if (!walletInfo.selectedWallet) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "Please connect your wallet to proceed",
        });
        throw new Error("User not connected");
      }

      // ensure that the stx address and txId are present
      if (!stxAddress || !txId) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "Invalid URL parameters",
        });
        throw new Error("User not connected");
      }

      const signersAggregatePubKey = (await getAggregateKey()).slice(2);

      // Combine the version and hash into a single Uint8Array
      const serializedAddress = serializeCVBytes(principalCV(stxAddress));

      // get the publicKey from the user payment address
      // user cannot continue if they're not connected
      const paymentAddress = walletInfo.addresses.payment!;

      const reclaimPublicKey = paymentAddress.publicKey;

      // Parse lockTime from env variable
      const parsedLockTime = parseInt(config.RECLAIM_LOCK_TIME! || "144");

      // Create the reclaim script and convert to Buffer
      const reclaimScript = Buffer.from(
        createReclaimScript(parsedLockTime, reclaimPublicKey),
      );

      const reclaimScriptHex = uint8ArrayToHexString(reclaimScript);

      const signerUint8Array = hexToUint8Array(signersAggregatePubKey!);

      const depositScript = Buffer.from(
        createDepositScript(signerUint8Array, maxFee, serializedAddress),
      );
      // convert buffer to hex
      const depositScriptHexPreHash = uint8ArrayToHexString(depositScript);

      const emilyReqPayload = {
        bitcoinTxid: txId,
        bitcoinTxOutputIndex: 0,
        reclaimScript: reclaimScriptHex,
        depositScript: depositScriptHexPreHash,
      };

      const p2trAddress = createDepositAddress(
        serializedAddress,
        signersAggregatePubKey!,
        maxFee,
        parsedLockTime,
        getBitcoinNetwork(config.WALLET_NETWORK),
        reclaimPublicKey,
      );

      const bitcoinReclaimTxInfo = (await getRawTransaction(txId))!;

      // ensure that one of the vout scriptpubkey_address matches the p2tr address we generated
      // if not, throw an error

      const outputs = bitcoinReclaimTxInfo.vout;

      const outputMatch = outputs.find((output: any) => {
        if (output.scriptpubkey_address) {
          return output.scriptpubkey_address === p2trAddress;
        } else {
          return false;
        }
      });

      if (!outputMatch) {
        notify({
          type: NotificationStatusType.ERROR,
          message: `No matching output address found tied to the transaction`,
        });
        throw new Error("No matching output address found");
      }

      const amount = outputMatch.value;

      // make emily post request
      const response = await fetch("/api/emilyDeposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emilyReqPayload),
      });

      if (!response.ok) {
        notify({
          type: NotificationStatusType.ERROR,
          message: `Issue with Request to Emily`,
        });

        throw new Error("Error with the request");
      }
      notify({
        type: NotificationStatusType.SUCCESS,
        message: `Request successful`,
      });

      const params = new URLSearchParams();

      params.set("txId", txId);
      params.set("step", String(1));
      params.set("amount", String(amount));
      params.set("stxaddress", String(stxAddress));

      router.push(`${pathname}?${params.toString()}`);
    } catch (err: any) {
      throw new Error(err);
    }
  };

  return (
    <>
      <FlowContainer>
        <>
          <div className="w-full flex flex-row items-center justify-between">
            <Heading>Recover Lost Transaction</Heading>
          </div>
          <SubText>
            In the rare situation where your transaction was lost, use this tool
            to ensure It is placed back on track within our system{" "}
          </SubText>
          <div className="flex flex-col  gap-2">
            <div className="flex flex-col gap-1">
              <SubText>Transaction ID</SubText>
              <p className="text-black break-all  font-Matter font-semibold text-sm">
                {txId || ""}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <SubText>Stacks address to transfer to</SubText>
              <p className="text-black font-Matter font-semibold text-sm">
                {stxAddress || ""}
              </p>
            </div>
          </div>
          <div className="flex flex-1 ">
            <div className="w-full p-4 bg-lightOrange h-10 rounded-lg flex flex-row items-center justify-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-orange" />
              <p className="text-orange font-Matter font-semibold text-sm break-keep">
                Please ensure the stacks address is correct before proceeding.
              </p>
            </div>
          </div>
          <div className="w-full flex-row flex justify-between items-center">
            {isConnected ? (
              <PrimaryButton onClick={() => generateScripts()}>
                RECOVER
              </PrimaryButton>
            ) : (
              <button
                type="button"
                onClick={() => setShowConnectWallet(true)}
                className="bg-orange px-4 py-2 rounded-md font-Matter text-xs font-semibold tracking-wide"
              >
                CONNECT WALLET
              </button>
            )}
          </div>
        </>
      </FlowContainer>
    </>
  );
};

export default RecoverManager;
