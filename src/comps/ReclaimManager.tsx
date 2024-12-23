"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/16/solid";

import { useNotifications } from "@/hooks/use-notifications";
import { NotificationStatusType } from "./Notifications";
import { getRawTransaction } from "@/actions/bitcoinClient";
import ReclaimStepper from "./reclaim/reclaim-stepper";
import ReclaimDeposit from "./reclaim/reclaim-deposit";
import ReclaimTimeline from "./reclaim/reclaim-timeline";
import { NavTile } from "./core/app-nav";
import { SECTION } from "./HomeApp";
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
  const depositTxId = searchParams.get("depositTxId");
  const outputIndex = searchParams.get("vout") || 0;
  const reclaimTxId = searchParams.get("reclaimTxId");
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

        return (
          <ReclaimStepper status={status} amount={amount} txId={reclaimTxId} />
        );
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

      console.log("reclaimTransaction", reclaimTransaction);

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

      if (emilyRes.status === "pending") setStep(RECLAIM_STEP.RECLAIM);
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
          section={SECTION.DEPOSIT}
          activeSection={SECTION.DEPOSIT}
          text="DEPOSIT"
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
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
            role="status"
          ></div>
          <h3 className="font-Matter text-white text-lg font-thin tracking-wide">
            LOADING
          </h3>
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

/*
const ReclaimDeposit = ({
  amount,
  depositTransaction,
}: ReclaimDepositProps) => {
  const { notify } = useNotifications();
  const walletInfo = useAtomValue(walletInfoAtom);
  const setShowWallet = useSetAtom(showConnectWalletAtom);
  const router = useRouter();

  const { WALLET_NETWORK: walletNetwork, SUPPORT_LINK } =
    useAtomValue(bridgeConfigAtom);

  const buildReclaimTransaction = async () => {
    try {
      // FIXME: move to env
      const maxReclaimFee = 5000;

      const btcAddress = getWalletAddress();

      if (!btcAddress) {
        return setShowWallet(true);
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
    // const signPsbtRequestParams: SignPsbtRequestParams = {
    //   hex: psbtHex,
    //   network: walletNetwork,

    //   broadcast: false,
    // };

    // const response = await window.LeatherProvider?.request(
    //   "signPsbt",
    //   signPsbtRequestParams,
    // );
    const params = {
      hex: psbtHex,
      address: walletInfo.addresses.payment!.address,
      network: walletNetwork,
    };
    let signedPsbt = "";
    if (walletInfo.selectedWallet === WalletProvider.LEATHER) {
      signedPsbt = await signPSBTLeather(params);
    }
    if (walletInfo.selectedWallet === WalletProvider.XVERSE) {
      signedPsbt = await signPSBTXverse(params);
    }

    if (signedPsbt) {
      const finalizedTxHex = finalizePsbt(signedPsbt, walletNetwork);

      await broadcastTransaction(finalizedTxHex);
    } else {
      notify({
        type: NotificationStatusType.ERROR,
        message: "Error signing PSBT",
      });
    }
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
*/
