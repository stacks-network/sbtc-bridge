"use client";
import { getAggregateKey } from "@/actions/get-aggregate-key";
import { useQuery } from "@tanstack/react-query";
import { payments } from "bitcoinjs-lib";
import Image from "next/image";
import { hexToBytes } from "@stacks/common";
import { useAtomValue } from "jotai";
import { bridgeConfigAtom } from "@/util/atoms";
import getBitcoinNetwork from "@/util/get-bitcoin-network";

const contracts = [
  {
    id: "sbtc-registry",
    title: "Registry",
  },
  {
    id: "sbtc-token",
    title: "Token",
  },
  {
    id: "sbtc-deposit",
    title: "Deposit",
  },
  {
    id: "sbtc-withdrawal",
    title: "Withdrawal",
  },
  {
    id: "sbtc-bootstrap-signers",
    title: "Signers Bootstrap",
  },
];

export default function Footer({ supportLink }: { supportLink?: string }) {
  const config = useAtomValue(bridgeConfigAtom);
  const network = getBitcoinNetwork(config.WALLET_NETWORK);
  const { data: aggregateAddress } = useQuery({
    queryKey: ["aggregateAddress"],
    queryFn: async () => {
      const response = await getAggregateKey();

      const p2tr = payments.p2tr({
        internalPubkey: hexToBytes(response.slice(2)),
        network,
      });
      return p2tr.address;
    },
  });
  return (
    <footer className="w-full flex flex-col items-center justify-center py-10 px-4 bg-white font-Matter">
      <div
        style={{
          maxWidth: "1200px",
        }}
        className="flex-1 w-full px-4 flex-row flex items-center justify-between"
      >
        <div>
          <Image
            src="/images/l2LabsLogo.svg"
            alt="Stacks Logo"
            width={100}
            height={100}
          />
        </div>
        <div className="flex flex-row gap-4">
          {supportLink && (
            <a
              suppressHydrationWarning
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="text-black font-light text-sm"
            >
              Live support
            </a>
          )}
          <a
            key="how-to-use"
            href="https://docs.stacks.co/guides-and-tutorials/sbtc/how-to-use-the-sbtc-bridge"
            target="_blank"
            rel="noreferrer"
            className="text-black font-light text-sm"
          >
            How to use this bridge
          </a>
          <a
            key="docs"
            href="https://docs.stacks.co/concepts/sbtc"
            target="_blank"
            rel="noreferrer"
            className="text-black font-light text-sm"
          >
            Docs
          </a>
          <a
            key="github"
            href="https://github.com/stacks-network/sbtc"
            target="_blank"
            rel="noreferrer"
            className="text-black font-light text-sm"
          >
            Github
          </a>
          <a
            key="pot"
            href={`${config.PUBLIC_MEMPOOL_URL}/address/${aggregateAddress}`}
            target="_blank"
            rel="noreferrer"
            className="text-black font-light text-sm"
          >
            BTC aggregate address
          </a>
        </div>
      </div>
      <div className="px-4 text-black w-full max-w-[1200px] mt-8 flex justify-between">
        <div>
          <h3>Stacks Mainnet Contracts</h3>
          <ul>
            {contracts.map((contract) => (
              <li className="mb-1" key={contract.id}>
                <a
                  key={contract.id}
                  href={`https://explorer.hiro.so/txid/SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.${contract.id}?chain=mainnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-black font-light text-sm"
                >
                  {contract.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
