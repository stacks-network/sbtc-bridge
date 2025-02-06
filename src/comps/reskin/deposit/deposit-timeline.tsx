import { useMemo } from "react";
import { DEPOSIT_STEP } from "./deposit-manager";
import { DepositStatus } from "@/hooks/use-deposit-status";
import { CheckIcon } from "@heroicons/react/20/solid";
import { useAtomValue } from "jotai";
import { bridgeConfigAtom } from "@/util/atoms";
import { getStacksNetwork } from "@/util/get-stacks-network";
import { ReclaimStatus } from "@/hooks/use-reclaim-status";

type TimelineStepProps<T extends string | number> = {
  stepNumber: number;
  title: string;
  description: string;
  step: T;
  activeStep: T;
  activeStepNumber: number;
};

export const TimelineStep = <T extends string | number>({
  stepNumber,
  title,
  description,
  step,
  activeStep,
}: TimelineStepProps<T>) => {
  const isActive = useMemo(() => {
    return step === activeStep || step > activeStep;
  }, [activeStep, step]);

  console.log(
    `isActive: ${isActive}, activeStep: ${activeStep}, step: ${step}`,
  );
  return (
    <div className="flex flex-row gap-4 w-96 h-fit">
      <div className="flex flex-col items-center h-min">
        <div
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            backgroundColor: isActive ? "#FC6432" : "#525153",
          }}
          className=" text-black flex flex-row items-center justify-center "
        >
          <p className="text-black font-semibold  text-xs">{stepNumber}</p>
        </div>
        <div
          style={{
            backgroundColor: isActive ? "#FC6432" : "#525153",
          }}
          className="bg-white h-14  w-[2px]"
        />
      </div>
      <div className="flex flex-col h-auto w-64 gap-2">
        <p className="text-white m-0 text-sm font-semibold ">{title}</p>

        <p className="text-white m-0 font-thin  text-sm">{description}</p>
      </div>
    </div>
  );
};

// this is cop out for the loader component to be able to get active state of the txId of the loader
export const CurrentDepositTimelineStep = <T extends string | number>({
  stepNumber,
  title,
  description,
  step,
  activeStep,
  txId,
  status,
  stacksTxId,
}: TimelineStepProps<T> & {
  txId: string;
  stacksTxId?: string;
  status: DepositStatus | ReclaimStatus;
}) => {
  const isActive = useMemo(() => {
    return step === activeStep || step > activeStep;
  }, [activeStep, step]);
  const { PUBLIC_MEMPOOL_URL, WALLET_NETWORK } = useAtomValue(bridgeConfigAtom);

  const mempoolUrl = useMemo(() => {
    return `${PUBLIC_MEMPOOL_URL}/tx/${txId}`;
  }, [PUBLIC_MEMPOOL_URL, txId]);

  const hiroExplorerUrl = useMemo(() => {
    if (!stacksTxId) {
      return "";
    }
    let explorerUrl = `https://explorer.hiro.so/txid/${stacksTxId}`;
    const network = getStacksNetwork(WALLET_NETWORK);
    if (network === "testnet") {
      explorerUrl += `?chain=testnet`;
    }
    if (network === "devnet") {
      explorerUrl = `http://localhost:3020/txid/${stacksTxId}?chain=testnet&api=http://localhost:3999`;
    }
    return explorerUrl;
  }, [stacksTxId, WALLET_NETWORK]);

  const renderCurrentStatus = () => {
    console.log("status", status);
    if (
      status === DepositStatus.PendingConfirmation ||
      status === DepositStatus.PendingMint
    ) {
      return (
        <>
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
            role="status"
          />

          <h3 className="font-Matter text-white text-lg font-thin tracking-wide">
            PROCESSING
          </h3>
          <a href={mempoolUrl} target="_blank" rel="noreferrer">
            <p className="text-white m-0 font-thin  text-sm">
              (Estimation:{" "}
              <span className="text-darkOrange text-bold">5 min</span>)
            </p>
          </a>
        </>
      );
    } else if (status === DepositStatus.Completed) {
      return (
        <>
          <CheckIcon className="w-16 h-16 flex flex-row items-center justify-center rounded-full text-darkOrange " />
          <h3 className="font-Matter text-white text-lg font-thin tracking-wide">
            COMPLETED
          </h3>
          <a href={mempoolUrl} target="_blank" rel="noreferrer">
            <p className="text-white m-0 font-thin  text-sm">
              (View In :{" "}
              <span className="text-darkOrange text-bold">mempool</span>)
            </p>
          </a>
          {hiroExplorerUrl && (
            <a href={hiroExplorerUrl} target="_blank" rel="noreferrer">
              <p className="text-white m-0 font-thin  text-sm">
                (View In :{" "}
                <span className="text-darkOrange text-bold">Hiro explorer</span>
                )
              </p>
            </a>
          )}
        </>
      );
    }
  };
  return (
    <div className="flex flex-row gap-4 w-96 h-fit">
      <div className="flex flex-col items-center h-min">
        <div
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            backgroundColor: isActive ? "#FC6432" : "#525153",
          }}
          className=" text-black flex flex-row items-center justify-center "
        >
          <p className="text-black font-semibold  text-xs">{stepNumber}</p>
        </div>
        <div
          style={{
            backgroundColor: isActive ? "#FC6432" : "#525153",
          }}
          className="bg-white h-40  w-[2px]"
        />
      </div>
      <div className="flex flex-col h-auto w-64 gap-2">
        <p className="text-white m-0 text-sm font-semibold ">{title}</p>

        <div className="flex w-full h-40 flex-col items-center justify-center gap-2">
          {renderCurrentStatus()}
        </div>
      </div>
    </div>
  );
};

