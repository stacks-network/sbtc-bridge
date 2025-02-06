import { useFormik } from "formik";
import { PrimaryButton } from "./FlowButtons";
import { useAtomValue, useSetAtom } from "jotai";
import { showConnectWalletAtom, walletInfoAtom } from "@/util/atoms";
import { useMemo } from "react";
import { Schema as YupSchema } from "yup";
// this is supposed to be as reusable as possible given all the flows are very similar in order and action
type FlowFormProps = {
  nameKey: string;
  placeholder: string;
  initialValue?: string;
  handleSubmit: (value: string | undefined) => void;
  type?: "text" | "number";
  children?: React.ReactNode;
  validationSchema?: YupSchema;
  disabled?: boolean;
};
// tailwind div that reset all default form styles

export const FlowForm = ({
  nameKey,
  placeholder,
  initialValue,
  handleSubmit,
  type,
  children,
  validationSchema,
  disabled,
}: FlowFormProps) => {
  const walletInfo = useAtomValue(walletInfoAtom);
  const isConnected = useMemo(() => !!walletInfo.selectedWallet, [walletInfo]);
  const setShowConnectWallet = useSetAtom(showConnectWalletAtom);

  const formik = useFormik({
    initialValues: {
      [nameKey]: initialValue,
    },
    onSubmit: (values) => {
      handleSubmit(values[nameKey]);
    },
    validationSchema,
  });

  return (
    <form
      className="w-full flex flex-1 flex-col gap-14 justify-end font-Matter"
      onSubmit={formik.handleSubmit}
    >
      <div className="relative ">
        <input
          type={type}
          name={nameKey}
          placeholder={placeholder}
          value={formik.values[nameKey]}
          onChange={formik.handleChange}
          disabled={disabled}
          className={`w-full py-2 border-b-2 bg-transparent text-xl text-black focus:outline-none placeholder-gray-300 ${
            formik.isValid ? "border-orange" : "border-red-300"
          } transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        <p className="text-red-500 text-sm h-4">{formik.errors[nameKey]}</p>
      </div>
      <div className="w-full flex-row flex justify-between items-center">
        {children}
        {isConnected ? (
          <PrimaryButton
            type="submit"
            onClick={formik.handleSubmit}
            disabled={!formik.isValid || disabled}
          >
            NEXT
          </PrimaryButton>
        ) : (
          <button
            disabled={disabled}
            type="button"
            onClick={() => setShowConnectWallet(true)}
            className="bg-orange px-4 py-2 rounded-md font-Matter text-xs font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CONNECT WALLET
          </button>
        )}
      </div>
    </form>
  );
};
export type NameKeysInfo = {
  [key: string]: string;
  nameKey: string;
  initValue: string;
  placeholder: string;
  type: "text" | "number";
};
type FlowFormDynamicProps = {
  nameKeys: NameKeysInfo[];
  handleSubmit: (values: Record<string, string>) => void;
  children?: React.ReactNode;
};
export const FlowFormDynamic = ({
  nameKeys,
  handleSubmit,
  children,
}: FlowFormDynamicProps) => {
  const formik = useFormik({
    initialValues: nameKeys.reduce(
      (acc: { [key: string]: string }, { nameKey, initValue }) => {
        acc[nameKey] = initValue;
        return acc;
      },
      {},
    ),

    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  return (
    <form
      className="w-full flex flex-1 flex-col gap-14 justify-end"
      onSubmit={formik.handleSubmit}
    >
      {nameKeys.map(({ nameKey, placeholder, type }) => (
        <div key={nameKey} className="relative ">
          <input
            type={type}
            name={nameKey}
            placeholder={placeholder}
            value={formik.values[nameKey]}
            onChange={formik.handleChange}
            className={`w-full py-2 border-b-2 bg-transparent text-xl text-black focus:outline-none placeholder-gray-300 ${
              formik.isValid ? "border-orange" : "border-midGray"
            } transition-colors duration-500`}
          />
        </div>
      ))}

      <div className="w-full flex-row flex justify-between items-center">
        {children}
        <PrimaryButton
          type="submit"
          onClick={formik.handleSubmit}
          isValid={formik.isValid}
        >
          NEXT
        </PrimaryButton>
      </div>
    </form>
  );
};
