type TextProps = {
  children: React.ReactNode;
};
export const Heading = ({ children }: TextProps) => {
  return (
    <h1 className="text-3xl text-black font-Matter font-normal">{children}</h1>
  );
};

export const SubText = ({ children }: TextProps) => {
  return (
    <p className="text-darkGray font-Matter font-thin text-sm">{children}</p>
  );
};
