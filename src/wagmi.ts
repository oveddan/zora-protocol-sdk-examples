import {getDefaultWallets} from "@rainbow-me/rainbowkit";
import {configureChains, createConfig} from "wagmi";
import {goerli, mainnet} from "wagmi/chains";
import {publicProvider} from "wagmi/providers/public";

const walletConnectProjectId = "1";

const {chains, publicClient, webSocketPublicClient} = configureChains(
  [mainnet, ...(import.meta.env?.MODE === "development" ? [goerli] : [])],
  [publicProvider()],
);

const {connectors} = getDefaultWallets({
  appName: "My wagmi + RainbowKit App",
  chains,
  projectId: walletConnectProjectId,
});

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export {chains};
