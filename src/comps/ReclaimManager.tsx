"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FlowContainer } from "./core/FlowContainer";
import { Heading, SubText } from "./core/Heading";
import { useShortAddress } from "@/hooks/use-short-address";
import { InformationCircleIcon } from "@heroicons/react/16/solid";
import { PrimaryButton } from "./core/FlowButtons";
import { useAtomValue } from "jotai";
import { bridgeConfigAtom, walletInfoAtom } from "@/util/atoms";

import { useNotifications } from "@/hooks/use-notifications";
import { NotificationStatusType } from "./Notifications";
import {
  constructPsbtForReclaim,
  createTransactionFromHex,
  finalizePsbt,
} from "@/util/reclaimHelper";
import {
  getRawTransaction,
  transmitRawTransaction,
} from "@/actions/bitcoinClient";
import ReclaimStepper from "./reclaim/reclaim-stepper";
import { Psbt } from "bitcoinjs-lib";
import { signPSBTRequest } from "@/util/wallet-utils";
import { useConnectWallet } from "../hooks/use-connect-wallet";

/*
  Goal : User server side rendering as much as possible
  - Break down the components into either their own file or smaller components
*/
enum RECLAIM_STEP {
  LOADING = "LOADING",
  NOT_FOUND = "NOT_FOUND",
  RECLAIM = "RECLAIM",
  CANT_RECLAIM = "CANT_RECLAIM",
  CURRENT_STATUS = "CURRENT_STATUS",
}

type EmilyDepositTransactionType = {
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

  const { notify } = useNotifications();

  const [step, _setStep] = useState<RECLAIM_STEP>(RECLAIM_STEP.LOADING);

  const [emilyDepositTransaction, setEmilyDepositTransaction] =
    useState<EmilyDepositTransactionType | null>(null);

  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    // get the txId from the query params

    // based on the query params determine if we fetch a info from emily or fetch a already made reclaim request

    const reclaimTxId = searchParams.get("reclaimTxId");
    const depositTxId = searchParams.get("depositTxId");

    if (reclaimTxId) {
      fetchReclaimTransactionStatus();
      return;
    } else if (depositTxId) {
      fetchDepositInfoFromEmily();
      return;
    }
    // no need to include the fetch fns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setStep = useCallback((newStep: RECLAIM_STEP) => {
    _setStep(newStep);
  }, []);

  const renderStep = () => {
    switch (step) {
      case RECLAIM_STEP.RECLAIM:
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

        return <ReclaimStepper amount={amount} txId={reclaimTxId} />;
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
      const reclaimTxId = searchParams.get("reclaimTxId");
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
      const depositTxId = searchParams.get("depositTxId");
      const outputIndex = searchParams.get("vout") || 0;

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
        `/api/emilyDeposit?bitcoinTxid=${depositTxId}&vout=${outputIndex}`,
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

      setAmount(amount);

      setEmilyDepositTransaction(responseData);

      const emilyRes = responseData as EmilyDepositTransactionType;

      if (emilyRes.status === "pending") setStep(RECLAIM_STEP.RECLAIM);

      fetchDepositAmount();
    } catch (err) {
      console.error("Error fetching deposit info from Emily", err);
      setStep(RECLAIM_STEP.NOT_FOUND);
    }
  };
  return (
    <div className="flex flex-1 flex-col w-full px-5 gap-6 items-center py-5">
      {renderStep()}
    </div>
  );
};

export default ReclaimManager;

const LoadingInfo = () => {
  return (
    <FlowContainer>
      <div className="flex h-full flex-col gap-2 items-center justify-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-orange"
          role="status"
        ></div>
        <SubText>Loading Info</SubText>
      </div>
    </FlowContainer>
  );
};

const NotFound = () => {
  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Transaction could not be found</Heading>
        </div>
        <div className="flex flex-1 ">
          <div className="w-full p-4 bg-lightOrange h-24 rounded-lg flex flex-row items-center justify-center gap-2">
            <InformationCircleIcon className="h-10 w-10 text-orange" />
            <p className="text-orange font-Matter font-semibold text-sm break-keep">
              The transaction you are looking for could not be found. Please
              check the transaction details and try again. If you believe this
              is an error please contact a team member.
            </p>
          </div>
        </div>
      </>
    </FlowContainer>
  );
};

