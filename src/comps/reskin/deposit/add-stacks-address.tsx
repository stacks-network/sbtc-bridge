import { CheckIcon, PencilIcon } from "@heroicons/react/20/solid";
import { DEPOSIT_STEP, DepositFlowStepProps } from "./deposit-manager";
import { useAtomValue } from "jotai";
import { bridgeConfigAtom } from "@/util/atoms";
import { createAddress } from "@stacks/transactions";
import { ConnectWalletAction } from "./deposit-amount";
import { useField, useFormikContext } from "formik";

const DepositAddress = ({ setStep }: DepositFlowStepProps) => {
  const { WALLET_NETWORK: stacksNetwork } = useAtomValue(bridgeConfigAtom);

  const validateStxAddress = (addressOrContract: string) => {
    // validate the address

    try {
      // check length
      if (!addressOrContract) {
        return "Address is required";
      }
      const isContractAddress = addressOrContract.includes(".");
      const [address, contractName] = addressOrContract.split(".");
      if (address.length < 38 || address.length > 41) {
        return "Address is not the correct length";
      }
      // smart contract names shouldn't exceed 64 characters
      if (
        isContractAddress &&
        (contractName.length < 3 || contractName.length > 64)
      ) {
        return "Contract name is invalid";
      }

      const MAINNET_PREFIX = ["SP", "SM"];
      const TESTNET_PREFIX = ["ST", "SN"];
      const validPrefix =
        stacksNetwork === "mainnet" ? MAINNET_PREFIX : TESTNET_PREFIX;

      if (!validPrefix.some((prefix) => address.startsWith(prefix))) {
        return "Address isn't valid for the current network";
      }

      // check if valid for network
      createAddress(address);
    } catch (err) {
      return "Address is invalid please use a valid STX address";
    }
  };

  const handleSubmit = () => {
    setStep(DEPOSIT_STEP.CONFIRM);
  };

  const [field, meta] = useField({
    name: "stxAddress",
    validate: validateStxAddress,
  });
  const { values } = useFormikContext<{
    amount: string;
    stxAddress: string;
  }>();
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
            onClick={() => setStep(DEPOSIT_STEP.AMOUNT)}
            className="bg-[#1E1E1E] px-6 gap-4 cursor-pointer flex flex-row items-center justify-center h-10"
          >
            <p className="text-white font-bold text-sm ">{values.amount} BTC</p>
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
            {...field}
            className="bg-transparent placeholder:text-xl text-center focus:outline-none  w-full h-full text-lg rounded-tl-xl rounded-tr-2xl text-[#FD9D41] "
            type="text"
            placeholder="Enter Address"
          />
        </div>
      </div>
      {meta.error && (
        <div className="flex flex-row w-full mt-4 ">
          <div className="w-1/6  relative flex flex-col items-center justify-center h-full" />
          <div className="w-full gap-2 flex flex-row items-center justify-center rounded-bl-2xl rounded-br-2xl h-full">
            <p className="text-red-500 text-sm">{meta.error}</p>
          </div>
        </div>
      )}
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
              disabled={!!meta.error}
              onClick={handleSubmit}
              type="button"
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
