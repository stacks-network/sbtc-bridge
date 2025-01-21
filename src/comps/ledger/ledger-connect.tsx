"use client";

import { motion } from "framer-motion";
import { Heading, SubText } from "../core/Heading";

import { useState } from "react";
import { Step } from "../deposit-stepper";
import LedgerWelcome, { LedgerSuccess } from "./ledger-welcome";
import LedgerDevice from "./ledger-device";

type LedgerConnect = {
  onClose: () => void;
};

const LedgerConnect = ({ onClose }: LedgerConnect) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleRenderStep = () => {
    switch (currentStep) {
      case 0:
        return <LedgerWelcome setCurrentStep={setCurrentStep} />;
      case 1:
        return <LedgerDevice setCurrentStep={setCurrentStep} />;
      case 2:
        return <LedgerSuccess setCurrentStep={setCurrentStep} />;
      default:
        return <p>Something went wrong</p>;
    }
    return;
  };
  return (
    <motion.div
      initial={{ x: "0", opacity: 0 }}
      animate={{ x: "0", opacity: 1 }}
      onClick={() => onClose()}
      className="fixed inset-0 bg-black text-black bg-opacity-50 flex items-center justify-center md:p-4 z-20"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFF5EB",
        }}
        className=" rounded-lg  flex flex-col items-center gap-4 p-6 w-full h-screen sm:h-fit sm:w-[540px]  shadow-lg"
      >
        <div className="w-full flex flex-col gap-2 items-center justify-center">
          <Heading>Connect Ledger</Heading>
          <SubText>To Start Using the Bridge</SubText>
        </div>
        <ol className="w-full ml-24 flex items-center justify-center  text-xs text-gray-900 font-medium sm:text-base text-black">
          <Step
            currentStep={currentStep}
            index={0}
            name="Unlock"
            lastStep={2}
          />
          <Step
            currentStep={currentStep}
            index={1}
            name="Device"
            lastStep={2}
          />
          <Step
            currentStep={currentStep}
            index={2}
            name="Account"
            lastStep={2}
          />
        </ol>
        {
          // Content Section
        }
        <div className="w-full flex items-center  flex-col gap-2">
          {handleRenderStep()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LedgerConnect;
