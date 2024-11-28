"use server";

import packageJson from "../../../../package.json";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest) {
  return NextResponse.json(
    {
      result: {
        version: packageJson.version,
        contracts_deployer: process.env.SBTC_CONTRACT_ADDRESS,
      },
    },
    { status: 200 },
  );
}
