import {createMintClient} from "@zoralabs/protocol-sdk";
import type {Address, PublicClient, WalletClient} from "viem";

async function mintNFT({
  walletClient,
  publicClient,
  tokenContract,
  tokenId,
  mintToAddress,
  quantityToMint,
  mintReferral,
}: {
  // wallet client that will submit the transaction
  walletClient: WalletClient;
  // public client that will simulate the transaction
  publicClient: PublicClient;
  // address of the token contract
  tokenContract: Address;
  // id of the token to mint
  tokenId: bigint;
  // address that will receive the minted token
  mintToAddress: Address;
  // quantity of tokens to mint
  quantityToMint: number;
  // optional address that will receive a mint referral reward
  mintReferral?: Address;
}) {
  const mintClient = createMintClient({chain: walletClient.chain!});

  // get mintable information about the token.
  const mintable = await mintClient.getMintable({
    tokenContract,
    tokenId,
  });

  // prepare the mint transaction, which can be simulated via an rpc with the public client.
  const prepared = await mintClient.makePrepareMintTokenParams({
    // token to mint
    mintable,
    mintArguments: {
      // address that will receive the token
      mintToAddress,
      // quantity of tokens to mint
      quantityToMint,
      // comment to include with the mint
      mintComment: "My comment",
      // optional address that will receive a mint referral reward
      mintReferral,
    },
    // account that is to invoke the mint transaction
    minterAccount: walletClient.account!.address,
  });

  // simulate the transaction and get any validation errors
  const {request} = await publicClient.simulateContract(prepared);

  // submit the transaction to the network
  const txHash = await walletClient.writeContract(request);

  // wait for the transaction to be complete
  await publicClient.waitForTransactionReceipt({hash: txHash});
}
