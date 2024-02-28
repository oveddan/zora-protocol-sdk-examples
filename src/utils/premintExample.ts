import {PremintConfigVersion, createPremintClient} from "@zoralabs/protocol-sdk";
import {encodeFunctionData, type Address, type PublicClient, type WalletClient, Hex} from "viem";

async function createForFree({
  walletClient,
  publicClient,
  creatorAccount,
}: {
  // wallet client that will submit the transaction
  walletClient: WalletClient;
  // public client that will simulate the transaction
  publicClient: PublicClient;
  // address of the token contract
  creatorAccount: Address;
}) {
  const premintClient = createPremintClient({chain: walletClient.chain!, publicClient});

  // create and sign a free token creation.
  const createdPremint = await premintClient.createPremint({
    walletClient,
    creatorAccount,
    // if true, will validate that the creator is authorized to create premints on the contract.
    checkSignature: true,
    // collection info of collection to create
    collection: {
      contractAdmin: creatorAccount,
      contractName: "Testing Contract",
      contractURI: "ipfs://bafkreiainxen4b4wz4ubylvbhons6rembxdet4a262nf2lziclqvv7au3e",
    },
    // token info of token to create
    tokenCreationConfig: {
      tokenURI: "ipfs://bafkreice23maski3x52tsfqgxstx3kbiifnt5jotg3a5ynvve53c4soi2u",
    },
  });

  const premintUid = createdPremint.uid;
  const premintCollectionAddress = createdPremint.collectionAddress;

  return {
    // unique id of created premint, which can be used later to
    // update or delete the premint
    uid: premintUid,
    tokenContractAddress: premintCollectionAddress,
  };
}

async function updateCreatedForFreeToken(walletClient: WalletClient, premintUid: number) {
  const premintClient = createPremintClient({chain: walletClient.chain!});

  // sign a message to update the created for free token, and store the update
  await premintClient.updatePremint({
    collection: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    uid: premintUid,
    // WalletClient doing the signature
    walletClient,
    // Token information, falls back to defaults set in DefaultMintArguments.
    tokenConfigUpdates: {
      tokenURI: "ipfs://bafkreice23maski3x52tsfqgxstx3kbiifnt5jotg3a5ynvve53c4soi2u",
    },
  });
}

async function deleteCreatedForFreeToken(walletClient: WalletClient) {
  const premintClient = createPremintClient({chain: walletClient.chain!});

  // sign a message to delete the premint, and store the deletion
  await premintClient.deletePremint({
    // Extra step to check the signature on-chain before attempting to sign
    collection: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    uid: 23,
    // WalletClient doing the signature
    walletClient,
  });
}

async function mintCreatedForFreeToken(walletClient: WalletClient, publicClient: PublicClient, minterAccount: Address) {
  const premintClient = createPremintClient({chain: walletClient.chain!});

  const simulateContractParameters = await premintClient.makeMintParameters({
    account: minterAccount,
    tokenContract: "0xf8dA7f53c283d898818af7FB9d98103F559bDac2",
    uid: 3,
    mintArguments: {
      quantityToMint: 1,
      mintComment: "",
    },
  });

  // simulate the transaction and get any validation errors
  const {request} = await publicClient.simulateContract(simulateContractParameters);

  // submit the transaction to the network
  const txHash = await walletClient.writeContract(request);

  // wait for the transaction to be complete
  const receipt = await publicClient.waitForTransactionReceipt({hash: txHash});

  const {urls} = await premintClient.getDataFromPremintReceipt(receipt);

  // block explorer url:
  console.log(urls.explorer);
  // collect url:
  console.log(urls.zoraCollect);
  // manage url:
  console.log(urls.zoraManage);
}

type TokenActionCreationParameters = {
  tokenId: number;
  contractAddress: Address;
  contractVersion: string;
};

// function adminMint({
//   data,
//   amount,
//   recipient,
// }: {
//   recipient: Address;
//   amount: bigint;
//   data?: Hex;
// }) {
//   return ({ tokenId}: TokenActionCreationParameters) => {
//     encodeFunctionData({
//       abi: zoraCreator1155ImplABI,
//       functionName: "adminMint",
//       args: [
//         recipient,
//         tokenId,
//         amount,
//         data || "0x",
//       ],
//     }),
//   }
// }
