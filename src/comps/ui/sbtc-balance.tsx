"use client";

import { bridgeConfigAtom } from "@/util/atoms";
import getSbtcTotalBalance from "@/actions/get-sbtc-balance";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";

export default function SBTCBalance({ address }: { address: string }) {
  const { SBTC_CONTRACT_DEPLOYER, WALLET_NETWORK } =
    useAtomValue(bridgeConfigAtom);
  const { data } = useQuery({
    queryKey: ["sbtc-balance", address],
    queryFn: async () => {
      return await getSbtcTotalBalance({
        address,
      });
    },
    enabled: !!address && !!SBTC_CONTRACT_DEPLOYER && !!WALLET_NETWORK,
  });

  return (
    !!address && (
      <div className="flex flex-col items-center justify-center">
        <div className="text-center font-bold text-darkGray font-Matter text-sm">
          Balance: {data !== undefined ? Number(data) / 1e8 : "..."} sBTC
        </div>
      </div>
    )
  );
}
