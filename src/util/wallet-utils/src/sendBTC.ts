import { request } from "@stacks/connect";

type Payload = {
  recipient: string;
  amountInSats: number;
  network?: string;
};

export async function sendBTC({ amountInSats, recipient, network }: Payload) {
  const result = await request("sendTransfer", {
    recipients: [
      {
        address: recipient,
        amount: amountInSats,
      },
    ],
    network,
  } as any);

  const values = Object.entries(result)
  // why you might ask? ForDefi return txId instead of txid
  const txId = values.filter(([key, value]) => key.toLowerCase() === "txid")[0][1]

  return txId
}
