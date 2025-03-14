"use server";
import { env } from "@/env";

import { BufferCV, Cl, TupleCV, UIntCV } from "@stacks/transactions";

import { encodeBitcoinAddress } from "@/util/decode-bitcoin-address";
import { WithdrawalStatus } from "@/app/withdraw/[txid]/components/util";
import getBitcoinNetwork from "@/util/get-bitcoin-network";

type contractCallData = {
  contract_id: string;
  function_name: string;
  function_signature: string;
  function_args: FunctionArg[];
};

type FunctionArg = {
  hex: string;
  repr: string;
  name: string;
  type: string;
};

export async function getWithdrawalInfo(txid: string) {
  const tx = await fetch(`${env.STACKS_API_URL}/extended/v1/tx/${txid}`);
  const txData = await tx.json();
  const contractCall = txData.contract_call as contractCallData;

  const amount = (Cl.deserialize(contractCall.function_args[0].hex) as UIntCV)
    .value as bigint;

  const recipient = (
    Cl.deserialize(contractCall.function_args[1].hex) as TupleCV<{
      hashbytes: BufferCV;
      version: BufferCV;
    }>
  ).value;

  const address = encodeBitcoinAddress(
    recipient.hashbytes.value,
    recipient.version.value,
    getBitcoinNetwork(env.WALLET_NETWORK),
  );
  let data = {
    address,
    amount: Number(amount),
  };
  let status: WithdrawalStatus = WithdrawalStatus.pending;
  if (txData.tx_status === "success") {
    const [, , printEvent] = txData.events;

    const printEventDeserialized = Cl.deserialize(
      printEvent.contract_log.value.hex,
    ) as TupleCV<{
      "request-id": UIntCV;
    }>;
    const requestId = printEventDeserialized.value["request-id"]
      .value as bigint;

    const withdrawal = await fetch(`${env.EMILY_URL}/withdrawal/${requestId}`);

    if (!withdrawal.ok) {
      throw new Error(`Failed to fetch withdrawal data: ${withdrawal.status}`);
    }
    const withdrawalData = await withdrawal.json();
    status = WithdrawalStatus[withdrawalData.status as WithdrawalStatus];
  } else if (txData.tx_status !== "pending") {
    status = WithdrawalStatus.failed;
  }
  return {
    ...data,
    status,
  };
}
