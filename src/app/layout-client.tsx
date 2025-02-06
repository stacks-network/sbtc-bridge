"use client";

import { Provider } from "jotai";
import { BridgeConfig, store } from "@/util/atoms";

import RenderNotifications from "@/comps/RenderNotifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/query/client";
import { Suspense, useEffect } from "react";
import { bridgeConfigAtom } from "@/util/atoms";

import Footer from "@/comps/footer";
import ReskinHeader from "@/comps/reskin/core/header-v2";
import Header from "@/comps/Header";
import { usePathname } from "next/navigation";
import ReskinFooter from "@/comps/reskin/footer";
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
    console.log("config,", config);
    store.set(bridgeConfigAtom, config);
    // this is a setup step no need to run it twice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backgroundColor = isReskin ? "bg-[#272628] " : "bg-white";
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RenderNotifications />
        <main
          className={`min-w-screen ${backgroundColor}  flex items-center flex-col min-h-screen `}
        >
          <Suspense fallback={<div>Loading...</div>}>
            {isReskin ? (
              <>
                <ReskinHeader config={config} />
                {children}
                <ReskinFooter supportLink={config.SUPPORT_LINK} />
              </>
            ) : (
              <>
                <Header config={config} />
                {children}
                <Footer supportLink={config.SUPPORT_LINK} />
              </>
            )}
          </Suspense>
        </main>
      </QueryClientProvider>
    </Provider>
  );
}
