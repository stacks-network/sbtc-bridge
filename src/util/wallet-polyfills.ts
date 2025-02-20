import { useAsignaConnect } from "@asigna/btc-connect";
import { BridgeConfig } from "./atoms";

export function setupAsigna(
  asignaConnect: ReturnType<typeof useAsignaConnect>,
  config: BridgeConfig,
) {
  if (typeof window === "undefined") return;
  if (!isInIframe()) return;

  const ID = "WrappedAsigna";

  (window as any).WrappedAsigna = {
    request: async (method: string, params: any) => {
      switch (method) {
        case "getAddresses":
          return { result: await asignaConnect.connect() };
        case "signPsbt":
          return { result: await asignaConnect.openSignPsbt(params.psbt) };
        case "sendTransfer":
          return {
            result: (await asignaConnect.openSignBtcAmount(
              {
                amountInSats: params.recipients[0].amount,
                recipient: params.recipients[0].address,
                network: undefined,
              },
              true,
              config.MEMPOOL_API_URL + "/",
            )) as string,
          };
      }
    },
  };

  window.wbip_providers ||= [];

  if (!window.wbip_providers.some((p) => p.id === ID)) {
    window.wbip_providers.push({
      id: ID,
      name: "Asigna",
    });
  }
}

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}
