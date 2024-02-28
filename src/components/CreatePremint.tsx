import {createPremintClient} from "@zoralabs/protocol-sdk";
import {useEffect, useMemo, useState} from "react";
import {BaseError, SimulateContractParameters, stringify} from "viem";
import {Address, useAccount, useContractRead, useContractWrite, useNetwork, usePrepareContractWrite, usePublicClient, useWaitForTransaction} from "wagmi";

import {zoraCreator1155FactoryImplConfig} from "@zoralabs/protocol-deployments";

// custom hook that gets the mintClient for the current chain
const usePremintClient = () => {
  const publicClient = usePublicClient();

  const {chain} = useNetwork();

  const premintClient = useMemo(() => chain && createPremintClient({chain, publicClient}), [chain, publicClient]);

  return premintClient;
};

export const Mint = ({tokenId, tokenContract}: {tokenId: string; tokenContract: Address}) => {
  // call custom hook to get the mintClient
  const premintClient = usePremintClient();

  // value will be set by the form
  const [quantityToMint, setQuantityToMint] = useState<number>(1);

  // params for the prepare contract write hook
  const [params, setParams] = useState<SimulateContractParameters>();

  const {address} = useAccount();

  const {chain} = useNetwork();

  const contractName = useContractRead({
    abi: zoraCreator1155FactoryImplConfig.abi,
    address: zoraCreator1155FactoryImplConfig.address[chain!.id as keyof typeof zoraCreator1155FactoryImplConfig.address],
    functionName: "contractVersion",
  });

  useEffect(() => {
    if (!premintClient || !address) return;

    const makeParams = async () => {
      // make the params for the prepare contract write hook
      const params = await premintClient({
        tokenAddress: tokenContract,
        tokenId,
        minterAccount: address,
        mintArguments: {
          mintToAddress: address,
          quantityToMint,
        },
      });
      setParams(params);
    };

    makeParams();
  }, [premintClient, address, quantityToMint]);

  const {config} = usePrepareContractWrite(params);

  const {write, data, error, isLoading, isError} = useContractWrite(config);
  const {data: receipt, isLoading: isPending, isSuccess} = useWaitForTransaction({hash: data?.hash});

  return (
    <>
      <h3>Mint a token</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          write?.();
        }}
      >
        {/* input for quantity to mint: */}
        <input placeholder="quantity to mint" onChange={(e) => setQuantityToMint(Number(e.target.value))} />
        <button disabled={!write} type="submit">
          Mint
        </button>
      </form>

      {isLoading && <div>Check wallet...</div>}
      {isPending && <div>Transaction pending...</div>}
      {isSuccess && (
        <>
          <div>Transaction Hash: {data?.hash}</div>
          <div>
            Transaction Receipt: <pre>{stringify(receipt, null, 2)}</pre>
          </div>
        </>
      )}
      {isError && <div>{(error as BaseError)?.shortMessage}</div>}
    </>
  );
};
