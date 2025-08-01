import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { WagmiConfig, createConfig, http } from "wagmi";
import { sepolia, arbitrumSepolia } from "wagmi/chains";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

const chains = [arbitrumSepolia];

const { connectors } = getDefaultWallets({
  appName: "Tender dApp",
  projectId: "tender-app",
  chains,
});

const config = createConfig({
  connectors,
  chains,
  transports: {
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider chains={chains}>
          <App />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
); 