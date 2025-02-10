"use client";

import { Provider } from "jotai";
import { BridgeConfig, store } from "@/util/atoms";

import RenderNotifications from "@/comps/RenderNotifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/query/client";
import { Suspense, useEffect } from "react";
import { bridgeConfigAtom } from "@/util/atoms";
import Header from "@/comps/Header";
import Footer from "@/comps/footer";
import { AsignaSignActionModals } from "@asigna/btc-connect";

export default function LayoutClient({
  children,
  config,
}: Readonly<{
  children: React.ReactNode;
  config: BridgeConfig;
}>) {
  useEffect(() => {
    store.set(bridgeConfigAtom, config);
    // this is a setup step no need to run it twice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RenderNotifications />
        <main className="min-w-screen bg-white  flex items-center flex-col min-h-screen ">
          <Suspense fallback={<div>Loading...</div>}>
            <Header config={config} />
            {children}
            <Footer supportLink={config.SUPPORT_LINK} />
            <AsignaSignActionModals />
          </Suspense>
        </main>
      </QueryClientProvider>
    </Provider>
  );
}
