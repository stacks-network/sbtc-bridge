"use client";

import { useCallback, useEffect, useState } from "react";

import { InformationCircleIcon } from "@heroicons/react/20/solid";

import { FlowContainer } from "@/comps/core/FlowContainer";
import { Heading, SubText } from "@/comps/core/Heading";
import { FlowForm } from "@/comps/core/Form";
import { PrimaryButton, SecondaryButton } from "./core/FlowButtons";
import { hexToUint8Array, uint8ArrayToHexString } from "@/util/regtest/wallet";
import {
  createDepositAddress,
  createDepositScript,
  createReclaimScript,
} from "@/util/regtest/depositRequest";
import { useAtomValue } from "jotai";
import {
  bridgeConfigAtom,
  depositMaxFeeAtom,
  ENV,
  envAtom,
  userDataAtom,
} from "@/util/atoms";
import { NotificationStatusType } from "./Notifications";
import {
  createAddress,
  principalCV,
  serializeCVBytes,
} from "@stacks/transactions";

import { useShortAddress } from "@/hooks/use-short-address";
import { useNotifications } from "@/hooks/use-notifications";
import { DepositStepper } from "./deposit-stepper";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/*
  deposit flow has 3 steps
  1) enter amount you want to deposit
  - can change in what denomination you want to make deposit(satoshi, btc, usd)
  2) enter the stack address they want funds sent to
  3) confirm amount and stacks transaction address
  - create payment request
  - view payment status in history
*/

/*
  each step will have it's own custom configuration about how to deal with this data and basic parsing
  - we should create bulding blocks by not try to create dynamic views
*/

enum DEPOSIT_STEP {
  AMOUNT,
  ADDRESS,
  CONFIRM,
  REVIEW,
}

/*
  basic structure of a flow step
  1) heading with sometime a action item to the right of the heading
  2) subtext to give context to the user with the possibility of tags
  3) form to collect data or the final step which is usually reviewing all data before submitting (or even revewing post submission)
  4) buttons to navigate between steps
*/
type DepositFlowStepProps = {
  setStep: (step: DEPOSIT_STEP) => void;
};

type DepositFlowAmountProps = DepositFlowStepProps & {
  setAmount: (amount: number) => void;
};
const DepositFlowAmount = ({ setStep, setAmount }: DepositFlowAmountProps) => {
  const handleSubmit = (value: string | undefined) => {
    if (value) {
      setAmount(parseInt(value));
      setStep(DEPOSIT_STEP.ADDRESS);
    }
  };
  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Deposit</Heading>
        </div>
        <SubText>Convert BTC into sBTC</SubText>
        <FlowForm
          nameKey="amount"
          type="number"
          placeholder="BTC amount to transfer (in sats)"
          handleSubmit={(value) => handleSubmit(value)}
        ></FlowForm>
      </>
    </FlowContainer>
  );
};

type DepositFlowAddressProps = DepositFlowStepProps & {
  setStxAddress: (address: string) => void;
};

