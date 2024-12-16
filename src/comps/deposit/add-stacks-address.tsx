import { useState } from "react";
import Image from "next/image";
import { CheckIcon, PencilIcon } from "@heroicons/react/20/solid";
import { DEPOSIT_STEP, DepositFlowAddressProps } from "../Deposit";
import { useAtomValue } from "jotai";
import { bridgeConfigAtom } from "@/util/atoms";
import { useNotifications } from "@/hooks/use-notifications";
import { createAddress } from "@stacks/transactions";
import { NotificationStatusType } from "../Notifications";
import { ConnectWalletAction } from "./deposit-amount";

const DepositAddress = ({
  setStxAddress,
  setStep,
  stxAddress,
  amount,
}: DepositFlowAddressProps) => {
  const { WALLET_NETWORK: stacksNetwork } = useAtomValue(bridgeConfigAtom);

  const { notify } = useNotifications();

  const validateStxAddress = (addressOrContract: string) => {
    // validate the address

    try {
      // check length
      const isContractAddress = addressOrContract.includes(".");
      const [address, contractName] = addressOrContract.split(".");
      if (address.length < 38 || address.length > 41) {
        return false;
      }
      // smart contract names shouldn't exceed 64 characters
      if (
        isContractAddress &&
        (contractName.length < 3 || contractName.length > 64)
      ) {
        return false;
      }

      const MAINNET_PREFIX = ["SP", "SM"];
      const TESTNET_PREFIX = ["ST", "SN"];
      const validPrefix =
        stacksNetwork === "mainnet" ? MAINNET_PREFIX : TESTNET_PREFIX;

      if (!validPrefix.some((prefix) => address.startsWith(prefix))) {
        return false;
      }

      // check if valid for network
      createAddress(address);

      return true;
    } catch (err) {
      return false;
    }
  };

  const handleSubmit = () => {
    console.log("stxAddress", stxAddress);
    if (stxAddress) {
      // ensure that the value is a valid stacks address based on the network and length
      if (validateStxAddress(stxAddress)) {
        setStxAddress(stxAddress);
        setStep(DEPOSIT_STEP.CONFIRM);
      } else {
        notify({
          type: NotificationStatusType.ERROR,
          message: `Invalid Stacks Address`,
        });
      }
    }
  };

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
            Selected Deposit Address
          </p>

          <div
            style={{
              borderRadius: "44px",
            }}
            onClick={() => setStep(DEPOSIT_STEP.AMOUNT)}
            className="bg-[#1E1E1E] px-6 gap-4 cursor-pointer flex flex-row items-center justify-center h-10"
          >
            <p className="text-white font-bold text-sm ">
              {amount !== 0 ? amount / 1e8 : 0} BTC
            </p>
            <PencilIcon className="w-4 h-4 flex flex-row items-center justify-center rounded-full text-[#FD9D41] " />
          </div>
        </div>
      </div>
      <div className="flex  flex-row w-full gap-4 h-40">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full"></div>
        <div
          style={{
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
          className="w-full gap-2 py-4 px-6 flex flex-col items-start justify-start rounded-2xl  h-full"
        >
          <p className="text-white font-semibold  text-sm">
            Provide a Deposit Address
          </p>
          <input
            className="bg-transparent placeholder:text-xl text-center focus:outline-none  w-full h-full text-lg rounded-tl-xl rounded-tr-2xl text-[#FD9D41] "
            type="text"
            placeholder="Enter Address"
            value={stxAddress}
            onChange={(e) => setStxAddress(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-row w-full mt-6  gap-4 ">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full" />
        <div className="flex w-full flex-row gap-2">
          <button
            onClick={() => setStep(DEPOSIT_STEP.AMOUNT)}
            style={{
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
            className=" w-2/6 h-14 flex flex-row items-center justify-center rounded-lg "
          >
            BACK
          </button>
          <ConnectWalletAction>
            <button
              onClick={() => handleSubmit()}
              className="bg-darkOrange w-full h-14 flex flex-row items-center justify-center rounded-lg "
            >
              NEXT
            </button>
          </ConnectWalletAction>
        </div>
      </div>
    </div>
  );
};

export default DepositAddress;
