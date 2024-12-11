"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlowContainer, FlowLoaderContainer } from "./core/FlowContainer";
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
import { SignatureHash } from "@leather.io/rpc";
import { Step } from "./deposit-stepper";
import { getReclaimInfo } from "@/util/tx-utils";
import { ReclaimStatus, useReclaimStatus } from "@/hooks/use-reclaim-status";

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

// type ReclaimTxType = {
//   txId: string;
//   status: {
//     confirmed: boolean;
//   };
// };

const ReclaimManager = () => {
  // const router = useRouter();
  // const pathname = usePathname();
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
  }, []);

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

        return <CurrentStatusReclaim amount={amount} txId={reclaimTxId} />;
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

      const reclaimTransaction = await getReclaimInfo({ reclaimTxId });

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
      const voutIndex = searchParams.get("vout") || 0;
      // ensure we have the depositTxId
      if (!depositTxId) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "No deposit transaction found",
        });
        setStep(RECLAIM_STEP.NOT_FOUND);
        return;
      }

      const url = `/api/tx?txId=${depositTxId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error with the request");
      }

      const responseData = await response.json();

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
        that means we need the txId of the deposit and optinoal the output index
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
interface SignPsbtRequestParams {
  hex: string;
  allowedSighash?: SignatureHash[];
  signAtIndex?: number | number[];
  network?: string;
  account?: number;
  broadcast?: boolean;
}

const ReclaimDeposit = ({
  amount,
  depositTransaction,
}: ReclaimDepositProps) => {
  const { notify } = useNotifications();
  const walletInfo = useAtomValue(walletInfoAtom);
  const router = useRouter();

  const { WALLET_NETWORK: walletNetwork } = useAtomValue(bridgeConfigAtom);

  const buildReclaimTransaction = async () => {
    try {
      const maxReclaimFee = 5000;

      const btcAddress = getWalletAddress();

      if (!btcAddress) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "No Bitcoin address found",
        });
        return;
      }

      const unsignedTxHex = await constructPsbtForReclaim({
        depositAmount: amount * 1e8,
        feeAmount: maxReclaimFee,

        lockTime: depositTransaction.parameters.lockTime,
        depositScript: depositTransaction.depositScript,
        reclaimScript: depositTransaction.reclaimScript,
        txId: depositTransaction.bitcoinTxid,
        vout: depositTransaction.bitcoinTxOutputIndex,
        bitcoinReturnAddress: btcAddress,
      });

      // sign the transaction through api
      const signPsbtRequestParams: SignPsbtRequestParams = {
        hex: unsignedTxHex,
        network: walletNetwork,

        broadcast: true,
      };

      const response = await window.LeatherProvider?.request(
        "signPsbt",
        signPsbtRequestParams,
      );

      if (response && response.result) {
        const signedTxHex = response.result.hex;

        const finalizedTxHex = finalizePsbt(signedTxHex);

        const transactionId = createTransactionFromHex(finalizedTxHex);

        // set a query params to the transaction id as reclaimTxId and updated the status

        router.push(`/reclaim?reclaimTxId=${transactionId}`);
      }
    } catch (err) {
      console.error("Error building reclaim transaction", err);
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
        </div>
        <div className="flex flex-1 ">
          <div className="w-full p-4 bg-lightOrange h-20 rounded-lg flex flex-row items-center justify-center gap-2">
            <InformationCircleIcon className="h-10 w-10 text-orange" />
            <p className="text-orange font-Matter font-semibold text-sm break-keep">
              Please note that deposit wont be able to be reclaimed till after
              enough blocks have passed from its locktime
            </p>
          </div>
        </div>
        <div className="w-full flex-row flex justify-between items-center">
          <PrimaryButton
            onClick={() => {
              buildReclaimTransaction();
            }}
          >
            RECLAIM
          </PrimaryButton>
        </div>
      </>
    </FlowContainer>
  );
};

const CurrentStatusReclaim = ({
  txId,
  amount,
}: {
  txId: string;
  amount: number;
}) => {
  const { MEMPOOL_URL } = useAtomValue(bridgeConfigAtom);

  const status = useReclaimStatus(txId);

  const showLoader = status === ReclaimStatus.Pending;

  const currentStep = useMemo(() => {
    const steps = [ReclaimStatus.Pending, ReclaimStatus.Completed];
    return steps.findIndex((step) => step === status);
  }, [status]);

  const mempoolUrl = useMemo(() => {
    return `${MEMPOOL_URL}/tx/${txId}`;
  }, [MEMPOOL_URL, txId]);
  return (
    <FlowLoaderContainer showLoader={showLoader}>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Reclaim Transaction Status</Heading>
        </div>
        <div className="flex flex-col  gap-2">
          <div className="flex flex-col gap-1">
            <SubText>Amount To Reclaim</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {amount} BTC
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <SubText>View In Mempool</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              <a
                href={mempoolUrl}
                target="_blank"
                rel="noreferrer"
                className="text-orange"
              >
                Link
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-col mt-8 gap-4 w-full ">
          <ol className="flex items-center w-full text-xs text-gray-900 font-medium sm:text-base text-black">
            <Step
              currentStep={currentStep}
              index={0}
              name="Pending"
              lastStep={1}
            />
            <Step
              currentStep={currentStep}
              index={1}
              name="Completed"
              lastStep={1}
            />
          </ol>
        </div>
      </>
    </FlowLoaderContainer>
  );
};
