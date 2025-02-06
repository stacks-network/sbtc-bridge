import { classNames } from "@/util";

type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  isValid?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};
export const PrimaryButton = ({
  children,
  onClick,
  isValid = true,
  disabled = false,
  type = "button",
}: ButtonProps) => {
  return (
    <button
      disabled={disabled}
      type={type}
      className="w-40 rounded-lg py-3 flex justify-center items-center flex-row bg-orange disabled:opacity-50 disabled:cursor-not-allowed "
      onClick={onClick}
    >
      <p
        className={classNames(
          " text-md tracking-wider font-Matter font-bold",
          isValid ? "text-black" : "text-black",
        )}
      >
        {children}
      </p>
    </button>
  );
};

export const SecondaryButton = ({
  children,
  onClick,
  isValid = true,
  type = "button",
  disabled,
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className="w-40 rounded-lg py-3 flex justify-center items-center flex-row bg-lightOrange disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <p
        className={classNames(
          " text-lg tracking-wider font-Matter font-semibold",
          isValid ? "text-black" : "text-black",
        )}
      >
        {children}
      </p>
    </button>
  );
};
