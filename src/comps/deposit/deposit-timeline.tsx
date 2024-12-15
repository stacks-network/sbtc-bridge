import { useMemo } from "react";
import { DEPOSIT_STEP } from "../Deposit";

type TimelineStepProps = {
  stepNumber: number;
  title: string;
  description: string;
  step: DEPOSIT_STEP;
  activeStep: DEPOSIT_STEP;
  activeStepNumber: number;
};
const TimelineStep = ({
  stepNumber,
  title,
  description,
  step,
  activeStep,
}: TimelineStepProps) => {
  const isActive = step === activeStep;

  return (
    <div className="flex flex-row gap-4 w-96 h-fit">
      <div className="flex flex-col items-center h-min">
        <div
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            backgroundColor:
              isActive || activeStep > step ? "#FC6432" : "#525153",
          }}
          className=" text-black flex flex-row items-center justify-center "
        >
          <p className="text-white font-semibold  text-xs">{stepNumber}</p>
        </div>
        <div className="bg-white h-14  w-[2px]" />
      </div>
      <div className="flex flex-col h-auto w-64 gap-2">
        <p className="text-white m-0 text-sm font-semibold ">{title}</p>
        <p className="text-white m-0 font-thin  text-sm">{description}</p>
      </div>
    </div>
  );
};

type DepositTimelineProps = {
  activeStep: DEPOSIT_STEP;
};
const DepositTimeline = ({ activeStep }: DepositTimelineProps) => {
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
      <h3 className="font-Matter text-white text-lg font-thin tracking-wide">
        TIMELINE
      </h3>
      <div className="flex flex-col gap-3">
        <TimelineStep
          activeStep={activeStep}
          stepNumber={1}
          step={DEPOSIT_STEP.AMOUNT}
          activeStepNumber={activeStepNumber}
          title="Select Deposit Amount"
          description="How much BTC are you transferring over to sBTC? Enter an amount that’s above the dust requirement (546 sats)"
        />
        <TimelineStep
          activeStep={activeStep}
          stepNumber={2}
          step={DEPOSIT_STEP.ADDRESS}
          activeStepNumber={activeStepNumber}
          title="Provide a Deposit Address"
          description="sBTC will be sent to a STX address. Connecting a wallet will auto-fill this in, but feel free to submit another address."
        />
        <TimelineStep
          activeStep={activeStep}
          stepNumber={3}
          step={DEPOSIT_STEP.CONFIRM}
          activeStepNumber={activeStepNumber}
          title="Operation Status:"
          description="We will confirm the transaction status once the transaction is confirmed."
        />
      </div>
    </div>
  );
};

export default DepositTimeline;
