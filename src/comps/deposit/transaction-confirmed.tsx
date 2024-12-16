import { useMemo } from "react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { DepositFlowReviewProps } from "../Deposit";
import { useShortAddress } from "@/hooks/use-short-address";
import { useAtomValue } from "jotai";
import { bridgeConfigAtom } from "@/util/atoms";

const TransactionConfirmed = ({
  txId,
  amount,
  stxAddress,
}: DepositFlowReviewProps) => {
  const { PUBLIC_MEMPOOL_URL } = useAtomValue(bridgeConfigAtom);

  const mempoolUrl = useMemo(() => {
    return `${PUBLIC_MEMPOOL_URL}/tx/${txId}`;
  }, [PUBLIC_MEMPOOL_URL, txId]);

  return (
    <div className="w-full flex flex-col  gap-4 ">
      <div className="flex  flex-row w-full gap-4 h-20">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full">
          <CheckIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
        </div>
        <div
          style={{
            border: "2px solid #FC6432",
          }}
          className="w-full py-4 px-6  gap-2 flex flex-row items-center justify-between rounded-2xl  h-full"
        >
          <p className="text-white font-semibold  text-sm">
            Selected Deposit Amount
          </p>

          <div
            style={{
              borderRadius: "44px",
            }}
            className="bg-[#1E1E1E] px-6 gap-4 flex flex-row items-center justify-center h-10"
          >
            <p className="text-white font-bold text-sm ">
              {" "}
              {amount !== 0 ? amount / 1e8 : 0} BTC
            </p>
          </div>
        </div>
      </div>
      <div className="flex  flex-row w-full gap-4 h-20">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full">
          <CheckIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
        </div>
        <div
          style={{
            border: "2px solid #FC6432",
          }}
          className="w-full py-4 px-6  gap-2 flex flex-row items-center justify-between rounded-2xl  h-full"
        >
          <p className="text-white font-semibold  text-sm">
            Selected Deposit Address
          </p>

          <div
            style={{
              borderRadius: "44px",
            }}
            className="bg-[#1E1E1E] px-6 gap-4 flex flex-row items-center justify-center h-10"
          >
            <p className="text-white font-bold text-sm ">
              {" "}
              {useShortAddress(stxAddress)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex  flex-row w-full gap-4 h-20">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full">
          <CheckIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
        </div>
        <div
          style={{
            border: "2px solid #FC6432",
          }}
          className="w-full py-4 px-6  gap-2 flex flex-row items-center justify-between rounded-2xl  h-full"
        >
          <p className="text-white font-semibold  text-sm">
            Transaction Broadcasted!
          </p>
          <a href={mempoolUrl} target="_blank" rel="noreferrer">
            <div
              style={{
                borderRadius: "44px",
              }}
              className="bg-[#1E1E1E] px-6 gap-4 flex flex-row items-center justify-center h-10"
            >
              <p className="text-white font-bold text-sm ">
                {" "}
                {useShortAddress(txId)}
              </p>
            </div>
          </a>
        </div>
      </div>

      <div className="flex flex-row w-full mt-6  gap-4 ">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full" />
        <div className="flex w-full flex-row gap-2"></div>
      </div>
    </div>
  );
};

export default TransactionConfirmed;
