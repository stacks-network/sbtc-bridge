import Image from "next/image";

type FlowContainerProps = {
  children: React.ReactNode;
};
export const FlowContainer = ({ children }: FlowContainerProps) => {
  return (
    <div
      style={{
        maxWidth: "800px",
      }}
      className="w-full flex-row flex border-2 gap-4 border-lightGray rounded-2xl "
    >
      <div
        style={{
          maxWidth: "400px",
        }}
        className="flex flex-1 px-8 p-6  gap-3 flex-col "
      >
        {children}
      </div>
      <div
        style={{
          backgroundColor: "rgba(253, 157, 65, 0.1)",
          minHeight: "320px",
          minWidth: "320px",
        }}
        className="flex flex-col items-center justify-center flex-1"
      >
        <Image
          src="/images/StacksBitcoin.svg"
          alt="Icon"
          width={150}
          height={150}
        />
      </div>
    </div>
  );
};

type FlowLoaderContainerProps = FlowContainerProps & {
  showLoader: boolean;
};
export const FlowLoaderContainer = ({
  children,
  showLoader,
}: FlowLoaderContainerProps) => {
  return (
    <div
      style={{
        maxWidth: "800px",
      }}
      className="w-full flex-row flex border-2 gap-4 border-lightGray rounded-2xl "
    >
      <div
        style={{
          maxWidth: "400px",
        }}
        className="flex flex-1 px-8 p-6  gap-3 flex-col "
      >
        {children}
      </div>
      <div
        style={{
          backgroundColor: "rgba(253, 157, 65, 0.1)",
          minHeight: "320px",
          minWidth: "320px",
        }}
        className="flex flex-col items-center justify-center flex-1"
      >
        {showLoader ? (
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-orange"
            role="status"
          ></div>
        ) : (
          <Image
            src="/images/StacksBitcoin.svg"
            alt="Icon"
            width={150}
            height={150}
          />
        )}
      </div>
    </div>
  );
};

export const StatusContainer = ({ children }: FlowContainerProps) => {
  return (
    <div
      style={{
        maxWidth: "800px",
      }}
      className="w-full flex-row flex border-2 gap-4 border-lightGray rounded-2xl "
    >
      <div
        style={{
          maxWidth: "400px",
        }}
        className="flex flex-1 px-8 p-6  gap-3 flex-col "
      >
        {children}
      </div>
      <div
        style={{
          backgroundColor: "rgba(253, 157, 65, 0.1)",
          minHeight: "320px",
          minWidth: "320px",
        }}
        className="flex flex-col items-center justify-center flex-1"
      >
        <Image
          src="/images/StatusViewImg.svg"
          alt="Icon"
          width={250}
          height={250}
        />
      </div>
    </div>
  );
};
