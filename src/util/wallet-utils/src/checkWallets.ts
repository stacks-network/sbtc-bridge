const checkXverseProvider = () => {
  return Boolean(
    window.XverseProviders?.BitcoinProvider || window.BitcoinProvider,
  );
};

const checkFordefiProvider = () => {
  return Boolean(window.FordefiProviders?.UtxoProvider);
};

export enum WalletType {
  xverse = "xverse",
  leather = "leather",
  asigna = "asigna",
  fordefi = "fordefi",
}
export const checkAvailableWallets: () => {
  [key in WalletType]: boolean;
} = () => {
  const isLeather = !!window.LeatherProvider;
  const isXverse = checkXverseProvider();
  const isFordefi = checkFordefiProvider();

  return {
    leather: isLeather,
    xverse: isXverse,
    asigna: window.top !== window.self,
    fordefi: isFordefi,
  };
};
