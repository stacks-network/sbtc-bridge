export function getLeatherBTCProviderOrThrow() {
  let provider = window.LeatherProvider;
  if (!provider) {
    throw new Error("BTC provider not found");
  }

  return provider;
}

export const FORDEFI_PROVIDER_ID = "FordefiProviders.UtxoProvider";

export function getFordefiBTCProviderOrThrow() {
  let provider = window.FordefiProviders?.UtxoProvider;
  if (!provider) {
    throw new Error("BTC provider not found");
  }

  return provider;
}
