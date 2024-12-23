import { ReclaimStatus } from "@/hooks/use-reclaim-status";
import { bridgeConfigAtom } from "@/util/atoms";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { Heading, SubText } from "../core/Heading";
import { FlowLoaderContainer } from "../core/FlowContainer";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { Step } from "../deposit-stepper";

const ReclaimStepper = ({
  txId,
  amount,
  status,
}: {
  txId: string;
  amount: number;
  status: ReclaimStatus;
}) => {
  const { PUBLIC_MEMPOOL_URL } = useAtomValue(bridgeConfigAtom);

  const showLoader = status === ReclaimStatus.Pending;

  const currentStep = useMemo(() => {
    const steps = [ReclaimStatus.Pending, 0, ReclaimStatus.Completed];
    return steps.findIndex((step) => step === status);
  }, [status]);

  const mempoolUrl = useMemo(() => {
    return `${PUBLIC_MEMPOOL_URL}/tx/${txId}`;
  }, [PUBLIC_MEMPOOL_URL, txId]);

  const renderCurrenStatusText = () => {
    if (status === ReclaimStatus.Pending) {
      return (
        <SubText>Reclaim transaction is pending confirmation on chain</SubText>
      );
    } else if (status === ReclaimStatus.Completed) {
      return <SubText>Reclaim transaction has been confirmed on chain</SubText>;
    } else {
      return (
        <SubText>
          Something went wrong getting the status, please reach out for help
        </SubText>
      );
    }
  };
  return (
    <FlowLoaderContainer showLoader={showLoader}>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Reclaim Status</Heading>
        </div>
        {renderCurrenStatusText()}
        <div className="flex flex-col  gap-2">
          <div className="flex flex-col gap-1">
            <SubText>Amount To Reclaim</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {amount} BTC
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-orange underline underline-offset-1 font-Matter font-semibold text-sm ">
              <a href={mempoolUrl} target="_blank" rel="noreferrer">
                View in mempool
                <ArrowTopRightOnSquareIcon className="inline-block w-4 h-4 ml-1" />
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-col mt-2 gap-4 w-full ">
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

export default ReclaimStepper;
