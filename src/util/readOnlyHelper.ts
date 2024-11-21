import { fetchCallReadOnlyFunction } from "@stacks/transactions";
import { cvToJSON, ReadOnlyFunctionOptions } from "@stacks/transactions";

import { StacksNetwork } from "@stacks/network";

type ReadOnlyHelperProps = {
  stacksNetwork: StacksNetwork;
  walletAddress: string;
  functionName: string;
};

const readOnlyHelper = async ({
  functionName,
  stacksNetwork,
  walletAddress,
}: ReadOnlyHelperProps) => {
  const options: ReadOnlyFunctionOptions = {
    contractAddress: process.env.NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS || "",
    contractName: process.env.NEXT_PUBLIC_SBTC_CONTRACT_NAME || "",

    functionName: functionName,
    //'get-current-aggregate-pubkey',
    functionArgs: [],
    network: stacksNetwork,
    senderAddress: walletAddress,
  };

  //setLoading(true);
  try {
    const call = await fetchCallReadOnlyFunction(options);
    const result = cvToJSON(call);

    return result.value;
  } catch (err: any) {
    console.log("error: ", options, err);
    throw new Error(err);
  }
};

export default readOnlyHelper;