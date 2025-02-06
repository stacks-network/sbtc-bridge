import { useMemo } from "react";
import Image from "next/image";
import { DEPOSIT_STEP, DepositFlowStepProps } from "./deposit-manager";
import useMintCaps from "@/hooks/use-mint-caps";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationStatusType } from "../../Notifications";
import { showConnectWalletAtom, walletInfoAtom } from "@/util/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { useField } from "formik";

const DepositAmount = ({ setStep }: DepositFlowStepProps) => {
  const { currentCap, isWithinDepositLimits } = useMintCaps();

  const isMintCapReached = currentCap <= 0;

  const [field, meta] = useField({
    name: "amount",
  });

  const { notify } = useNotifications();

  // const walletInfo = useAtomValue(walletInfoAtom);

  // Handle form submission
  const handleSubmit = async () => {
    // Validate the amount using Yup
    const sats = Math.floor(Number(field.value) * 1e8);
    setStep(DEPOSIT_STEP.ADDRESS);
    return;

    if (await isWithinDepositLimits(sats)) {
      setStep(DEPOSIT_STEP.ADDRESS); // Proceed to the next step
    } else {
      notify({
        type: NotificationStatusType.ERROR,
        message: "Amount exceeds deposit limits",
      });
    }
  };

  const inputWidth = useMemo(() => {
    const stringAmount = field.value ?? "";

    const width = stringAmount.length * 50;

    if (width < 120) {
      return 120;
    }

    return stringAmount.length * 40;
  }, [field.value]);

  // don't need to do it more than once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return (
    <div className="w-full flex flex-col  ">
      <div className="flex  flex-row w-full gap-4 h-40">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full">
          <div
            style={{
              bottom: "-20px",
              right: "-40px",
            }}
            className="absolute w-10 h-10 flex flex-row items-center justify-center rounded-full bg-darkOrange "
          >
            <Image
              src="/images/swapIcon.svg"
              alt="Icon"
              width={30}
              height={30}
            />
          </div>
          <div
            style={{
              borderRadius: "44px",
            }}
            className="bg-[#1E1E1E] w-28 flex flex-row items-center justify-center h-10"
          >
            <p className="text-white text-sm ">BTC</p>
          </div>
        </div>
        <div
          style={{
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderBottom: "none",
          }}
          className="w-full gap-2 flex flex-row items-center justify-center rounded-tl-2xl rounded-tr-2xl h-full"
        >
          <input
            {...field}
            className={`bg-transparent focus:outline-none  h-full rounded-tl-2xl rounded-tr-2xl text-white ${
              isMintCapReached ? "text-md text-center" : "text-6xl text-right"
            }`}
            disabled={isMintCapReached}
            type="text"
            style={{
              width: `${isMintCapReached ? "100%" : inputWidth + "px"}`,
            }}
            placeholder={isMintCapReached ? "Mint cap reached!" : "0"}
          />
          {!isMintCapReached && (
            <div className=" flex flex-row mt-4 items-end">
              <p className=" text-4xl "> BTC</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-row w-full gap-4 h-40">
        <div className="w-1/6  flex flex-col items-center justify-center h-full">
          <div
            style={{
              borderRadius: "44px",
              borderTop: "none",
            }}
            className="bg-[#1E1E1E] w-28 flex flex-row items-center justify-center h-10"
          >
            <p className="text-white text-sm ">sBTC</p>
          </div>
        </div>
        <div
          style={{
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
          className="w-full gap-2 flex flex-row items-center justify-center rounded-bl-2xl rounded-br-2xl h-full"
        >
          <input
            disabled={true}
            className={`bg-transparent focus:outline-none h-full rounded-tl-2xl rounded-tr-2xl text-white ${
              isMintCapReached ? "text-md text-center" : "text-6xl text-right"
            }`}
            type="text"
            value={field.value}
            style={{
              width: `${isMintCapReached ? "100%" : inputWidth + "px"}`,
            }}
            placeholder={isMintCapReached ? "Mint cap reached!" : "0"}
          />
          {!isMintCapReached && (
            <div className=" flex flex-row mt-4 items-end">
              <p className=" text-4xl ">sBTC</p>
            </div>
          )}
        </div>
      </div>
      {/* Error message */}
      {!isMintCapReached && meta.error && (
        <div className="flex flex-row w-full mt-4 ">
          <div className="w-1/6  relative flex flex-col items-center justify-center h-full" />
          <div className="w-full gap-2 flex flex-row items-center justify-center rounded-bl-2xl rounded-br-2xl h-full">
            <p className="text-red-500 text-sm">{meta.error}</p>
          </div>
        </div>
      )}
      <div className="flex flex-row w-full mt-28 gap-10 ">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full" />
        <ConnectWalletAction disabled={isMintCapReached}>
          <button
            disabled={!!meta.error}
            onClick={handleSubmit}
            type="button"
            className="bg-darkOrange w-full h-14 flex flex-row items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            NEXT
          </button>
        </ConnectWalletAction>
      </div>
    </div>
  );
};

export default DepositAmount;

export const ConnectWalletAction = ({
  disabled,
  children,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const walletInfo = useAtomValue(walletInfoAtom);

  const isConnected = useMemo(() => !!walletInfo.selectedWallet, [walletInfo]);

  const setShowConnectWallet = useSetAtom(showConnectWalletAtom);

  return (
    <>
      {isConnected ? (
        children
      ) : (
        <button
          disabled={disabled}
          onClick={() => setShowConnectWallet(true)}
          className="bg-darkOrange w-full h-14 flex flex-row items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          CONNECT WALLET
        </button>
      )}
    </>
  );
};