type DepositTimelineProps = {
  activeStep: DEPOSIT_STEP;
  txId: string;
  status: DepositStatus;
  stacksTxId: string;
};
const DepositTimeline = ({
  activeStep,
  txId,
  status,
  stacksTxId,
}: DepositTimelineProps) => {
  const activeStepNumber = useMemo(() => {
    switch (activeStep) {
      case DEPOSIT_STEP.AMOUNT:
        return 1;
      case DEPOSIT_STEP.ADDRESS:
        return 2;
      case DEPOSIT_STEP.CONFIRM:
        return 3;
      case DEPOSIT_STEP.REVIEW:
        return 4;
      default:
        return 1;
    }
  }, [activeStep]);

  return (
    <div
      style={{
        border: "2px solid rgba(255, 255, 255, 0.2)",
      }}
      className="w-2/5 h-min p-5 px-10 pb-10 flex flex-col gap-6 rounded-2xl"
    >
      <h3 className="font-Matter text-wthite text-lg font-thin tracking-wide">
        TIMELINE
      </h3>
      <div className="flex flex-col gap-3">
        <TimelineStep<DEPOSIT_STEP>
          activeStep={activeStep}
          stepNumber={1}
          step={DEPOSIT_STEP.AMOUNT}
          activeStepNumber={activeStepNumber}
          title="Select Deposit Amount"
          description="How much BTC are you transferring over to sBTC? Enter an amount that’s above the dust requirement (546 sats)"
        />
        <TimelineStep<DEPOSIT_STEP>
          activeStep={activeStep}
          stepNumber={2}
          step={DEPOSIT_STEP.ADDRESS}
          activeStepNumber={activeStepNumber}
          title="Provide a Deposit Address"
          description="sBTC will be sent to a STX address. Connecting a wallet will auto-fill this in, but feel free to submit another address."
        />
        {activeStep === DEPOSIT_STEP.REVIEW ? (
          <CurrentDepositTimelineStep<DEPOSIT_STEP>
            status={status}
            txId={txId}
            stacksTxId={stacksTxId}
            activeStep={activeStep}
            stepNumber={3}
            step={DEPOSIT_STEP.CONFIRM}
            activeStepNumber={activeStepNumber}
            title="Operation Status:"
            description="We will confirm the transaction status once the transaction is confirmed."
          />
        ) : (
          <TimelineStep<DEPOSIT_STEP>
            activeStep={activeStep}
            stepNumber={3}
            step={DEPOSIT_STEP.CONFIRM}
            activeStepNumber={activeStepNumber}
            title="Operation Status:"
            description="We will confirm the transaction status once the transaction is confirmed."
          />
        )}
      </div>
    </div>
  );
};

export default DepositTimeline;
