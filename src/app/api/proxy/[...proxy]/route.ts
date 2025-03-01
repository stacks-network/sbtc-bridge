import { env } from "@/env";

import { getUtxosBitcoinDaemon } from "./rpc-handler-core";
import { validate, Network } from "bitcoin-address-validation";

const { MEMPOOL_API_URL } = env;
// Import your Bitcoin RPC logic

export async function POST(req: Request) {
  try {
    if (env.WALLET_NETWORK === "mainnet") {
      return Response.json({ error: "Mainnet not supported" }, { status: 400 });
    }

    const path = new URL(req.url).pathname.replace("/api/proxy/", "");
    return fetch(`${MEMPOOL_API_URL}/${path}`, {
      method: req.method,
      body: await req.text(),
    });
  } catch (error) {
    // good for debugging
    // eslint-disable-next-line no-console
    console.error("Error in POST handler:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    if (env.WALLET_NETWORK === "mainnet") {
      return Response.json({ error: "Mainnet not supported" }, { status: 400 });
    }
    const url = new URL(req.url);
    const path = url.pathname.replace("/api/proxy/", ""); // Get the dynamic part of the route
    // if path ends with "/utxo" then we are looking for the utxo of an address

    if (path.endsWith("/utxo")) {
      // Special route for `/transaction/utxo`

      // get the second to last part of the url

      // get the second to last part of the url
      const address = path.split("/")[1];
      if (!validate(address, Network.regtest)) {
        return Response.json({ error: "Invalid address" }, { status: 400 });
      }

      return getUtxosBitcoinDaemon(address);
    }

    // Proxy all other routes to the base proxy URL
    const proxyUrl = `${MEMPOOL_API_URL}/${path}`;
    const response = await fetch(proxyUrl, {
      ...req,
    });

    const headers = response.headers;
    headers.delete("content-encoding");

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    // good for debugging
    // eslint-disable-next-line no-console
    console.error("Error in GET handler:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
