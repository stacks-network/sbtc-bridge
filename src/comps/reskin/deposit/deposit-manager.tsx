"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { Form, Formik } from "formik";
import * as yup from "yup";

import useMintCaps from "@/hooks/use-mint-caps";
import { DepositStatus, useDepositStatus } from "@/hooks/use-deposit-status";
import { walletInfoAtom } from "@/util/atoms";
import getBtcBalance from "@/actions/get-btc-balance";

import DepositTimeline from "./deposit-timeline";
import DepositAmount from "./deposit-amount";
import DepositAddress from "./add-stacks-address";
import ConfirmDeposit from "./confirm-deposit";
import TransactionConfirmed from "./transaction-confirmed";

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
export type DepositFlowStepProps = {
  setStep: (step: DEPOSIT_STEP) => void;
};

export type DepositFlowAddressProps = DepositFlowStepProps & {
  setStxAddress: (address: string) => void;
  stxAddress: string;
  amount: number;
};

export type DepositFlowConfirmProps = DepositFlowStepProps & {
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
  const [txId, setTxId] = useState("");

  const initialValues = useMemo(() => {
    const currentStep = Number(searchParams.get("step"));
    if (!currentStep) {
      return {
        amount: "",
        stxAddress: "",
      };
    }
    return {
      amount: searchParams.get("amount") ?? "",
      stxAddress: searchParams.get("stxAddress") ?? "",
    };
  }, [searchParams]);

  useEffect(() => {
    const currentStep = Number(searchParams.get("step"));
    if (!currentStep) {
      _setStep(DEPOSIT_STEP.AMOUNT);
    }
    if (currentStep === DEPOSIT_STEP.REVIEW) {
      _setStep(currentStep);
      setTxId(searchParams.get("txId") || "");
    }
  }, [searchParams]);

  const setStep = useCallback((newStep: DEPOSIT_STEP) => {
    _setStep(newStep);
  }, []);

  const handleUpdatingTransactionInfo = useCallback(
    (
      info: TransactionInfo,
      values: { amount?: string; stxAddress?: string },
    ) => {
      setTxId(info.txId);
      const params = new URLSearchParams();
      params.set("txId", info.txId);
      params.set("step", String(DEPOSIT_STEP.REVIEW));
      params.set("stxAddress", String(values.stxAddress));
      params.set("amount", values.amount ?? "");
      router.push(pathname + "?" + params.toString());
    },
    [pathname, router],
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
    initialData: 0,
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

  useEffect(() => {
    if (status === DepositStatus.Failed && txId) {
      router.push(`/reclaim?depositTxId=${txId}`);
    }
  }, [status, setStep, router, txId]);
  // const showDepositWarning = useMemo(() => {
  //   if (confirmedBlockHeight === 0) {
  //     return false;
  //   } else {
  //     const elapsedBlocks = currentBlockHeight - confirmedBlockHeight;

  //     return elapsedBlocks >= 6;
  //   }
  // }, [confirmedBlockHeight, currentBlockHeight]);
  const { currentCap, perDepositMinimum } = useMintCaps();

  const maxDepositAmount = currentCap / 1e8;
  const minDepositAmount = perDepositMinimum / 1e8;
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
  const renderStep = (values: { amount?: string; stxAddress?: string }) => {
    const handleUpdateStep = (newStep: DEPOSIT_STEP) => {
      setStep(newStep);
    };

    switch (step) {
      case DEPOSIT_STEP.AMOUNT:
        return <DepositAmount setStep={handleUpdateStep} />;
      case DEPOSIT_STEP.ADDRESS:
        return <DepositAddress setStep={handleUpdateStep} />;
      case DEPOSIT_STEP.CONFIRM:
        return (
          <ConfirmDeposit
            setStep={handleUpdateStep}
            handleUpdatingTransactionInfo={(info: TransactionInfo) =>
              handleUpdatingTransactionInfo(info, values)
            }
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
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      enableReinitialize={true}
      onSubmit={() => {}}
    >
      {({ values }) => (
        <Form>
          <div
            style={{
              maxWidth: "1152px",
            }}
            className="w-full flex flex-row gap-4 mt-16"
          >
            {renderStep(values)}
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
        </Form>
      )}
    </Formik>
  );
};

export default DepositFlow;