const CantReclaim = () => {
  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Cannot Reclaim Deposit</Heading>
        </div>
        <div className="flex flex-1 ">
          <div className="w-full p-4 bg-lightOrange h-24 rounded-lg flex flex-row items-center justify-center gap-2">
            <InformationCircleIcon className="h-10 w-10 text-orange" />
            <p className="text-orange font-Matter font-semibold text-sm break-keep">
              This deposit cannot be reclaimed since it has been minted for sBTC
              and deposited into the Stacks chain.
            </p>
          </div>
        </div>
      </>
    </FlowContainer>
  );
};
type ReclaimDepositProps = {
  amount: number;
  depositTransaction: EmilyDepositTransactionType;
};

const ReclaimDeposit = ({
  amount,
  depositTransaction,
}: ReclaimDepositProps) => {
  const { notify } = useNotifications();
  const walletInfo = useAtomValue(walletInfoAtom);
  const router = useRouter();
  const connectWallet = useConnectWallet();

  const { WALLET_NETWORK: walletNetwork, SUPPORT_LINK } =
    useAtomValue(bridgeConfigAtom);

  const buildReclaimTransaction = async () => {
    try {
      // FIXME: move to env
      const maxReclaimFee = 5000;

      const btcAddress = getWalletAddress();

      if (!btcAddress) {
        return connectWallet();
      }

      // FIXME: move to util or its own file
      const unsignedTxHex = constructPsbtForReclaim({
        depositAmount: Math.floor(amount * 1e8),
        feeAmount: maxReclaimFee,
        lockTime: depositTransaction.parameters.lockTime,
        depositScript: depositTransaction.depositScript,
        reclaimScript: depositTransaction.reclaimScript,
        txId: depositTransaction.bitcoinTxid,
        vout: depositTransaction.bitcoinTxOutputIndex,
        bitcoinReturnAddress: btcAddress,
        walletNetwork,
      });

      await signPSBT(unsignedTxHex);
    } catch (err) {
      console.error("Error building reclaim transaction", err);
    }
  };

  const signPSBT = async (psbtHex: string) => {
    const params = {
      hex: psbtHex,
      address: walletInfo.addresses.payment!.address,
      network: walletNetwork,
    };

    const signedPsbtHex = await signPSBTRequest(params);
    if (!signedPsbtHex) {
      return notify({
        type: NotificationStatusType.ERROR,
        message: "Error signing PSBT",
      });
    }

    const signedPsbt = Psbt.fromHex(signedPsbtHex);
    const finalizedTxHex = finalizePsbt(signedPsbt);
    await broadcastTransaction(finalizedTxHex);
  };

  const broadcastTransaction = async (finalizedTxHex: string) => {
    try {
      const broadcastTransaction = await transmitRawTransaction(finalizedTxHex);

      if (!broadcastTransaction) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "Error broadcasting transaction",
        });
        return;
      }
      notify({
        type: NotificationStatusType.SUCCESS,
        message: "Reclaim transaction broadcast",
      });

      const transactionId = createTransactionFromHex(finalizedTxHex);

      // set a query params to the transaction id as reclaimTxId and updated the status

      router.push(`/reclaim?reclaimTxId=${transactionId}`);
    } catch (err) {
      console.warn("Error broadcasting transaction", err);
    }
  };

  const getWalletAddress = () => {
    return walletInfo?.addresses.payment?.address;
  };
  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Reclaim Your Deposit</Heading>
        </div>
        <div className="flex flex-col  gap-2">
          <div className="flex flex-col gap-1">
            <SubText>Amount To Reclaim</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {amount} BTC
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <SubText>Lock Time</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {depositTransaction.parameters.lockTime} blocks
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <SubText>Bitcoin address to reclaim to</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {useShortAddress(getWalletAddress() || "")}
            </p>
          </div>
          {SUPPORT_LINK && (
            <div className="flex flex-1 items-end">
              <SubText>
                Please note that we have received reports of errors with Ledgers
                running the reclaim function - if you are using a ledger and
                experience this please contact our{" "}
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 underline"
                  href={SUPPORT_LINK}
                >
                  support team here
                </a>
              </SubText>
            </div>
          )}
        </div>
        <div className="flex flex-1 ">
          <div className="w-full p-4 bg-lightOrange h-20 rounded-lg flex flex-row items-center justify-center gap-2">
            <InformationCircleIcon className="h-10 w-10 text-orange" />
            <p className="text-orange font-Matter font-semibold text-sm break-keep">
              Please note that deposit will not be available for reclaiming
              until after enough blocks have passed from its locktime
            </p>
          </div>
        </div>
        <div className="w-full flex-row flex justify-between items-center">
          <PrimaryButton onClick={buildReclaimTransaction}>
            RECLAIM
          </PrimaryButton>
        </div>
      </>
    </FlowContainer>
  );
};
