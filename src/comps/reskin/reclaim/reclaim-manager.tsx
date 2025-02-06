"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/16/solid";

import { useNotifications } from "@/hooks/use-notifications";

import { NotificationStatusType } from "../../Notifications";
import { getRawTransaction } from "@/actions/bitcoinClient";
import ReclaimStepper from "./reclaim-stepper";
import ReclaimDeposit from "./reclaim-deposit";
import ReclaimTimeline from "./reclaim-timeline";
import { NavTile } from "../core/app-nav";

import { SECTION } from "../home";
import { useAtomValue } from "jotai";
import { bridgeConfigAtom } from "@/util/atoms";
import { useReclaimStatus } from "@/hooks/use-reclaim-status";

/*
  Goal : User server side rendering as much as possible
  - Break down the components into either their own file or smaller components
*/
export enum RECLAIM_STEP {
  LOADING = "LOADING",
  NOT_FOUND = "NOT_FOUND",
  CANT_RECLAIM = "CANT_RECLAIM",

  REVIEW = "REVIEW",
  SUBMISSION = "SUBMISSION",
  CURRENT_STATUS = "CURRENT_STATUS",
}

export type EmilyDepositTransactionType = {
  bitcoinTxid: string;
  bitcoinTxOutputIndex: number;
  recipient: string;
  amount: number;
  lastUpdateHeight: number;
  lastUpdateBlockHash: string;
  status: string;
  statusMessage: string;
  parameters: {
    maxFee: number;
    lockTime: number;
  };
  reclaimScript: string;
  depositScript: string;
  fulfillment: {
    BitcoinTxid: string;
    BitcoinTxIndex: number;
    StacksTxid: string;
    BitcoinBlockHash: string;
    BitcoinBlockHeight: number;
    BtcFee: number;
  };
};

