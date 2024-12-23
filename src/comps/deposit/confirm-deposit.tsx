import { CheckIcon, PencilIcon } from "@heroicons/react/20/solid";
import { DEPOSIT_STEP, DepositFlowConfirmProps } from "../Deposit";
import { useShortAddress } from "@/hooks/use-short-address";
import { useNotifications } from "@/hooks/use-notifications";
import { useAtomValue } from "jotai";
import {
  bridgeConfigAtom,
  depositMaxFeeAtom,
  walletInfoAtom,
  WalletProvider,
} from "@/util/atoms";

import { STACKS_TESTNET, STACKS_MAINNET, STACKS_DEVNET } from "@stacks/network";

import { NotificationStatusType } from "../Notifications";
import { getAggregateKey } from "@/util/get-aggregate-key";
import { principalCV, serializeCVBytes } from "@stacks/transactions";
import {
  createDepositAddress,
  createDepositScript,
  createReclaimScript,
} from "@/util/depositRequest";

import {
  bytesToHex as uint8ArrayToHexString,
  hexToBytes as hexToUint8Array,
} from "@stacks/common";
import getBitcoinNetwork from "@/util/get-bitcoin-network";
import { sendBTCLeather, sendBTCXverse } from "@/util/wallet-utils";
import { ConnectWalletAction } from "./deposit-amount";
import { useEmilyDeposit } from "@/util/use-emily-deposit";
import { getStacksNetwork } from "@/util/get-stacks-network";
import { useQuery } from "@tanstack/react-query";

