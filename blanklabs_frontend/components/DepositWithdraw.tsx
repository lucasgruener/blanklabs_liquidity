import { useState, useEffect } from 'react';
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  usePublicClient,
} from 'wagmi';
import { parseUnits, formatUnits, Abi } from 'viem';
import Balance from './Balance';
import bltmJson from '../abis/BLTM.json';
import liquidityPoolJson from '../abis/LiquidityPool.json';

const bltmAbi = bltmJson.abi as Abi;
const liquidityPoolAbi = liquidityPoolJson.abi as Abi;

const usdcTokenAbi: Abi = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
];

interface DepositWithdrawProps {
  liquidityPoolAddress: string;
  bltmAddress: string;
  usdcTokenAddress: string;
  onTransactionComplete: () => void;
}

export default function DepositWithdraw({
  liquidityPoolAddress,
  bltmAddress,
  usdcTokenAddress,
  onTransactionComplete,
}: DepositWithdrawProps) {
  const [amount, setAmount] = useState('');
  const [isDeposit, setIsDeposit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0.00');

  const { address } = useAccount();
  const publicClient = usePublicClient();

  const amountInUnits = parseUnits(amount || '0', 6);
  const contractAddress = isDeposit ? usdcTokenAddress : bltmAddress;
  const tokenAbi = isDeposit ? usdcTokenAbi : bltmAbi;

  // Fetch user token balance
  const { data: fetchedBalance } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
    watch: true,
  });

  // Check current allowance
  const { data: currentAllowance } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'allowance',
    args: [address, liquidityPoolAddress],
    enabled: !!address,
  });

  useEffect(() => {
    if (fetchedBalance) {
      setTokenBalance(formatUnits(BigInt(fetchedBalance.toString()), 6));
    } else {
      setTokenBalance('0.00');
    }
  }, [fetchedBalance]);

  // Approve contract
  const { config: approveConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'approve',
    args: [liquidityPoolAddress, amountInUnits],
    overrides: {
      gasLimit: BigInt(5000000),
    },
    enabled: !!amount && !!address && (!currentAllowance || BigInt(currentAllowance.toString()) < amountInUnits),
  });

  const { write: approveWrite, isLoading: isApproving } = useContractWrite({
    ...approveConfig,
    onSuccess: () => {
      setTransactionStatus('Approval complete');
    },
    onError: (error) => {
      console.error('Approval failed:', error);
      setTransactionStatus('Approval failed');
      setLoading(false);
    },
  });

  // Deposit logic
  const { config: depositConfig } = usePrepareContractWrite({
    address: liquidityPoolAddress as `0x${string}`,
    abi: liquidityPoolAbi,
    functionName: 'depositUSDC',
    args: [amountInUnits],
    overrides: {
      gasLimit: BigInt(5000000),
    },
    enabled: isDeposit && !!amount && !!address && (!currentAllowance || BigInt(currentAllowance.toString()) >= amountInUnits),
  });

  const { write: depositWrite } = useContractWrite({
    ...depositConfig,
    onSuccess: () => {
      setTransactionStatus('Deposit successful');
      setLoading(false);
    },
    onError: (error) => {
      console.error('Deposit failed:', error);
      setTransactionStatus('Deposit failed');
      setLoading(false);
    },
  });

  // Withdraw logic
  const { config: withdrawConfig } = usePrepareContractWrite({
    address: liquidityPoolAddress as `0x${string}`,
    abi: liquidityPoolAbi,
    functionName: 'withdrawERC20',
    args: [amountInUnits],
    overrides: {
      gasLimit: BigInt(5000000),
    },
    enabled: !isDeposit && !!amount && !!address,
  });

  const { write: withdrawWrite } = useContractWrite({
    ...withdrawConfig,
    onSuccess: () => {
      setTransactionStatus('Withdrawal successful');
      setLoading(false);
    },
    onError: (error) => {
      console.error('Withdrawal failed:', error);
      setTransactionStatus('Withdrawal failed');
      setLoading(false);
    },
  });

  const handleSubmit = async () => {
    setLoading(true);
    setTransactionStatus('');

    if (isDeposit) {
      if (!currentAllowance || BigInt(currentAllowance.toString()) < amountInUnits) {
        setTransactionStatus('Approving USDC...');
        approveWrite?.();
      }
      setTransactionStatus('Depositing USDC...');
      depositWrite?.();
    } else {
      setTransactionStatus('Approving BLTM...');
      approveWrite?.();
      setTransactionStatus('Withdrawing BLTM...');
      withdrawWrite?.();
    }
    onTransactionComplete();
  };

  return (
    <div className="flex flex-col items-center space-y-6 mt-6 bg-gray-900 p-6 rounded-2xl shadow-xl max-w-lg mx-auto text-gray-100">
      <Balance
        bltmAddress={bltmAddress}
        liquidityPoolAddress={liquidityPoolAddress}
        refreshTrigger={tokenBalance}
      />
      <div className="flex items-center w-full bg-gray-800 rounded-full p-1">
        <button
          onClick={() => setIsDeposit(true)}
          className={`w-1/2 text-center py-2 rounded-full ${
            isDeposit ? 'bg-blue-600 text-white' : 'text-gray-400'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setIsDeposit(false)}
          className={`w-1/2 text-center py-2 rounded-full ${
            !isDeposit ? 'bg-red-600 text-white' : 'text-gray-400'
          }`}
        >
          Withdraw
        </button>
      </div>
      <div className="w-full bg-gray-800 p-4 rounded-lg shadow-lg">
        <label className="flex items-center justify-between text-gray-400">
          <span>{isDeposit ? 'USDC' : 'BLTM'} Amount</span>
          <span className="flex items-center">
            <span className="text-sm">Balance: {tokenBalance}</span>
          </span>
        </label>
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="text"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none"
          />
          <span className="text-white font-semibold">{isDeposit ? 'USDC' : 'BLTM'}</span>
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || isApproving}
        className="px-4 py-2 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50"
      >
        {loading ? 'Processing...' : isDeposit ? 'Deposit USDC' : 'Withdraw BLTM'}
      </button>
      {transactionStatus && (
        <p
          className={`text-center mt-2 ${
            transactionStatus.includes('successful') ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {transactionStatus}
        </p>
      )}
    </div>
  );
}
