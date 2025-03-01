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
  const PUBLIC_MEMPOOL_URL = env.PUBLIC_MEMPOOL_URL;
  const MEMPOOL_API_URL = env.MEMPOOL_API_URL;
  const SUPPORT_LINK = env.SUPPORT_LINK;
  const POLLING_INTERVAL = env.POLLING_INTERVAL;

  return {
    EMILY_URL,
    WALLET_NETWORK,
    SBTC_CONTRACT_DEPLOYER,
    BANNER_CONTENT,
    RECLAIM_LOCK_TIME,
    PUBLIC_MEMPOOL_URL,
    SUPPORT_LINK,
    POLLING_INTERVAL,
    MEMPOOL_API_URL,
  };
});
