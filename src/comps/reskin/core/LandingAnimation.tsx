import React from "react";
import { motion } from "framer-motion";

export const StepAnimation = ({
  children,
  stepKey,
}: {
  children: React.ReactNode;
  stepKey: number;
}) => {
  const stepVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <motion.div
      key={stepKey}
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full items-center"
    >
      {children}
    </motion.div>
  );
};
const LandingAnimation = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-1 flex-col w-full px-5 gap-6 items-center pt-5"
    >
      {children}
    </motion.div>
  );
};

export default LandingAnimation;
