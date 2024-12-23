import getCurrentSbtcSupply from "@/actions/get-current-sbtc-supply";
import getEmilyLimits from "@/actions/get-emily-limits";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export default function useMintCaps() {
  const {
    data: emilyLimitsData,
    isFetching: isLoadingEmilyLimits,
    refetch: refetchEmilyLimits,
  } = useQuery({
    queryKey: ["deposit-max-fee"],
    queryFn: () => getEmilyLimits(),
  });
  const {
    data: sbtcSupplyData,
    refetch: refetchSbtcSupply,
    isFetching: isLoadingSbtcSupply,
  } = useQuery({
    queryKey: ["current-sbtc-supply"],
    queryFn: () => getCurrentSbtcSupply(),
  });
  const isLoading = isLoadingEmilyLimits || isLoadingSbtcSupply;
  const refetchPegData = useCallback(async () => {
    const { data: currentEmilyLimitsData } = await refetchEmilyLimits();
    const { data: currentSbtcSupplyData } = await refetchSbtcSupply();

    return {
      currentEmilyLimitsData,
      currentSbtcSupplyData,
    };
  }, [refetchEmilyLimits, refetchSbtcSupply]);

  const isWithinDepositLimits = useCallback(
    async (amount: number) => {
      const { currentEmilyLimitsData, currentSbtcSupplyData } =
        await refetchPegData();
      if (!currentEmilyLimitsData || !currentSbtcSupplyData) {
        return false;
      }
      const supplyPlusDeposit =
        Number(currentSbtcSupplyData.value.value) + amount;
      const withinMintCap =
        amount >= currentEmilyLimitsData.perDepositMinimum &&
        supplyPlusDeposit < currentEmilyLimitsData.pegCap;
      const depositLessThanMax = currentEmilyLimitsData.perDepositCap >= amount;
      return withinMintCap && depositLessThanMax;
    },
    [refetchPegData],
  );

  const currentCap = useMemo(() => {
    const currentPerDepositCap = emilyLimitsData?.perDepositCap ?? 0;
    const currentMintable =
      (emilyLimitsData?.pegCap ?? 0) - Number(sbtcSupplyData?.value.value ?? 0);
    return Math.min(currentPerDepositCap, currentMintable);
  }, [
    emilyLimitsData?.pegCap,
    emilyLimitsData?.perDepositCap,
    sbtcSupplyData?.value.value,
  ]);
  console.log({
    sbtcSupplyData,
    currentCap,
    perDepositMinimum: emilyLimitsData?.perDepositMinimum ?? 0,
    isWithinDepositLimits,
    isLoading,
  });
  return {
    currentCap,
    perDepositMinimum: emilyLimitsData?.perDepositMinimum ?? 0,
    isWithinDepositLimits,
    isLoading,
  };
}
