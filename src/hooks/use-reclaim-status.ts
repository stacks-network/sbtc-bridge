import { useEffect, useState } from "react";
import { getReclaimInfo } from "@/util/tx-utils";

export enum ReclaimStatus {
  Pending = "pending",
  Completed = "completed",
  Failed = "failed",
}

export const useReclaimStatus = (txId: string) => {
  // we'll need to fetch this from the bitcoin rpc to get the current status of the tx
  const [reclaimStatus, setReclaimStatus] = useState<ReclaimStatus>(
    ReclaimStatus.Pending,
  );

  useEffect(() => {
    if (txId && reclaimStatus !== ReclaimStatus.Completed) {
      // fetch the status of the reclaim tx from the bitcoin rpc
      // and update the reclaimStatus
      // setReclaimStatus(ReclaimStatus.Completed);

      const interval = setInterval(async () => {
        const reclaimTx = await getReclaimInfo({
          reclaimTxId: txId,
        });

        let status = ReclaimStatus.Pending;
        if (reclaimTx.status.confirmed) {
          status = ReclaimStatus.Completed;
        }

        setReclaimStatus(status);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [txId]);

  return reclaimStatus;
};
