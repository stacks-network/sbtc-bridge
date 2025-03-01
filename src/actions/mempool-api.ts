"use server";
import { getUtxosBitcoinDaemon } from "@/app/api/proxy/[...proxy]/rpc-handler-core";
import { RateLimiter } from "limiter";

class LimiterLibraryRateLimiter {
  maxRequestWindowMS: number = 60 * 1000;
  limiter: RateLimiter;
  constructor() {
    this.limiter = new RateLimiter({
      tokensPerInterval: 500,
      interval: "minute",
      fireImmediately: false,
    });
  }

  async acquireToken(fn: () => Promise<Response>): Promise<Response> {
    if (this.limiter.tryRemoveTokens(1)) {
      await nextTick();
      return fn();
    } else {
      await sleep(this.maxRequestWindowMS);
      return this.acquireToken(fn);
    }
  }
}

const factory = <T extends (...args: any[]) => Promise<Response>>(fn: T) => {
  const tokenBucket = new LimiterLibraryRateLimiter();
  return (...args: Parameters<T>) => {
    return fetchAndRetryIfNecessary(() =>
      tokenBucket.acquireToken(() => fn(...args)),
    );
  };
};
export const mempoolFetchUntilOk = factory(
  (...args: Parameters<typeof fetch>) => fetch(...args),
);

export const bitcoindUtxoFetch = factory((address: string) =>
  getUtxosBitcoinDaemon(address),
);

async function fetchAndRetryIfNecessary(callAPI: () => Promise<Response>) {
  const response = await callAPI();
  if (!response.ok) {
    const millisToSleep = 500;
    await sleep(millisToSleep);
    return fetchAndRetryIfNecessary(callAPI);
  }
  return response;
}

// General Helpers

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function nextTick() {
  return sleep(0);
}
