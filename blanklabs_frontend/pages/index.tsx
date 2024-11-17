import React from 'react'; 
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { decodeEventLog, formatUnits, getAddress } from 'viem';
import WalletConnect from '../components/WalletConnect';
import DepositWithdraw from '../components/DepositWithdraw';
import TransactionTable from '../components/TransactionTable';

interface Transaction {
  date: string;
  action: string;
  amount: string;
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [provider, setProvider] = useState<any>(null);

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const liquidityPoolAddress = process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS!;
  const bltmAddress = process.env.NEXT_PUBLIC_BLTM_ADDRESS!;
  const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS!;

  const contractAbi = [
    {
      type: 'event',
      name: 'Deposit',
      inputs: [
        { indexed: true, name: 'user', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
        { indexed: false, name: 'timestamp', type: 'uint256' },
      ],
    },
    {
      type: 'event',
      name: 'Withdraw',
      inputs: [
        { indexed: true, name: 'user', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
        { indexed: false, name: 'timestamp', type: 'uint256' },
      ],
    },
  ] as const;

  // Fetch transactions from the blockchain
  const fetchTransactions = async () => {
    if (!publicClient) return;
    setLoading(true);

    try {
      const logs = await publicClient.getLogs({
        address: getAddress(liquidityPoolAddress),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      const fetchedTransactions: Transaction[] = logs
        .map((log) => {
          try {
            const { eventName, args } = decodeEventLog({
              abi: contractAbi,
              data: log.data,
              topics: log.topics,
            });

            if (eventName === 'Deposit' || eventName === 'Withdraw') {
              return {
                date: new Date(Number(args.timestamp) * 1000).toLocaleDateString(),
                action: eventName,
                amount: `${formatUnits(BigInt(args.amount), 6)} BLTM`,
              };
            }
            return null;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as Transaction[];

      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }

    setLoading(false);
  };

  // Fetch transactions when connected
  useEffect(() => {
    if (isConnected) {
      fetchTransactions();
    }
  }, [isConnected]);

  // Callback to re-fetch transactions after a deposit/withdraw action
  const handleTransactionUpdate = async () => {
    await fetchTransactions();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <nav className="flex justify-end px-8 py-4">
        <WalletConnect setProvider={setProvider} />
      </nav>

      <div className="container mx-auto max-w-3xl p-8 space-y-12">
        {/* Liquidity Management */}
        <div>
          <h1 className="text-3xl font-bold text-center text-blue-400 mb-8">Blank Labs Liquidity Pool</h1>
          <DepositWithdraw
            liquidityPoolAddress={liquidityPoolAddress}
            bltmAddress={bltmAddress}
            usdcTokenAddress={usdcTokenAddress}
            onTransactionComplete={handleTransactionUpdate} // Re-fetch transactions after deposit/withdraw
          />
        </div>

        {/* Transaction Table Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-300 mb-4">Transaction History</h2>
          {loading ? (
            <div className="flex justify-center items-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
            </div>
          ) : (
            <TransactionTable transactions={transactions} />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-8">
          <p>&copy; {new Date().getFullYear()} Decentralized Liquidity Pool. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}