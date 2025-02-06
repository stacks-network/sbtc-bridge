import { useMemo } from "react";
import { RECLAIM_STEP } from "./reclaim-manager";
import {
  CurrentDepositTimelineStep,
  TimelineStep,
} from "../deposit/deposit-timeline";
import { ReclaimStatus } from "@/hooks/use-reclaim-status";

type ReclaimTimelineProps = {
  activeStep: RECLAIM_STEP;
  txId: string;
  status: ReclaimStatus;
};

const ReclaimTimeline = ({
  activeStep,
  txId,
  status,
}: ReclaimTimelineProps) => {
  const activeStepNumber = useMemo(() => {
    if (
      activeStep === RECLAIM_STEP.LOADING ||
      activeStep === RECLAIM_STEP.NOT_FOUND ||
      activeStep === RECLAIM_STEP.CANT_RECLAIM
    ) {
      return 0;
    } else if (activeStep === RECLAIM_STEP.CURRENT_STATUS) {
      return 2;
    } else if (activeStep === RECLAIM_STEP.REVIEW) {
      return 1;
    } else {
      return 0;
    }
  }, [activeStep]);

  const showCurrentStatus = activeStepNumber !== 1 && activeStepNumber !== 0;
  return (
    <div
      style={{
        border: "2px solid rgba(255, 255, 255, 0.2)",
      }}
      className="w-2/5 h-min p-5 px-10 pb-10 flex flex-col gap-6 rounded-2xl"
    >
      <h3 className="font-Matter text-wthite text-2xl font-thin tracking-wide">
        TIMELINE
      </h3>
      <div className="flex flex-col gap-2">
        <TimelineStep<RECLAIM_STEP>
          activeStep={activeStep}
          stepNumber={1}
          step={RECLAIM_STEP.REVIEW}
          activeStepNumber={activeStepNumber}
          title="Review Reclaim"
          description="Confirm the information of the reclaim before submitting the transaction."
        />

        <TimelineStep<RECLAIM_STEP>
          activeStep={activeStep}
          stepNumber={2}
          step={RECLAIM_STEP.CURRENT_STATUS}
          activeStepNumber={activeStepNumber}
          title="Submit Reclaim Transaction:"
          description="Submit the reclaim transaction to the network."
        />
        {showCurrentStatus && (
          <CurrentDepositTimelineStep<RECLAIM_STEP>
            txId={txId}
            activeStep={activeStep}
            status={status}
            stepNumber={3}
            step={RECLAIM_STEP.CURRENT_STATUS}
            activeStepNumber={activeStepNumber}
            title="Current Reclaim Request Status:"
            description="We will confirm the transaction status once the transaction is confirmed."
          />
        )}
      </div>
    </div>
  );
};

export default ReclaimTimeline;
