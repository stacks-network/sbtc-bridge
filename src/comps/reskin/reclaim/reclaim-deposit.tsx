import { useNotifications } from "@/hooks/use-notifications";
import { ConnectWalletAction } from "../deposit/deposit-amount";
import { ReclaimDepositProps } from "./reclaim-manager";
import { useAtomValue, useSetAtom } from "jotai";
import {
  bridgeConfigAtom,
  showConnectWalletAtom,
  walletInfoAtom,
  WalletProvider,
} from "@/util/atoms";
import { useRouter } from "next/navigation";
import {
  constructPsbtForReclaim,
  createTransactionFromHex,
  finalizePsbt,
} from "@/util/reclaimHelper";
import {
  signPSBTLeather,
  signPSBTXverse,
} from "@/util/wallet-utils/src/sign-psbt";
import { NotificationStatusType } from "../../Notifications";
import { transmitRawTransaction } from "@/actions/bitcoinClient";
import { useShortAddress } from "@/hooks/use-short-address";
import { useMemo } from "react";
import Link from "next/link";
import { CheckIcon } from "@heroicons/react/20/solid";

const ReclaimDeposit = ({
  amount,
  depositTransaction,
}: ReclaimDepositProps) => {
  const { notify } = useNotifications();
  const walletInfo = useAtomValue(walletInfoAtom);
  const setShowWallet = useSetAtom(showConnectWalletAtom);
  const router = useRouter();

  const { WALLET_NETWORK: walletNetwork, PUBLIC_MEMPOOL_URL } =
    useAtomValue(bridgeConfigAtom);

  const mempoolUrl = useMemo(() => {
    return `${PUBLIC_MEMPOOL_URL}/tx/${depositTransaction.bitcoinTxid}`;
  }, [PUBLIC_MEMPOOL_URL, depositTransaction.bitcoinTxid]);

  const buildReclaimTransaction = async () => {
    try {
      // FIXME: move to env
      const maxReclaimFee = 5000;

      const btcAddress = getWalletAddress();

      if (!btcAddress) {
        return setShowWallet(true);
      }

      const unsignedTxHex = constructPsbtForReclaim({
        depositAmount: Math.floor(amount * 1e8),
        feeAmount: maxReclaimFee,
        lockTime: depositTransaction.parameters.lockTime,
        depositScript: depositTransaction.depositScript,
        reclaimScript: depositTransaction.reclaimScript,
        txId: depositTransaction.bitcoinTxid,
        vout: depositTransaction.bitcoinTxOutputIndex,
        bitcoinReturnAddress: btcAddress,
        walletNetwork,
      });

      await signPSBT(unsignedTxHex);
    } catch (err) {
      console.error("Error building reclaim transaction", err);
    }
  };

  const signPSBT = async (psbtHex: string) => {
    const params = {
      hex: psbtHex,
      address: walletInfo.addresses.payment!.address,
      network: walletNetwork,
    };
    let signedPsbt = "";
    if (walletInfo.selectedWallet === WalletProvider.LEATHER) {
      signedPsbt = await signPSBTLeather(params);
    }
    if (walletInfo.selectedWallet === WalletProvider.XVERSE) {
      signedPsbt = await signPSBTXverse(params);
    }

    if (signedPsbt) {
      const finalizedTxHex = finalizePsbt(signedPsbt, walletNetwork);

      await broadcastTransaction(finalizedTxHex);
    } else {
      notify({
        type: NotificationStatusType.ERROR,
        message: "Error signing PSBT",
      });
    }
  };

  const broadcastTransaction = async (finalizedTxHex: string) => {
    try {
      const broadcastTransaction = await transmitRawTransaction(finalizedTxHex);

      if (!broadcastTransaction) {
        notify({
          type: NotificationStatusType.ERROR,
          message: "Error broadcasting transaction",
        });
        return;
      }
      notify({
        type: NotificationStatusType.SUCCESS,
        message: "Reclaim transaction broadcast",
      });

      const transactionId = createTransactionFromHex(finalizedTxHex);

      // set a query params to the transaction id as reclaimTxId and updated the status

      router.push(`/reclaim?reclaimTxId=${transactionId}`);
    } catch (err) {
      console.warn("Error broadcasting transaction", err);
    }
  };

  const getWalletAddress = () => {
    return walletInfo?.addresses.payment?.address;
  };

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
          <ReclaimDataItem
            title="Locktime"
            value={`${depositTransaction.parameters.lockTime} blocks`}
          />
        </div>
        <div className="flex  flex-row w-full gap-4 h-20">
          <div className="w-1/6  relative flex flex-col items-center justify-center h-full">
            <CheckIcon className="w-10 h-10 flex flex-row items-center justify-center rounded-full text-darkOrange " />
          </div>
          <ReclaimDataItem
            title="Deposit Transaction"
            value={useShortAddress(depositTransaction.bitcoinTxid)}
            link={mempoolUrl}
          />
        </div>
      </div>
      <div className="flex flex-row w-full mt-6  gap-4 ">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full"></div>
        <div className="flex w-full flex-row gap-2">
          <button
            onClick={() => router.back()}
            style={{
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
            className=" w-2/6 h-14 flex flex-row items-center justify-center rounded-lg "
          >
            BACK
          </button>
          <ConnectWalletAction>
            <button
              onClick={() => buildReclaimTransaction()}
              className="bg-darkOrange w-full h-14 flex flex-row items-center justify-center rounded-lg "
            >
              CONFIRM RECLAIM
            </button>
          </ConnectWalletAction>
        </div>
      </div>
    </div>
  );
};

export default ReclaimDeposit;

export const ReclaimDataItem = ({
  title,
  value,
  link,
}: {
  title: string;
  value: string;
  link?: string;
}) => {
  return (
    <div className="flex  flex-row w-full gap-4 h-20">
      <div
        style={{
          border: ".5px solid #FC6432",
        }}
        className="w-full py-4 px-6  gap-2 flex flex-row items-center justify-between rounded-3xl  h-full"
      >
        <p className="text-white font-light  text-md">{title}</p>
        {link ? (
          <Link target="_blank" rel="noreferrer" href={link}>
            <div
              style={{
                borderRadius: "44px",
              }}
              className="bg-[#1E1E1E] px-8 py-2 gap-4 cursor-pointer flex flex-row items-center justify-center h-10"
            >
              <p className="text-white font-Matter font-thin text-lg ">
                {value}
              </p>
            </div>
          </Link>
        ) : (
          <div
            style={{
              borderRadius: "44px",
            }}
            className="bg-[#1E1E1E] px-6 gap-4  flex flex-row items-center justify-center h-10"
          >
            <p className="text-white font-Matter font-thin text-lg">{value}</p>
          </div>
        )}
      </div>
    </div>
  );
};
