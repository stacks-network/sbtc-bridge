"use client";

import { Provider } from "jotai";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const isReskin = pathname?.startsWith("/reskin");

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
            {isReskin ? (
              <>{children}</>
            ) : (
              <>
                <Header config={config} />
                {children}
                <a
                  key="faqs"
                  href="https://docs.stacks.co/concepts/sbtc/sbtc-faq"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white font-light block text-xl font-Matter px-20 py-2 bg-[#fd8341] rounded opacity-90"
                >
                  FAQs
                </a>
                <Footer supportLink={config.SUPPORT_LINK} />
              </>
            )}

            <AsignaSignActionModals />
          </Suspense>
        </main>
      </QueryClientProvider>
    </Provider>
  );
}