const ReclaimManager = () => {
  const searchParams = useSearchParams();

  const depositTxId = searchParams.get("depositTxId");
  const outputIndex = searchParams.get("vout") || 0;
  const reclaimTxId = searchParams.get("reclaimTxId");

  const lockTime = searchParams.get("lockTime") || "N/A";

  const status = useReclaimStatus(reclaimTxId || "");

  const { notify } = useNotifications();

  const [step, _setStep] = useState<RECLAIM_STEP>(RECLAIM_STEP.LOADING);

  const [emilyDepositTransaction, setEmilyDepositTransaction] =
    useState<EmilyDepositTransactionType | null>(null);

  const [amount, setAmount] = useState<number>(0);

  const { EMILY_URL: emilyUrl } = useAtomValue(bridgeConfigAtom);

  useEffect(() => {
    // get the txId from the query params

    // based on the query params determine if we fetch a info from emily or fetch a already made reclaim request

    if (reclaimTxId) {
      fetchReclaimTransactionStatus();
    }
    if (depositTxId) {
      fetchDepositInfoFromEmily();
    }
    // no need to include the fetch fns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setStep = useCallback((newStep: RECLAIM_STEP) => {
    _setStep(newStep);
  }, []);

  const renderStep = () => {
    switch (step) {
      // Confirm data with user before creating reclaim tx
      case RECLAIM_STEP.REVIEW:
        // ensure we have the deposit transaction
        if (!emilyDepositTransaction) {
          notify({
            type: NotificationStatusType.ERROR,
            message: "Something went wrong",
          });
          _setStep(RECLAIM_STEP.NOT_FOUND);
          return null;
        }
        return (
          <ReclaimDeposit
            amount={amount}
            depositTransaction={emilyDepositTransaction}
          />
        );
      // show the current status of submitted reclaim tx
      case RECLAIM_STEP.SUBMISSION:
      case RECLAIM_STEP.CURRENT_STATUS:
        // get reclaimTxId from the query params
        const reclaimTxId = searchParams.get("reclaimTxId") || "";

        if (!reclaimTxId) {
          notify({
            type: NotificationStatusType.ERROR,
            message: "No Reclaim transaction found",
          });
          return null;
        }

        return (
          <ReclaimStepper
            reclaimTxId={reclaimTxId}
            lockTime={lockTime}
            status={status}
            amount={amount}
          />
        );
        break;
      case RECLAIM_STEP.LOADING:
        return <LoadingInfo />;
      case RECLAIM_STEP.NOT_FOUND:
        return <NotFound />;
      case RECLAIM_STEP.CANT_RECLAIM:
        return <CantReclaim />;
      default:
        return null;
    }
  };

  const fetchReclaimTransactionStatus = async () => {
    try {
      if (!reclaimTxId) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "No Reclaim transaction found",
        });
        return;
      }

      const reclaimTransaction = (await getRawTransaction(reclaimTxId))!;

      if (reclaimTransaction) {
        setStep(RECLAIM_STEP.CURRENT_STATUS);

        const amount = reclaimTransaction.vout[0].value / 1e8;
        setAmount(amount);
      } else {
        notify({
          type: NotificationStatusType.ERROR,
          message: "No Reclaim transaction found",
        });
        setStep(RECLAIM_STEP.NOT_FOUND);
      }
    } catch (err) {
      notify({
        type: NotificationStatusType.ERROR,
        message: "No Reclaim transaction found",
      });
    }
  };
  const fetchDepositAmount = async () => {
    try {
      const depositTxId = searchParams.get("depositTxId");
      const voutIndex = Number(searchParams.get("vout") || 0);
      // ensure we have the depositTxId
      if (!depositTxId) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "No deposit transaction found",
        });
        setStep(RECLAIM_STEP.NOT_FOUND);
        return;
      }
      const responseData = (await getRawTransaction(depositTxId))!;

      console.log("responseData", responseData);

      // get the amount from vout array
      const vout = responseData.vout;

      const depositAmount = vout[voutIndex].value;

      const amount = depositAmount / 1e8;

      setAmount(amount);
    } catch (err) {
      console.error("Error fetching deposit amount", err);
      //setStep(RECLAIM_STEP.NOT_FOUND);
    }
  };
  const fetchDepositInfoFromEmily = async () => {
    try {
      // get the depositTxId and outputIndex from the query params

      // we want to get the deposit info from Emily
      /*
        that means we need the txId of the deposit and optionally the output index
        - if no output index is found in the search params assume its' 0

        1) fetch the deposit info from Emily
        2) get the reclaim script and deposit script
        3) parse the amount from the deposit script
        4) Display the amount and the reclaim script to the user to confirm
      */

      const response = await fetch(
        `${emilyUrl}/deposit/${depositTxId}/${outputIndex}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Error with the request");
      }

      const responseData = await response.json();
      console.log("emily esponse", responseData);

      setAmount(amount);

      setEmilyDepositTransaction(responseData);

      const emilyRes = responseData as EmilyDepositTransactionType;

      if (emilyRes.status === "pending") setStep(RECLAIM_STEP.REVIEW);
      if (emilyRes.status === "confirmed") setStep(RECLAIM_STEP.CANT_RECLAIM);

      fetchDepositAmount();
    } catch (err) {
      console.error("Error fetching deposit info from Emily", err);
      setStep(RECLAIM_STEP.NOT_FOUND);
    }
  };

  const handleClickSection = (section: SECTION) => {};

  return (
    <>
      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.2)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        }}
        className="w-full bg-[#272628] h-20 flex items-center justify-center
      "
      >
        <NavTile
          section={SECTION.RECLAIM}
          activeSection={SECTION.RECLAIM}
          text="RECLAIM"
          onClickSection={handleClickSection}
        />
      </div>
      <div className="flex flex-1 mb-10 flex-col w-full px-5 gap-6 items-center py-5">
        <div
          style={{
            maxWidth: "1152px",
          }}
          className="w-full flex flex-row gap-4 mt-16"
        >
          {renderStep()}
          <ReclaimTimeline
            activeStep={step}
            status={status}
            txId={depositTxId || ""}
          />
        </div>
      </div>
    </>
  );
};

export default ReclaimManager;

const LoadingInfo = () => {
  const [showError, setShowError] = useState(false);

  // useEffect to show error message if it take more than 10 seconds to load info
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(true);
    }, 10000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="w-full flex flex-col  gap-4 ">
      <div className="flex  flex-row w-full gap-4 h-40">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full"></div>
        <div
          style={{
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
          className="w-full h-min p-5 px-10 items-center justify-center pb-10 flex flex-col gap-6 rounded-2xl"
        >
          {showError ? (
            <div className="w-full bg-red-500 p-4 rounded-lg">
              <p className="text-white text-center font-Matter font-semibold text-sm">
                Error loading information. Please try again.
              </p>
            </div>
          ) : (
            <>
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                role="status"
              ></div>
              <h3 className="font-Matter text-white text-lg font-thin tracking-wide">
                LOADING
              </h3>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const NotFound = () => {
  return (
    <div className="w-full flex flex-col  gap-4 ">
      <div className="flex  flex-row w-full gap-4 h-40">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full"></div>
        <div
          style={{
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
          className="w-full h-min p-5 px-10 items-center justify-center pb-10 flex flex-col gap-6 rounded-2xl"
        >
          <h3 className="font-Matter text-white text-lg font-thin tracking-wide">
            Transaction could not be found
          </h3>
          <p className="text-orange text-center font-Matter font-semibold text-sm break-keep">
            The transaction you are looking for could not be found. Please check
            the transaction details and try again. If you believe this is an
            error please contact a team member.
          </p>
        </div>
      </div>
    </div>
  );
};

const CantReclaim = () => {
  return (
    <div className="w-full flex flex-col  gap-4 ">
      <div className="flex  flex-row w-full gap-4 h-40">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full"></div>
        <div
          style={{
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
          className="w-full h-min p-5 px-10 items-center justify-center pb-10 flex flex-col gap-6 rounded-2xl"
        >
          <InformationCircleIcon className="h-10 w-10 text-orange" />

          <h3 className="font-Matter text-white text-lg font-thin tracking-wide">
            Cannot Reclaim Deposit
          </h3>

          <p className="text-orange text-center font-Matter font-semibold text-sm break-keep">
            This deposit cannot be reclaimed since it has been minted for sBTC
            and deposited into the Stacks chain.
          </p>
        </div>
      </div>
    </div>
  );
};
export type ReclaimDepositProps = {
  amount: number;
  depositTransaction: EmilyDepositTransactionType;
};
