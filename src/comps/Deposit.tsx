"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { InformationCircleIcon } from "@heroicons/react/20/solid";

import { FlowContainer } from "@/comps/core/FlowContainer";
import { Heading, SubText } from "@/comps/core/Heading";
import { FlowForm } from "@/comps/core/Form";
import { PrimaryButton, SecondaryButton } from "./core/FlowButtons";
import {
  bytesToHex as uint8ArrayToHexString,
  hexToBytes as hexToUint8Array,
} from "@stacks/common";
import * as yup from "yup";
import {
  createDepositAddress,
  createDepositScript,
  createReclaimScript,
} from "@/util/depositRequest";
import { useAtomValue } from "jotai";
import {
  bridgeConfigAtom,
  depositMaxFeeAtom,
  walletInfoAtom,
  WalletProvider,
} from "@/util/atoms";
import { NotificationStatusType } from "./Notifications";
import {
  createAddress,
  principalCV,
  serializeCVBytes,
} from "@stacks/transactions";

import { useShortAddress } from "@/hooks/use-short-address";
import { useNotifications } from "@/hooks/use-notifications";
import { DepositStepper } from "./deposit-stepper";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sendBTCLeather, sendBTCXverse } from "@/util/wallet-utils";
import useMintCaps from "@/hooks/use-mint-caps";
import { getAggregateKey } from "@/util/get-aggregate-key";
import getBitcoinNetwork from "@/util/get-bitcoin-network";
import { useAsignaConnect } from "@asigna/btc-connect";
import { useQuery } from "@tanstack/react-query";
import getBtcBalance from "@/actions/get-btc-balance";
import { useDepositStatus } from "@/hooks/use-deposit-status";
import { useEmilyDeposit } from "@/util/use-emily-deposit";

/*
  deposit flow has 3 steps
  1) enter amount you want to deposit
  - can change in what denomination you want to make deposit(satoshi, btc, usd)
  2) enter the stack address they want funds sent to
  3) confirm amount and stacks transaction address
  - create payment request
  - view payment status in history
*/

/*
  each step will have it's own custom configuration about how to deal with this data and basic parsing
  - we should create bulding blocks by not try to create dynamic views
*/

enum DEPOSIT_STEP {
  AMOUNT,
  ADDRESS,
  CONFIRM,
  REVIEW,
}

/*
  basic structure of a flow step
  1) heading with sometime a action item to the right of the heading
  2) subtext to give context to the user with the possibility of tags
  3) form to collect data or the final step which is usually reviewing all data before submitting (or even revewing post submission)
  4) buttons to navigate between steps
*/
type DepositFlowStepProps = {
  setStep: (step: DEPOSIT_STEP) => void;
};

type DepositFlowAmountProps = DepositFlowStepProps & {
  setAmount: (amount: number) => void;
  btcBalance: number;
};
const DepositFlowAmount = ({
  setStep,
  setAmount,
  btcBalance,
}: DepositFlowAmountProps) => {
  const { currentCap, isWithinDepositLimits, isLoading, perDepositMinimum } =
    useMintCaps();
  const maxDepositAmount = currentCap / 1e8;
  const minDepositAmount = perDepositMinimum / 1e8;
  const isMintCapReached = currentCap <= 0;

  const validationSchema = useMemo(
    () =>
      yup.object({
        amount: yup
          .number()
          // dust amount is in sats
          .min(
            minDepositAmount,
            `Minimum deposit amount is ${minDepositAmount} BTC`,
          )
          .max(
            Math.min(btcBalance, maxDepositAmount),
            btcBalance < maxDepositAmount
              ? `The deposit amount exceeds your current balance of ${btcBalance} BTC`
              : `Current deposit cap is ${maxDepositAmount} BTC`,
          )
          .required(),
      }),
    [btcBalance, maxDepositAmount, minDepositAmount],
  );
  const handleSubmit = async (value: string | undefined) => {
    if (value) {
      const sats = Math.floor(Number(value) * 1e8);
      if (await isWithinDepositLimits(sats)) {
        setAmount(Number(sats));
        setStep(DEPOSIT_STEP.ADDRESS);
      }
    }
  };
  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Deposit</Heading>
        </div>
        <SubText>Convert BTC into sBTC</SubText>

        <SubText>
          Note: an additional fee (max 80k sats) will be automatically deducted
          from your deposited sBTC to cover the network transaction fee.{" "}
          <a
            className="text-blue-500 underline"
            href="https://docs.stacks.co/guides-and-tutorials/sbtc/how-to-use-the-sbtc-bridge#choose-the-amount-to-deposit"
            target="_blank"
            rel="noreferrer"
          >
            More Info
          </a>
        </SubText>

        <FlowForm
          nameKey="amount"
          type="number"
          placeholder={
            isMintCapReached
              ? "Mint cap reached!"
              : "BTC amount to transfer (e.g. 0.01)"
          }
          disabled={isLoading || isMintCapReached}
          handleSubmit={(value) => handleSubmit(value)}
          validationSchema={validationSchema}
        />
      </>
    </FlowContainer>
  );
};

