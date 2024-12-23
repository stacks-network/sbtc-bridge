import { useMemo } from "react";
import { RECLAIM_STEP } from "../ReclaimManager";
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
    } else if (activeStep === RECLAIM_STEP.RECLAIM) {
      return 1;
    } else {
      return 0;
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
        <TimelineStep<RECLAIM_STEP>
          activeStep={activeStep}
          stepNumber={1}
          step={RECLAIM_STEP.RECLAIM}
          activeStepNumber={activeStepNumber}
          title="Confirm Reclaim"
          description="Confirm the information and reclaim your BTC"
        />
        {activeStep === RECLAIM_STEP.CURRENT_STATUS ? (
          <CurrentDepositTimelineStep<RECLAIM_STEP>
            txId={txId}
            activeStep={activeStep}
            status={status}
            stepNumber={2}
            step={RECLAIM_STEP.CURRENT_STATUS}
            activeStepNumber={activeStepNumber}
            title="Operation Status:"
            description="We will confirm the transaction status once the transaction is confirmed."
          />
        ) : (
          <TimelineStep<RECLAIM_STEP>
            activeStep={activeStep}
            stepNumber={2}
            step={RECLAIM_STEP.CURRENT_STATUS}
            activeStepNumber={activeStepNumber}
            title="Operation Status:"
            description="We will confirm the transaction status once the transaction is confirmed."
          />
        )}
      </div>
    </div>
  );
};

export default ReclaimTimeline;
