"use server";

import { env } from "@/env";
import { cache } from "react";
import { DefaultNetworkConfigurations } from "@leather.io/models";

export default cache(async function getSbtcBridgeConfig() {
  const EMILY_URL = env.EMILY_URL;
  const WALLET_NETWORK = env.WALLET_NETWORK as
    | DefaultNetworkConfigurations
    | undefined;
  const SBTC_CONTRACT_DEPLOYER = env.SBTC_CONTRACT_DEPLOYER;
  const BANNER_CONTENT = env.BANNER_CONTENT;
  const RECLAIM_LOCK_TIME = env.RECLAIM_LOCK_TIME;
  const MEMPOOL_URL = env.MEMPOOL_URL;

  return {
    EMILY_URL,
    WALLET_NETWORK,
    SBTC_CONTRACT_DEPLOYER,
    BANNER_CONTENT,
    RECLAIM_LOCK_TIME,
    MEMPOOL_URL,
  };
});
