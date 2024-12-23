"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DepositTimeline from "./deposit/deposit-timeline";
import DepositAmount from "./deposit/deposit-amount";
import DepositAddress from "./deposit/add-stacks-address";
import ConfirmDeposit from "./deposit/confirm-deposit";
import TransactionConfirmed from "./deposit/transaction-confirmed";
import { useQuery } from "@tanstack/react-query";
import getBtcBalance from "@/actions/get-btc-balance";
import { useAtomValue } from "jotai";
import { walletInfoAtom } from "@/util/atoms";
import { useDepositStatus } from "@/hooks/use-deposit-status";

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

export enum DEPOSIT_STEP {
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

export type DepositFlowAmountProps = DepositFlowStepProps & {
  setAmount: (amount: number) => void;
  btcBalance: number;
};
export type DepositFlowAddressProps = DepositFlowStepProps & {
  setStxAddress: (address: string) => void;
  stxAddress: string;
  amount: number;
};

export type DepositFlowConfirmProps = DepositFlowStepProps & {
  amount: number;
  stxAddress: string;
  handleUpdatingTransactionInfo: (info: TransactionInfo) => void;
};

type TransactionInfo = {
  hex: string;
  txId: string;
};
export type DepositFlowReviewProps = DepositFlowStepProps & {
  txId: string;
  amount: number;
  stxAddress: string;
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

  const {
    // confirmedBlockHeight,
    // currentBlockHeight,
    status,
    recipient,
    statusResponse,
    stacksTxId,
  } = useDepositStatus(txId);

  const btcAmount = useMemo(() => {
    return statusResponse?.vout[0].value || 0;
  }, [statusResponse?.vout]);

  // const showDepositWarning = useMemo(() => {
  //   if (confirmedBlockHeight === 0) {
  //     return false;
  //   } else {
  //     const elapsedBlocks = currentBlockHeight - confirmedBlockHeight;

  //     return elapsedBlocks >= 6;
  //   }
  // }, [confirmedBlockHeight, currentBlockHeight]);
  const renderStep = () => {
    switch (step) {
      case DEPOSIT_STEP.AMOUNT:
        return (
          <DepositAmount
            amount={amount}
            btcBalance={btcBalance || Infinity}
            setAmount={setAmount}
            setStep={handleUpdateStep}
          />
        );
      case DEPOSIT_STEP.ADDRESS:
        return (
          <DepositAddress
            stxAddress={stxAddress}
            setStxAddress={setStxAddress}
            setStep={handleUpdateStep}
            amount={amount}
          />
        );
      case DEPOSIT_STEP.CONFIRM:
        return (
          <ConfirmDeposit
            amount={amount}
            stxAddress={stxAddress}
            setStep={handleUpdateStep}
            handleUpdatingTransactionInfo={handleUpdatingTransactionInfo}
          />
        );
      case DEPOSIT_STEP.REVIEW:
        return (
          <TransactionConfirmed
            amount={btcAmount}
            stxAddress={recipient}
            setStep={handleUpdateStep}
            txId={txId}
          />
        );
      default:
        return <div> Something went wrong</div>;
    }
  };

  return (
    <>
      <div
        style={{
          maxWidth: "1152px",
        }}
        className="w-full flex flex-row gap-4 mt-16"
      >
        {renderStep()}
        <DepositTimeline
          stacksTxId={stacksTxId}
          status={status}
          txId={txId}
          activeStep={step}
        />
      </div>

      <div
        style={{
          margin: "16px 0",
        }}
      />
    </>
  );
};

export default DepositFlow;
