import {createMintClient} from "@zoralabs/protocol-sdk";
import {useEffect, useMemo, useState} from "react";
import {BaseError, SimulateContractParameters, stringify} from "viem";
import {Address, useAccount, useContractWrite, useNetwork, usePrepareContractWrite, usePublicClient, useWaitForTransaction} from "wagmi";

// custom hook that gets the mintClient for the current chain
const useMintClient = () => {
  const publicClient = usePublicClient();

  const {chain} = useNetwork();

  const mintClient = useMemo(() => chain && createMintClient({chain, publicClient}), [chain, publicClient]);

  return mintClient;
};

export const Mint = ({tokenId, tokenContract}: {tokenId: string; tokenContract: Address}) => {
  // call custom hook to get the mintClient
  const mintClient = useMintClient();

  // value will be set by the form
  const [quantityToMint, setQuantityToMint] = useState<number>(1);

  // params for the prepare contract write hook
  const [params, setParams] = useState<SimulateContractParameters>();

  const {address} = useAccount();

  useEffect(() => {
    if (!mintClient || !address) return;

    const makeParams = async () => {
      // make the params for the prepare contract write hook
      const params = await mintClient.makePrepareMintTokenParams({
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
  }, [mintClient, address, quantityToMint]);

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