type DepositFlowAddressProps = DepositFlowStepProps & {
  setStxAddress: (address: string) => void;
};

const DepositFlowAddress = ({
  setStep,
  setStxAddress,
}: DepositFlowAddressProps) => {
  const { WALLET_NETWORK: stacksNetwork } = useAtomValue(bridgeConfigAtom);

  const { notify } = useNotifications();
  const validateStxAddress = (addressOrContract: string) => {
    // validate the address

    try {
      // check length
      const isContractAddress = addressOrContract.includes(".");
      const [address, contractName] = addressOrContract.split(".");
      if (address.length < 38 || address.length > 41) {
        return false;
      }
      // smart contract names shouldn't exceed 64 characters
      if (
        isContractAddress &&
        (contractName.length < 3 || contractName.length > 64)
      ) {
        return false;
      }

      const MAINNET_PREFIX = ["SP", "SM"];
      const TESTNET_PREFIX = ["ST", "SN"];
      const validPrefix =
        stacksNetwork === "mainnet" ? MAINNET_PREFIX : TESTNET_PREFIX;

      if (!validPrefix.some((prefix) => address.startsWith(prefix))) {
        return false;
      }

      // check if valid for network
      createAddress(address);

      return true;
    } catch (err) {
      return false;
    }
  };
  const handleSubmit = (value: string | undefined) => {
    if (value) {
      // ensure that the value is a valid stacks address based on the network and length
      if (validateStxAddress(value)) {
        setStxAddress(value);
        setStep(DEPOSIT_STEP.CONFIRM);
      } else {
        notify({
          type: NotificationStatusType.ERROR,
          message: `Invalid Stacks Address`,
        });
      }
    }
  };
  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Deposit</Heading>
        </div>
        <SubText>Amount selected to transfer</SubText>
        <FlowForm
          nameKey="address"
          type="text"
          placeholder="Enter Stacks address to transfer to"
          handleSubmit={(value) => handleSubmit(value)}
        >
          <SecondaryButton
            onClick={() => setStep(DEPOSIT_STEP.AMOUNT)}
            isValid={true}
          >
            PREV
          </SecondaryButton>
        </FlowForm>
      </>
    </FlowContainer>
  );
};

type DepositFlowConfirmProps = DepositFlowStepProps & {
  amount: number;
  stxAddress: string;
  handleUpdatingTransactionInfo: (info: TransactionInfo) => void;
};