const DepositFlowAddress = ({
  setStep,
  setStxAddress,
}: DepositFlowAddressProps) => {
  const stacksNetwork = useAtomValue(envAtom);

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
        stacksNetwork === ENV.MAINNET ? MAINNET_PREFIX : TESTNET_PREFIX;

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
  const handleSubmit = (value: string | undefined) => {
    if (value) {
      // ensure that the value is a valid stacks address based on the network and length
      if (validateStxAddress(value)) {
        setStxAddress(value);
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
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Deposit</Heading>
        </div>
        <SubText>Amount selected to transfer</SubText>
        <FlowForm
          nameKey="address"
          type="text"
          placeholder="Enter Stacks address to transfer to"
          handleSubmit={(value) => handleSubmit(value)}
        >
          <SecondaryButton
            onClick={() => setStep(DEPOSIT_STEP.AMOUNT)}
            isValid={true}
          >
            PREV
          </SecondaryButton>
        </FlowForm>
      </>
    </FlowContainer>
  );
};

type DepositFlowConfirmProps = DepositFlowStepProps & {
  amount: number;
  stxAddress: string;
  handleUpdatingTransactionInfo: (info: TransactionInfo) => void;
};

const DepositFlowConfirm = ({
  setStep,
  amount,
  stxAddress,
  handleUpdatingTransactionInfo,
}: DepositFlowConfirmProps) => {
  const { notify } = useNotifications();

  const {
    EMILY_URL: emilyUrl,
    SIGNER_AGGREGATE_KEY: signerPubKey,
    WALLET_NETWORK: walletNetwork,
  } = useAtomValue(bridgeConfigAtom);

  const maxFee = useAtomValue(depositMaxFeeAtom);

  const userData = useAtomValue(userDataAtom);

  const handleNextClick = async () => {
    try {
      if (userData === null) {
        throw new Error("User data is not set");
      }

      // Combine the version and hash into a single Uint8Array
      const serializedAddress = serializeCVBytes(principalCV(stxAddress));
      const lockTime = 6000;

      // Create the reclaim script and convert to Buffer
      const reclaimScript = Buffer.from(
        createReclaimScript(lockTime, new Uint8Array([])),
      );

      const reclaimScriptHex = uint8ArrayToHexString(reclaimScript);

      const signerUint8Array = hexToUint8Array(signerPubKey!);

      const depositScript = Buffer.from(
        createDepositScript(signerUint8Array, maxFee, serializedAddress),
      );
      // convert buffer to hex
      const depositScriptHexPreHash = uint8ArrayToHexString(depositScript);
      const p2trAddress = createDepositAddress(
        serializedAddress,
        signerPubKey!,
        maxFee,
        lockTime,
      );

      /*
      const txHex = await createDepositTx(
        serializedAddress,
        senderSeedPhrase,
        signerPubKey,
        amount,
        maxFee,
        lockTime
      );
      */

      // check the wallet provider from user data
      let txId = "";
      let txHex = "";

      if (
        userData.profile.walletProvider === "hiro-wallet" ||
        userData.profile.walletProvider === "leather"
      ) {
        const sendParams = {
          recipients: [
            {
              address: p2trAddress,
              amount: `${amount}`,
            },
          ],
          network: walletNetwork,
        };
        const response = await window.LeatherProvider?.request(
          "sendTransfer",
          sendParams,
        );

        if (response && response.result) {
          const _txId = response.result.txid.replace(/^"|"$/g, ""); // Remove leading and trailing quotes
          txId = _txId;
        }
      } else if (userData.profile.walletProvider === "xverse") {
        // get the txId from the xverse wallet
        if (!window.XverseProviders) {
          throw new Error("XverseProviders not found");
        }
        const response = await window.XverseProviders.request("sendTransfer", {
          recipients: [
            {
              address: p2trAddress,
              amount: Number(amount),
            },
          ],
        });
        if (response.status === "success") {
          // handle success
          txId = response.txId;
        } else {
          // handle error
          notify({
            type: NotificationStatusType.ERROR,
            message: `Issue with Transaction`,
          });

          throw new Error("Error with the transaction");
        }
      } else {
        throw new Error("Wallet provider not supported");
      }

      if (txId === "") {
        notify({
          type: NotificationStatusType.ERROR,
          message: `Issue with Transaction`,
        });

        throw new Error("Error with the transaction");
      }

      const emilyReqPayload = {
        bitcoinTxid: txId,
        bitcoinTxOutputIndex: 0,
        reclaimScript: reclaimScriptHex,
        depositScript: depositScriptHexPreHash,
        url: emilyUrl,
      };

      // make emily post request
      const response = await fetch("/api/emilyDeposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emilyReqPayload),
      });

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
      notify({
        type: NotificationStatusType.ERROR,
        message: `Error while depositing funds`,
      });
    }
  };
  const handlePrevClick = () => {
    setStep(DEPOSIT_STEP.ADDRESS);
  };

  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Deposit</Heading>
        </div>
        <div className="flex flex-col  gap-2">
          <div className="flex flex-col gap-1">
            <SubText>Amount selected to Transfer</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {amount} sats
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <SubText>Stacks address to transfer to</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {useShortAddress(stxAddress)}
            </p>
          </div>
        </div>
        <div className="flex flex-1 ">
          <div className="w-full p-4 bg-lightOrange h-10 rounded-lg flex flex-row items-center justify-center gap-2">
            <InformationCircleIcon className="h-6 w-6 text-orange" />
            <p className="text-orange font-Matter font-semibold text-sm break-keep">
              Please verify the information before proceeding
            </p>
          </div>
        </div>
        <div className="w-full flex-row flex justify-between items-center">
          <SecondaryButton onClick={() => handlePrevClick()}>
            PREV
          </SecondaryButton>
          <PrimaryButton onClick={() => handleNextClick()}>NEXT</PrimaryButton>
        </div>
      </>
    </FlowContainer>
  );
};

