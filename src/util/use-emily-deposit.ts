import { NotificationStatusType } from "@/comps/Notifications";
import { useNotifications } from "@/hooks/use-notifications";
import { useMutation } from "@tanstack/react-query";

const expBackoff = (attempt: number) => Math.min(2 ** attempt, 30) * 1000;
export const useEmilyDeposit = () => {
  const { notify } = useNotifications();
  const { mutateAsync, failureCount, isPending } = useMutation({
    mutationFn: async (params: {
      bitcoinTxid: string;
      bitcoinTxOutputIndex: number;
      reclaimScript: string;
      depositScript: string;
    }) => {
      console.log({ emilyReqPayloadClient: JSON.stringify(params) });
      const res = await fetch("/api/emilyDeposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        if (failureCount > 2) {
          notify({
            message: "Error creating deposit retrying...",
            type: NotificationStatusType.ERROR,
          });
        }
        throw res;
      }
      return res;
    },
    retryDelay: expBackoff,
    retry: true,
  });
  return { notifyEmily: mutateAsync, isPending };
};
