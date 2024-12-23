import { useMemo, useState } from "react";
import Image from "next/image";
import { DEPOSIT_STEP, DepositFlowAmountProps } from "../Deposit";
import useMintCaps from "@/hooks/use-mint-caps";

import * as yup from "yup";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationStatusType } from "../Notifications";
import { showConnectWalletAtom, walletInfoAtom } from "@/util/atoms";
import { useAtomValue, useSetAtom } from "jotai";

type DepositFlowAmounExtendedtProps = DepositFlowAmountProps & {
  amount: number;
  btcBalance: number;
};
const DepositAmount = ({
  setStep,
  setAmount,
  amount,
  btcBalance,
}: DepositFlowAmounExtendedtProps) => {
  const { currentCap, isWithinDepositLimits, perDepositMinimum } =
    useMintCaps();

  const maxDepositAmount = currentCap / 1e8;
  const minDepositAmount = perDepositMinimum / 1e8;
  const isMintCapReached = currentCap <= 0;

  const validationSchema = useMemo(
    () =>
      yup.object({
        amount: yup
          .number()
          // dust amount is in sats
          .min(
            minDepositAmount,
            `Minimum deposit amount is ${minDepositAmount} BTC`,
          )
          .max(
            Math.min(btcBalance, maxDepositAmount),
            btcBalance < maxDepositAmount
              ? `The deposit amount exceeds your current balance of ${btcBalance} BTC`
              : `Current deposit cap is ${maxDepositAmount} BTC`,
          )
          .required(),
      }),
    [btcBalance, maxDepositAmount, minDepositAmount],
  );

  const [stringAmount, setStringAmount] = useState(String(amount / 1e8));

  const { notify } = useNotifications();

  // const walletInfo = useAtomValue(walletInfoAtom);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ensure that the value is a number
    // remove any non-numeric characters
    // but keep white spaces

    const value = e.target.value;
    setStringAmount(value);
    setAmount(parseFloat(value));

    // allow for white space empty value

    if (isNaN(parseInt(value))) {
      notify({
        type: NotificationStatusType.ERROR,
        message: "Please enter a valid amount",
      });
    } else {
      const parsedAmount = parseFloat(value);
      try {
        const validation = await validationSchema.validate({
          amount: parsedAmount,
        });
        console.log("validation", validation);

        setAmount(parseFloat(value));
      } catch (err: any) {
        notify({
          type: NotificationStatusType.ERROR,
          message: err.message || "Invalid input",
        });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate the amount using Yup
      const validation = await validationSchema.validate({ amount });

      console.log("validation", validation);
      const sats = Math.floor(Number(amount) * 1e8);
      if (await isWithinDepositLimits(sats)) {
        setAmount(Number(sats));
        setStep(DEPOSIT_STEP.ADDRESS); // Proceed to the next step
      } else {
        notify({
          type: NotificationStatusType.ERROR,
          message: "Amount exceeds deposit limits",
        });
      }
    } catch (error: any) {
      notify({
        type: NotificationStatusType.ERROR,
        message: error.message || "Invalid input",
      });
    }
  };

  const inputWidth = useMemo(() => {
    const stringAmount = amount.toString();

    const width = stringAmount.length * 50;

    if (width < 120) {
      return 120;
    }

    return amount.toString().length * 40;
  }, [amount]);
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
            onChange={handleChange}
            className="bg-transparent placeholder:text-3xl text-right focus:outline-none  h-full text-6xl rounded-tl-2xl rounded-tr-2xl text-white "
            type="text"
            value={stringAmount}
            style={{
              width: `${inputWidth}px`,
            }}
            placeholder={isMintCapReached ? "Mint cap reached!" : "0.00"}
          />
          <div className=" flex flex-row mt-4 items-end">
            <p className=" text-4xl "> BTC</p>
          </div>
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
            className="bg-transparent placeholder:text-3xl text-right focus:outline-none  h-full text-6xl rounded-tl-2xl rounded-tr-2xl text-white "
            type="text"
            value={stringAmount || 0}
            style={{
              width: `${inputWidth}px`,
            }}
            placeholder={
              isMintCapReached ? "Mint cap reached!" : "Enter Amount"
            }
          />
          <div className=" flex flex-row mt-4 items-end">
            <p className=" text-4xl ">sBTC</p>
          </div>
        </div>
      </div>
      <div className="flex flex-row w-full mt-28 gap-10 ">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full" />
        <ConnectWalletAction disabled={isMintCapReached}>
          <button
            disabled={isMintCapReached}
            onClick={() => handleSubmit()}
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
