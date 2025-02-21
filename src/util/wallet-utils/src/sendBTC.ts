import { request } from "@stacks/connect";

type Payload = {
  recipient: string;
  amountInSats: number;
};

export async function sendBTC({ amountInSats, recipient }: Payload) {
  const result = await request("sendTransfer", {
    recipients: [
      {
        address: recipient,
        amount: amountInSats,
      },
    ],
  });

  return result.txid.replace(/"|'/g, "");
}
