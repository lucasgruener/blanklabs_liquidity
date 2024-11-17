import { useEffect, useState } from 'react';
import { useAccount, useContractRead, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import bltmJson from '../abis/BLTM.json';
import liquidityPoolJson from '../abis/LiquidityPool.json';

const bltmAbi = bltmJson.abi;
const liquidityPoolAbi = liquidityPoolJson.abi;

interface BalanceProps {
  bltmAddress: string;
  liquidityPoolAddress: string;
  refreshTrigger: string | number; // Trigger for refreshing balance
}

export default function Balance({ bltmAddress, liquidityPoolAddress, refreshTrigger }: BalanceProps) {
  const { address } = useAccount(); // Get connected wallet address
  const publicClient = usePublicClient(); // Use public RPC client for blockchain data

  const [balance, setBalance] = useState<string>('0');
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  // Read balance of BLTM token
  const { data: balanceRaw } = useContractRead({
    address: address ? (bltmAddress as `0x${string}`) : undefined,
    abi: bltmAbi,
    functionName: address ? 'balanceOf' : undefined,
    args: address ? [address] : undefined,
  }) as { data: bigint | undefined }; // Explicitly type the result as bigint.

  // Read decimals of BLTM token
  const { data: decimals } = useContractRead({
    address: address ? (bltmAddress as `0x${string}`) : undefined,
    abi: bltmAbi,
    functionName: address ? 'decimals' : undefined,
  }) as { data: number | undefined }; // Explicitly type the result as number.

  // Read exchange rate from LiquidityPool contract
  const { data: rate } = useContractRead({
    address: address ? (liquidityPoolAddress as `0x${string}`) : undefined,
    abi: liquidityPoolAbi,
    functionName: address ? 'exchangeRate' : undefined,
  }) as { data: bigint | undefined }; // Explicitly type the result as bigint.

  useEffect(() => {
    if (balanceRaw && decimals !== undefined) {
      setBalance(formatUnits(balanceRaw, decimals));
    }
  }, [balanceRaw, decimals]);

  useEffect(() => {
    if (rate) {
      setExchangeRate(Number(rate)); // Convert bigint to number if necessary
    }
  }, [rate]);

  return (
    <div className="text-center text-xl font-bold text-gray-200 mt-6">
      <p>
        Balance: <span className="text-blue-400">{balance} BLTM</span>
      </p>
      <p>
        Exchange Rate: <span className="text-blue-400">1 USTD = {exchangeRate} BLTM</span>
      </p>
    </div>
  );
}