const DepositFlowConfirm = ({
  setStep,
  amount,
  stxAddress,
  handleUpdatingTransactionInfo,
}: DepositFlowConfirmProps) => {
  const { notify } = useNotifications();

  const { WALLET_NETWORK: walletNetwork, RECLAIM_LOCK_TIME: lockTime } =
    useAtomValue(bridgeConfigAtom);

  const maxFee = useAtomValue(depositMaxFeeAtom);
  const config = useAtomValue(bridgeConfigAtom);
  const { notifyEmily, isPending: isPendingNotifyEmily } = useEmilyDeposit();

  const { openSignBtcAmount } = useAsignaConnect();

  const walletInfo = useAtomValue(walletInfoAtom);
  const handleNextClick = async () => {
    try {
      const signersAggregatePubKey = (await getAggregateKey()).slice(2);

      // Combine the version and hash into a single Uint8Array
      const serializedAddress = serializeCVBytes(principalCV(stxAddress));

      // get the publicKey from the user payment address
      // user cannot continue if they're not connected
      const paymentAddress = walletInfo.addresses.payment!;

      let reclaimPublicKeys = [paymentAddress.publicKey];
      let signatureThreshold = 1;

      if (walletInfo.selectedWallet === WalletProvider.ASIGNA) {
        const { threshold, users } = walletInfo.addresses.musig!;
        signatureThreshold = threshold;
        reclaimPublicKeys = users.map((user) => user.publicKey);
      }

      // Parse lockTime from env variable
      const parsedLockTime = parseInt(lockTime || "144");

      // Create the reclaim script and convert to Buffer
      const reclaimScript = Buffer.from(
        createReclaimScript(
          parsedLockTime,
          reclaimPublicKeys,
          signatureThreshold,
        ),
      );

      const reclaimScriptHex = uint8ArrayToHexString(reclaimScript);

      const signerUint8Array = hexToUint8Array(signersAggregatePubKey!);

      const depositScript = Buffer.from(
        createDepositScript(signerUint8Array, maxFee, serializedAddress),
      );
      // convert buffer to hex
      const depositScriptHexPreHash = uint8ArrayToHexString(depositScript);
      const p2trAddress = createDepositAddress(
        serializedAddress,
        signersAggregatePubKey!,
        maxFee,
        parsedLockTime,
        getBitcoinNetwork(config.WALLET_NETWORK),
        reclaimPublicKeys,
        signatureThreshold,
      );

      let txId = "";
      let txHex = "";

      try {
        const params = {
          recipient: p2trAddress,
          amountInSats: amount,
          network: walletNetwork,
        };
        console.log({
          preSendParams: {
            bitcoinTxid: txId,
            bitcoinTxOutputIndex: 0,
            reclaimScript: reclaimScriptHex,
            depositScript: depositScriptHexPreHash,
          },
        });

        switch (walletInfo.selectedWallet) {
          case WalletProvider.LEATHER:
            txId = await sendBTCLeather(params);
            break;
          case WalletProvider.XVERSE:
            txId = await sendBTCXverse(params);
            break;
          case WalletProvider.ASIGNA:
            txId = await openSignBtcAmount(params, true);
            break;
        }
      } catch (error) {
        let errorMessage = error;
        console.warn(error);
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        notify({
          type: NotificationStatusType.ERROR,
          message: `Issue with Transaction ${errorMessage}`,
        });
        return;
      }

      const emilyReqPayload = {
        bitcoinTxid: txId,
        bitcoinTxOutputIndex: 0,
        reclaimScript: reclaimScriptHex,
        depositScript: depositScriptHexPreHash,
      };

      // make emily post request
      const response = await notifyEmily(emilyReqPayload);

      if (!response.ok) {
        notify({
          type: NotificationStatusType.ERROR,
          message: `Issue with Request to Emily`,
        });

        throw new Error("Error with the request");
      }

      notify({
        type: NotificationStatusType.SUCCESS,
        message: `Successful Deposit request`,
      });
      setStep(DEPOSIT_STEP.REVIEW);
      handleUpdatingTransactionInfo({
        hex: txHex,
        txId: txId,
      });
    } catch (error) {
      console.warn(error);
      let errorMessage = error;
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      notify({
        type: NotificationStatusType.ERROR,
        message: `Error while depositing funds: ${errorMessage}`,
      });
    }
  };
  const handlePrevClick = () => {
    setStep(DEPOSIT_STEP.ADDRESS);
  };

  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Deposit</Heading>
        </div>
        <div className="flex flex-col  gap-2">
          <div className="flex flex-col gap-1">
            <SubText>Amount selected to Transfer</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {amount / 1e8} BTC
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <SubText>Stacks address to transfer to</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {useShortAddress(stxAddress)}
            </p>
          </div>
        </div>
        <div className="flex flex-1 ">
          <div className="w-full p-4 bg-lightOrange h-10 rounded-lg flex flex-row items-center justify-center gap-2">
            <InformationCircleIcon className="h-6 w-6 text-orange" />
            <p className="text-orange font-Matter font-semibold text-sm break-keep">
              Please verify the information before proceeding
            </p>
          </div>
        </div>
        <div className="w-full flex-row flex justify-between items-center">
          <SecondaryButton
            disabled={isPendingNotifyEmily}
            onClick={handlePrevClick}
          >
            PREV
          </SecondaryButton>
          <PrimaryButton
            disabled={isPendingNotifyEmily}
            onClick={handleNextClick}
          >
            NEXT
          </PrimaryButton>
        </div>
      </>
    </FlowContainer>
  );
};

type TransactionInfo = {
  hex: string;
  txId: string;
};
type DepositFlowReviewProps = DepositFlowStepProps & {
  txId: string;
  amount: number;
  stxAddress: string;
};