const ConfirmDeposit = ({
  setStep,
  amount,
  stxAddress,
  handleUpdatingTransactionInfo,
}: DepositFlowConfirmProps) => {
  const { notify } = useNotifications();

  const { notifyEmily, isPending: isPendingNotifyEmily } = useEmilyDeposit();

  const {
    EMILY_URL: emilyUrl,
    WALLET_NETWORK: walletNetwork,
    RECLAIM_LOCK_TIME: lockTime,
  } = useAtomValue(bridgeConfigAtom);

  const maxFee = useAtomValue(depositMaxFeeAtom);
  const config = useAtomValue(bridgeConfigAtom);
  const walletInfo = useAtomValue(walletInfoAtom);

  const { data: isEmilySyncWNetwork } = useQuery({
    queryKey: ["isEmilySyncWNetwork"],
    queryFn: async () => {
      try {
        // Ensure that network chaintip and emily chaintip are in sync
        let stacksNetworkRPC = STACKS_MAINNET.client.baseUrl;
        const network = getStacksNetwork(walletNetwork);
        if (network === "devnet") {
          stacksNetworkRPC = STACKS_DEVNET.client.baseUrl;
        }
        if (network === "testnet") {
          stacksNetworkRPC = STACKS_TESTNET.client.baseUrl;
        }
        const response = await fetch(`${stacksNetworkRPC}/extended`);
        const data = await response.json();

        console.log("data", data);
        const stacksChainTip = data.chain_tip.block_height;

        const emilyResponse = await fetch(`${emilyUrl}/chainstate`);

        const emilyData = await emilyResponse.json();

        console.log("emilyData", emilyData);

        const emilyChainTip = emilyData.stacksBlockHeight;

        console.log("stacksChainTip", stacksChainTip);
        console.log("emilyChainTip", emilyChainTip);

        if (stacksChainTip !== emilyChainTip) {
          notify({
            type: NotificationStatusType.ERROR,
            message: `Emily is out of sync with the network. Please try again later`,
          });
          return false;
          //setStep(DEPOSIT_STEP.AMOUNT);
        } else if (stacksChainTip === emilyChainTip) {
          return true;
        }
      } catch (err) {
        console.log(err);
      }
    },
    enabled: !!emilyUrl,
  });

  const handleNextClick = async () => {
    try {
      const signersAggregatePubKey = (await getAggregateKey()).slice(2);

      // Combine the version and hash into a single Uint8Array
      const serializedAddress = serializeCVBytes(principalCV(stxAddress));

      // Parse lockTime from env variable
      const parsedLockTime = parseInt(lockTime || "144");

      // get the publicKey from the user payment address
      // user cannot continue if they're not connected
      const paymentAddress = walletInfo.addresses.payment!;

      const reclaimPublicKey = paymentAddress.publicKey;

      // Create the reclaim script and convert to Buffer
      const reclaimScript = Buffer.from(
        createReclaimScript(parsedLockTime, reclaimPublicKey),
      );

      const reclaimScriptHex = uint8ArrayToHexString(reclaimScript);

      const signerUint8Array = hexToUint8Array(signersAggregatePubKey!);

      const depositScript = Buffer.from(
        createDepositScript(signerUint8Array, maxFee, serializedAddress),
      );
      // convert buffer to hex
      const depositScriptHexPreHash = uint8ArrayToHexString(depositScript);
      const p2trAddress = createDepositAddress(
        serializedAddress,
        signersAggregatePubKey!,
        maxFee,
        parsedLockTime,
        getBitcoinNetwork(config.WALLET_NETWORK),
        reclaimPublicKey,
      );

      let txId = "";
      let txHex = "";

      try {
        const params = {
          recipient: p2trAddress,
          amountInSats: amount,
          network: walletNetwork,
        };

        console.log({
          preSendParams: {
            bitcoinTxid: txId,
            bitcoinTxOutputIndex: 0,
            reclaimScript: reclaimScriptHex,
            depositScript: depositScriptHexPreHash,
          },
        });
        switch (walletInfo.selectedWallet) {
          case WalletProvider.LEATHER:
            txId = await sendBTCLeather(params);
            break;
          case WalletProvider.XVERSE:
            txId = await sendBTCXverse(params);
            break;
        }
      } catch (error) {
        let errorMessage = error;
        console.warn(error);
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        notify({
          type: NotificationStatusType.ERROR,
          message: `Issue with Transaction ${errorMessage}`,
        });
        return;
      }

      const emilyReqPayload = {
        bitcoinTxid: txId,
        bitcoinTxOutputIndex: 0,
        reclaimScript: reclaimScriptHex,
        depositScript: depositScriptHexPreHash,
      };

      console.log({ emilyReqPayloadClient: JSON.stringify(emilyReqPayload) });
      // make emily post request
      const response = await notifyEmily(emilyReqPayload);

      if (!response.ok) {
        notify({
          type: NotificationStatusType.ERROR,
          message: `Issue with Request to Emily`,
        });

        throw new Error("Error with the request");
      }

      notify({
        type: NotificationStatusType.SUCCESS,
        message: `Successful Deposit request`,
      });
      setStep(DEPOSIT_STEP.REVIEW);
      handleUpdatingTransactionInfo({
        hex: txHex,
        txId: txId,
      });
    } catch (error) {
      let errorMessage = error;
      console.warn(error);
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      notify({
        type: NotificationStatusType.ERROR,
        message: `Error while depositing funds: ${errorMessage}`,
      });
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
            Selected Deposit Amount
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
            onClick={() => setStep(DEPOSIT_STEP.ADDRESS)}
            className="bg-[#1E1E1E] px-6 gap-4 flex  cursor-pointer flex-row items-center justify-center h-10"
          >
            <p className="text-white font-bold text-sm ">
              {useShortAddress(stxAddress)}
            </p>
            <PencilIcon className="w-4 h-4 flex flex-row items-center justify-center rounded-full text-[#FD9D41] " />
          </div>
        </div>
      </div>

      <div className="flex flex-row w-full mt-6  gap-4 ">
        <div className="w-1/6  relative flex flex-col items-center justify-center h-full" />
        <div className="flex w-full flex-row gap-2">
          <button
            disabled={isPendingNotifyEmily}
            onClick={() => setStep(DEPOSIT_STEP.ADDRESS)}
            style={{
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
            className=" w-2/6 h-14 flex flex-row items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            BACK
          </button>
          <ConnectWalletAction>
            {isEmilySyncWNetwork ? (
              <button
                disabled={isPendingNotifyEmily}
                onClick={() => handleNextClick()}
                className="bg-darkOrange w-full h-14 flex flex-row items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CONFIRM TRANSACTION
              </button>
            ) : (
              <div
                style={{
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                }}
                className=" w-full h-14 flex flex-row items-center justify-center rounded-lg "
              >
                EMILY IS OUT OF SYNC
              </div>
            )}
          </ConnectWalletAction>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeposit;
