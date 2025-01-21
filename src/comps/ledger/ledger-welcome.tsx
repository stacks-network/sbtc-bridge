import { useAtomValue, useSetAtom } from "jotai";
import { PrimaryButton, PrimaryButtonExtended } from "../core/FlowButtons";
import Image from "next/image";
import { ledgerTransportAtom, showConnectLedgerAtom } from "@/util/atoms";

const LedgerWelcome = ({
  setCurrentStep,
}: {
  setCurrentStep: (step: number) => void;
}) => {
  return (
    <>
      <Image
        src="/images/ledgerLogo.svg"
        alt="Ledger Logo"
        width={150}
        height={150}
      />
      <PrimaryButtonExtended
        type="button"
        isValid={true}
        onClick={() => setCurrentStep(1)}
        buttonStyle="w-full mt-4"
      >
        Ensure your Ledger is connected and unlocked
      </PrimaryButtonExtended>
    </>
  );
};

export default LedgerWelcome;

export const LedgerSuccess = ({
  setCurrentStep,
}: {
  setCurrentStep: (step: number) => void;
}) => {
  const transport = useAtomValue(ledgerTransportAtom);

  const setShowConnectLedger = useSetAtom(showConnectLedgerAtom);

  if (transport === null) {
    return (
      <>
        <p>Failed to connect to Ledger</p>
        <PrimaryButton type="button" onClick={() => setCurrentStep(0)}>
          Try Again
        </PrimaryButton>
      </>
    );
  }
  return (
    <>
      <p>Successfully Connected to {transport.deviceModel?.productName} </p>;
      <PrimaryButtonExtended
        type="button"
        isValid={true}
        onClick={() => setShowConnectLedger(false)}
        buttonStyle="w-full mt-4"
      >
        Get Started
      </PrimaryButtonExtended>
    </>
  );
};
