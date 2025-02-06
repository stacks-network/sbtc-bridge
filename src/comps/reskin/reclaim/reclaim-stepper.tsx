import { ReclaimStatus } from "@/hooks/use-reclaim-status";
import { bridgeConfigAtom } from "@/util/atoms";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

import Image from "next/image";

import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { ReclaimDataItem } from "./reclaim-deposit";
import { useShortAddress } from "@/hooks/use-short-address";

const ReclaimStepper = ({
  amount,
  lockTime,
  status,
  reclaimTxId,
}: {
  amount: number;
  lockTime: string;
  status: ReclaimStatus;
  reclaimTxId: string;
}) => {
  const { PUBLIC_MEMPOOL_URL } = useAtomValue(bridgeConfigAtom);

  const mempoolUrl = useMemo(() => {
    return `${PUBLIC_MEMPOOL_URL}/tx/${reclaimTxId}`;
  }, [PUBLIC_MEMPOOL_URL, reclaimTxId]);

  const currentStatusTitle = useMemo(() => {
    switch (status) {
      case ReclaimStatus.Pending:
        return "Pending Transaction Pending Confirmation";
      case ReclaimStatus.PendingMint:
        return "Reclaim Transaction Pending Submission";
      case ReclaimStatus.Completed:
        return "Reclaim Transaction Confirmed";
      case ReclaimStatus.Failed:
        return "Failed";
    }
  }, [status]);

  const currentStatusText = useMemo(() => {
    switch (status) {
      case ReclaimStatus.Pending:
        return "Your reclaim transaction is waiting for confirmation. Please ensure that the transaction is confirmed on your selected wallet provider.";
      case ReclaimStatus.PendingMint:
        return "Your reclaim transaction has been submitted and we are waiting on It's confirmation.";
      case ReclaimStatus.Completed:
        return "Your reclaim transaction has been processed and you should now see funds back in your wallet.";
      case ReclaimStatus.Failed:
        return "Your reclaim transaction has failed, please contact us for further assistance.";
    }
  }, [status]);
  return (
    <div className="w-full flex flex-col  gap-4 ">
      <div className="w-full flex flex-col gap-3">
        <div className="flex  flex-row w-full gap-4 h-20">
          <div className="w-1/6  relative flex flex-col items-center justify-center h-full">
            <CheckIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
          </div>
          <ReclaimDataItem title="Reclaim Amount" value={`${amount} BTC`} />
        </div>
        <div className="flex  flex-row w-full gap-4 h-20">
          <div className="w-1/6  relative flex flex-col items-center justify-center h-full">
            <CheckIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
          </div>
          <ReclaimDataItem title="Locktime" value={`${lockTime} blocks`} />
        </div>
        <div className="flex  flex-row w-full gap-4 h-20">
          <div className="w-1/6  relative flex flex-col items-center justify-center h-full">
            <CheckIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
          </div>
          <ReclaimDataItem
            title="Reclaim Transaction"
            value={useShortAddress(reclaimTxId)}
            link={mempoolUrl}
          />
        </div>
        <div className="flex  flex-row w-full justify-start gap-4 h-40">
          <div className="w-1/6  relative flex flex-col pt-6 items-center justify-start h-full">
            {status === ReclaimStatus.Completed && (
              <CheckIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
            )}
            {status === ReclaimStatus.Failed && (
              <XMarkIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
            )}
            {(status === ReclaimStatus.Pending ||
              status === ReclaimStatus.PendingMint) && (
              <div
                className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-darkOrange"
                role="status"
              ></div>
            )}
          </div>
          <div
            style={{
              border: ".5px solid #FC6432",
            }}
            className="w-full pt-8 px-6  gap-2 flex flex-row items-start justify-between rounded-2xl  h-full"
          >
            <div className="flex flex-col max-w-[50%] gap-2">
              <p className="text-white font-light  text-md">
                {currentStatusTitle}
              </p>
              <p className="text-midGray font-light  text-sm">
                {currentStatusText}
              </p>
            </div>

            <a href={mempoolUrl} target="_blank" rel="noreferrer">
              <Image
                src="/images/sBTCWhite.png"
                alt="Icon"
                width={100}
                height={100}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReclaimStepper;
