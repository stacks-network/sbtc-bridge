"use client";

import { ArrowRightIcon } from "@heroicons/react/20/solid";
import Image from "next/image";

const HistoryView = () => {
  return (
    <div
      style={{
        maxWidth: "1152px",
      }}
      className="w-full flex flex-row gap-4 mt-16"
    >
      <div
        style={{
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}
        className="w-full h-min p-5 px-10 items-center justify-center pb-10 flex flex-col gap-6 rounded-2xl"
      >
        <h3 className="font-Matter text-white text-xl font-thin tracking-wide">
          COMING SOON
        </h3>
        <div className="flex flex-row items-center justify-center gap-4">
          <Image
            src="/images/sBTCIcon.svg"
            alt="Icon"
            width={125}
            height={125}
          />
          <ArrowRightIcon className="w-16 h-16 flex flex-row items-center justify-center rounded-full text-darkOrange " />
          <Image
            src="/images/btcIcon.svg"
            alt="Icon"
            width={125}
            height={125}
          />
        </div>
        <p className="text-white m-0 font-thin max-w-[800px] text-center text-mg">
          Due to popular demand, we released sBTC as ‘deposit-only’ for a
          handful of weeks. We’re hard at work on withdrawals - please check
          back shortly!
        </p>
      </div>
    </div>
  );
};

export default HistoryView;