type TransactionInfo = {
  hex: string;
  txId: string;
};
type DepositFlowReviewProps = DepositFlowStepProps & {
  txId: string;
  amount: number;
  stxAddress: string;
};

const DepositFlowReview = ({
  txId,
  amount,
  stxAddress,
}: DepositFlowReviewProps) => {
  return (
    <FlowContainer>
      <>
        <div className="w-full flex flex-row items-center justify-between">
          <Heading>Review Transaction</Heading>
        </div>
        <div className="flex flex-col  gap-2">
          <div className="flex flex-col gap-1">
            <SubText>Amount selected to Transfer</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {amount} sats
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <SubText>Stacks address to transfer to</SubText>
            <p className="text-black font-Matter font-semibold text-sm">
              {useShortAddress(stxAddress)}
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-end">
          <DepositStepper txId={txId} />
        </div>

        {/* <div className="w-full flex-row flex justify-between items-center">
          <PrimaryButton onClick={() => handleNextClick()}>
            VIEW TX INFO
          </PrimaryButton>
          <PrimaryButton onClick={() => handleTxStatusClick()}>
            VIEW STATUS
          </PrimaryButton>
        </div> */}
      </>
    </FlowContainer>
  );
};

const DepositFlow = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [step, _setStep] = useState(DEPOSIT_STEP.AMOUNT);

  const [stxAddress, _setStxAddress] = useState(
    searchParams.get("stxAddress") ?? "",
  );
  const [amount, _setAmount] = useState(
    Number(searchParams.get("amount") ?? 0),
  );
  const [txId, _setTxId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("txId", txId);
    params.set("step", String(step));
    params.set("amount", String(amount));
    router.push(pathname + "?" + params.toString());
  }, [amount, txId, step, router, pathname]);

  useEffect(() => {
    const currentStep = Number(searchParams.get("step"));
    if (currentStep === DEPOSIT_STEP.REVIEW || !currentStep) {
      _setStep(currentStep);
      _setTxId(searchParams.get("txId") || "");
      _setAmount(Number(searchParams.get("amount") || 0));
    }
    // need to run this only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTxId = useCallback((info: TransactionInfo) => {
    _setTxId(info.txId);
  }, []);
  const setStep = useCallback((newStep: DEPOSIT_STEP) => {
    _setStep(newStep);
  }, []);

  const handleUpdateStep = useCallback(
    (newStep: DEPOSIT_STEP) => {
      setStep(newStep);
    },
    [setStep],
  );

  const setStxAddress = useCallback((address: string) => {
    _setStxAddress(address);
  }, []);

  const setAmount = useCallback((amount: number) => {
    _setAmount(amount);
  }, []);

  const handleUpdatingTransactionInfo = useCallback(
    (info: TransactionInfo) => {
      setTxId(info);
    },
    [setTxId],
  );
  const renderStep = () => {
    switch (step) {
      case DEPOSIT_STEP.AMOUNT:
        return (
          <DepositFlowAmount setAmount={setAmount} setStep={handleUpdateStep} />
        );
      case DEPOSIT_STEP.ADDRESS:
        return (
          <DepositFlowAddress
            setStxAddress={setStxAddress}
            setStep={handleUpdateStep}
          />
        );
      case DEPOSIT_STEP.CONFIRM:
        return (
          <DepositFlowConfirm
            setStep={handleUpdateStep}
            amount={amount}
            stxAddress={stxAddress}
            handleUpdatingTransactionInfo={handleUpdatingTransactionInfo}
          />
        );
      case DEPOSIT_STEP.REVIEW:
        return (
          <DepositFlowReview
            txId={txId}
            amount={amount}
            stxAddress={stxAddress}
            setStep={handleUpdateStep}
          />
        );
      default:
        return <div> Something went wrong</div>;
    }
  };

  return (
    <>
      {renderStep()}
      <div
        style={{
          margin: "16px 0",
        }}
      />
    </>
  );
};

export default DepositFlow;
