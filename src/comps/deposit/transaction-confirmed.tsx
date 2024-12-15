import { useState } from "react";
import Image from "next/image";
import { CheckIcon, PencilIcon } from "@heroicons/react/20/solid";

const TransactionConfirmed = () => {
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
            <p className="text-white font-bold text-sm ">2.05 BTC</p>
            <PencilIcon className="w-4 h-4 flex flex-row items-center justify-center rounded-full text-[#FD9D41] " />
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
            Selected Deposit Amount
          </p>

          <div
            style={{
              borderRadius: "44px",
            }}
            className="bg-[#1E1E1E] px-6 gap-4 flex flex-row items-center justify-center h-10"
          >
            <p className="text-white font-bold text-sm ">2.05 BTC</p>
            <PencilIcon className="w-4 h-4 flex flex-row items-center justify-center rounded-full text-[#FD9D41] " />
          </div>
        </div>
      </div>
      <div className="flex  flex-row w-full items-start  gap-4 h-auto">
        <div className="w-1/6  relative flex flex-col items-center justify-start h-full">
          <CheckIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
        </div>
        <div
          style={{
            border: "2px solid #FC6432",
          }}
          className="w-full py-4 px-6  h-40  gap-2 flex flex-row items-start justify-between rounded-2xl "
        >
          <p className="text-white font-semibold  text-sm">
            Transaction Confirmed!
          </p>
        </div>
      </div>

      <div className="flex flex-row w-full mt-6  gap-4 ">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full" />
        <div className="flex w-full flex-row gap-2">
          <button className="bg-darkOrange w-full h-14 flex flex-row items-center justify-center rounded-lg ">
            CONFIRM TRANSACTION
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionConfirmed;