const DepositFlowReview = ({ txId }: DepositFlowReviewProps) => {
  const {
    confirmedBlockHeight,
    currentBlockHeight,
    status,
    recipient,
    stacksTxId,
    statusResponse,
  } = useDepositStatus(txId);

  const { WALLET_NETWORK: walletNetwork } = useAtomValue(bridgeConfigAtom);
  const btcAmount = useMemo(() => {
    return (statusResponse?.vout[0].value || 0) / 1e8;
  }, [statusResponse?.vout]);

  const showDepositWarning = useMemo(() => {
    if (confirmedBlockHeight === 0) {
      return false;
    } else {
      const elapsedBlocks = currentBlockHeight - confirmedBlockHeight;

      return elapsedBlocks >= 6;
    }
  }, [confirmedBlockHeight, currentBlockHeight]);
  const bridgeConfig = useAtomValue(bridgeConfigAtom);
  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Review Transaction</Heading>
        </div>
        <div className="flex flex-col  gap-2">
          <div className="flex flex-col gap-1">
            <SubText>Amount selected to Transfer</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {btcAmount} BTC
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <SubText>Stacks address to transfer to</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {useShortAddress(recipient)}
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-end">
          <SubText>
            To avoid losing your progress, please keep this page open.
          </SubText>
        </div>
        {bridgeConfig.SUPPORT_LINK && showDepositWarning && (
          <div className="flex flex-1 items-end">
            <SubText>
              There is a delay in processing your deposit, but signers are still
              working on it and your funds are secure. Please contact our{" "}
              <a
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 underline"
                href={bridgeConfig.SUPPORT_LINK}
              >
                support team here
              </a>{" "}
              to help us expedite it.
            </SubText>
          </div>
        )}
        <div className="flex flex-1 items-end">
          <DepositStepper status={status} txId={txId} />
        </div>

        {stacksTxId && (
          <div className="w-full flex-row flex justify-between items-center">
            <a
              className="w-40 rounded-lg py-3 flex justify-center items-center flex-row bg-orange"
              href={`https://explorer.hiro.so/txid/${stacksTxId}?chain=${
                walletNetwork === "mainnet" ? "mainnet" : "testnet"
              }`}
              target="_blank"
              rel="noreferrer"
            >
              View stacks tx
            </a>
          </div>
        )}
      </>
    </FlowContainer>
  );
};

const DepositFlow = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [step, _setStep] = useState(DEPOSIT_STEP.AMOUNT);

  const [stxAddress, _setStxAddress] = useState(
    searchParams.get("stxAddress") ?? "",
  );
  const [amount, _setAmount] = useState(
    Number(searchParams.get("amount") ?? 0),
  );
  const [txId, _setTxId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (step === DEPOSIT_STEP.REVIEW) {
      params.set("txId", txId);
      params.set("step", String(step));
      params.set("amount", String(amount));
      router.push(pathname + "?" + params.toString());
    }
  }, [amount, txId, step, router, pathname]);

  useEffect(() => {
    const currentStep = Number(searchParams.get("step"));
    if (!currentStep) {
      _setStep(DEPOSIT_STEP.AMOUNT);
    }
    if (currentStep === DEPOSIT_STEP.REVIEW) {
      _setStep(currentStep);
      _setTxId(searchParams.get("txId") || "");
      _setAmount(Number(searchParams.get("amount") || 0));
    }
  }, [searchParams]);

  const setTxId = useCallback((info: TransactionInfo) => {
    _setTxId(info.txId);
  }, []);
  const setStep = useCallback((newStep: DEPOSIT_STEP) => {
    _setStep(newStep);
  }, []);

  const handleUpdateStep = useCallback(
    (newStep: DEPOSIT_STEP) => {
      setStep(newStep);
    },
    [setStep],
  );

  const setStxAddress = useCallback((address: string) => {
    _setStxAddress(address);
  }, []);

  const setAmount = useCallback((amount: number) => {
    _setAmount(amount);
  }, []);

  const handleUpdatingTransactionInfo = useCallback(
    (info: TransactionInfo) => {
      setTxId(info);
    },
    [setTxId],
  );
  const { addresses } = useAtomValue(walletInfoAtom);
  const btcAddress = addresses.payment?.address;
  const { data: btcBalance } = useQuery({
    queryKey: ["btcBalance", btcAddress],
    queryFn: async () => {
      if (!btcAddress) {
        return 0;
      }
      return await getBtcBalance(btcAddress);
    },
    enabled: !!btcAddress,
  });
  const renderStep = () => {
    switch (step) {
      case DEPOSIT_STEP.AMOUNT:
        return (
          <DepositFlowAmount
            btcBalance={btcBalance || Infinity}
            setAmount={setAmount}
            setStep={handleUpdateStep}
          />
        );
      case DEPOSIT_STEP.ADDRESS:
        return (
          <DepositFlowAddress
            setStxAddress={setStxAddress}
            setStep={handleUpdateStep}
          />
        );
      case DEPOSIT_STEP.CONFIRM:
        return (
          <DepositFlowConfirm
            setStep={handleUpdateStep}
            amount={amount}
            stxAddress={stxAddress}
            handleUpdatingTransactionInfo={handleUpdatingTransactionInfo}
          />
        );
      case DEPOSIT_STEP.REVIEW:
        return (
          <DepositFlowReview
            txId={txId}
            amount={amount}
            stxAddress={stxAddress}
            setStep={handleUpdateStep}
          />
        );
      default:
        return <div> Something went wrong</div>;
    }
  };

  return (
    <>
      {renderStep()}
      <div
        style={{
          margin: "16px 0",
        }}
      />
    </>
  );
};

export default DepositFlow;
