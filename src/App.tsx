import { useState } from "react";
import {
  useCurrentAccount,
  useSuiClient,
  ConnectButton,
  WalletProvider,
  SuiClientProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getRoute, swap } from "navi-aggregator-sdk";
import { getFullnodeUrl } from "@mysten/sui/client";
import "./App.css";

// Initialize QueryClient for react-query
const queryClient = new QueryClient();

// Network configuration
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl("mainnet") },
});

const SwapPage = () => {
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  // Fetch quote
  const fetchQuote = async () => {
    if (!fromToken || !toToken || !amount) {
      alert("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const route = await getRoute(fromToken, toToken, BigInt(amount));
      setQuote(route);
    } catch (error) {
      console.error("Error fetching quote:", error);
      alert("Failed to fetch quote. Check your input.");
    } finally {
      setIsLoading(false);
    }
  };

  // Perform Swap
  const performSwap = async () => {
    if (!currentAccount) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!quote) {
      alert("Please fetch a quote before swapping.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await swap(
        currentAccount.address,
        suiClient, // Use SuiClient from the provider
        fromToken,
        toToken,
        BigInt(amount),
        Number(quote.amount_out || 0),
        {
          referer: process.env.VITE_REFERRER || "https://www.navi.ag/",
          byAmountIn: true,
        }
      );
      setTransactionStatus("Transaction Successful!");
      console.log(result);
    } catch (error) {
      console.error("Swap failed:", error);
      setTransactionStatus("Transaction Failed!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="swap-container">
      <h1 className="title">Token Swap</h1>
      <p className="description">
        Swap tokens securely with the Sui Mind platform.
      </p>

      <div className="form-group">
        <label htmlFor="fromToken">From Token</label>
        <input
          type="text"
          id="fromToken"
          value={fromToken}
          onChange={(e) => setFromToken(e.target.value)}
          placeholder="Enter token address"
        />
      </div>
      <div className="form-group">
        <label htmlFor="toToken">To Token</label>
        <input
          type="text"
          id="toToken"
          value={toToken}
          onChange={(e) => setToToken(e.target.value)}
          placeholder="Enter token address"
        />
      </div>
      <div className="form-group">
        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount to swap"
        />
      </div>

      <button className="cta-button" onClick={fetchQuote} disabled={isLoading}>
        {isLoading ? "Loading..." : "Get Quote"}
      </button>

      {quote && (
        <div className="quote-details">
          <h3>Quote Details</h3>
          <p>Amount In: {quote.amount_in}</p>
          <p>Amount Out: {quote.amount_out}</p>
          <p>Routes: {JSON.stringify(quote.routes)}</p>
          <button
            className="cta-button"
            onClick={performSwap}
            disabled={isLoading}
          >
            {isLoading ? "Swapping..." : "Swap Now"}
          </button>
        </div>
      )}

      {transactionStatus && (
        <p className="status-message">{transactionStatus}</p>
      )}

      <div className="wallet-container">
        <ConnectButton connectText="Connect Wallet" />
        {currentAccount && (
          <div className="wallet-info">
            <p>Connected Wallet: {currentAccount.address}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// App Wrapper with Providers
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider>
          <SwapPage />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};

export default App;
