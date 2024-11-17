import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import bltmJson from '../abis/BLTM.json';
import liquidityPoolJson from '../abis/LiquidityPool.json';
import Balance from './Balance';

const bltmAbi = bltmJson.abi;
const liquidityPoolAbi = liquidityPoolJson.abi;
const usdcTokenAbi = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint256)",
  "function allowance(address owner, address spender) public view returns (uint256)"
];

interface DepositWithdrawProps {
  provider: ethers.BrowserProvider | null;
  liquidityPoolAddress: string;
  bltmAddress: string;
  usdcTokenAddress: string;
  onTransactionComplete: () => void;
}

export default function DepositWithdraw({
  provider,
  liquidityPoolAddress,
  bltmAddress,
  usdcTokenAddress,
  onTransactionComplete,
}: DepositWithdrawProps) {
  const [amount, setAmount] = useState<string>(''); // Store input amount
  const [isDeposit, setIsDeposit] = useState<boolean>(true); // Toggle between Deposit and Withdraw
  const [loading, setLoading] = useState<boolean>(false); // Show loading indicator
  const [transactionStatus, setTransactionStatus] = useState<string>(''); // Track transaction status
  const [refreshBalanceTrigger, setRefreshBalanceTrigger] = useState<number>(0); // Trigger to refresh balance
  const [tokenBalance, setTokenBalance] = useState<string>('0.00'); // Store user's token balance

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleToggleMode = () => {
    setIsDeposit(!isDeposit);
    setTransactionStatus('');
  };

  // Fetch balance whenever `isDeposit` or `provider` changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!provider) return;

      const signer = await provider.getSigner();
      const contractAddress = isDeposit ? usdcTokenAddress : bltmAddress;
      const tokenAbi = isDeposit ? usdcTokenAbi : bltmAbi;
      const tokenContract = new ethers.Contract(contractAddress, tokenAbi, signer);

      try {
        const balance = await tokenContract.balanceOf(await signer.getAddress());
        setTokenBalance(ethers.formatUnits(balance, 6)); // Adjust decimals as necessary
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setTokenBalance('0.00');
      }
    };

    fetchBalance();
  }, [isDeposit, provider, refreshBalanceTrigger]);

  const updateStatusAndBalance = (status: string) => {
    setTransactionStatus(status);
    setLoading(false);
    setRefreshBalanceTrigger((prev) => prev + 1); // Trigger balance refresh
  };

  const deposit = async () => {
    if (!provider) return;
    const signer = await provider.getSigner();
    const usdcToken = new ethers.Contract(usdcTokenAddress, usdcTokenAbi, signer);
    const usdcAmount = ethers.parseUnits(amount, 6);

    try {
      setLoading(true);
      setTransactionStatus('Approving USDC for deposit...');
      const approveTx = await usdcToken.approve(liquidityPoolAddress, usdcAmount);
      await approveTx.wait();

      setTransactionStatus('Depositing USDC...');
      const liquidityPool = new ethers.Contract(liquidityPoolAddress, liquidityPoolAbi, signer);
      const depositTx = await liquidityPool.depositUSDC(usdcAmount);
      await depositTx.wait();
      updateStatusAndBalance("Deposit successful");
    } catch (error) {
      console.error("Deposit failed:", error);
      updateStatusAndBalance("Deposit failed");
    }
    onTransactionComplete();
  };

  const withdraw = async () => {
    if (!provider) return;

    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const liquidityPool = new ethers.Contract(liquidityPoolAddress, liquidityPoolAbi, signer);
    const bltm = new ethers.Contract(bltmAddress, bltmAbi, signer);

    const fslAmount = ethers.parseUnits(amount, 6);

    try {
      const userBalance = await bltm.balanceOf(userAddress);
      if (userBalance.lt(fslAmount)) {
        updateStatusAndBalance("Insufficient FSL balance for withdrawal");
        return;
      }

      const currentAllowance = await bltm.allowance(userAddress, liquidityPoolAddress);
      if (currentAllowance.lt(fslAmount)) {
        setLoading(true);
        setTransactionStatus('Approving FSL for withdrawal...');
        const approveTx = await bltm.approve(liquidityPoolAddress, fslAmount);
        await approveTx.wait();
      }

      setTransactionStatus("Withdrawing USDC...");
      const tx = await liquidityPool.withdrawERC20(fslAmount);
      await tx.wait();
      updateStatusAndBalance("Withdrawal successful");
    } catch (error) {
      console.error("Withdrawal failed:", error);
      updateStatusAndBalance("Withdrawal failed");
    }
    onTransactionComplete();
  };

  const handleSubmit = () => {
    setTransactionStatus('');
    if (isDeposit) {
      deposit();
    } else {
      withdraw();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 mt-6 bg-gray-900 p-6 rounded-2xl shadow-xl max-w-lg mx-auto text-gray-100">
      <Balance
        bltmAddress={bltmAddress}
        liquidityPoolAddress={liquidityPoolAddress}
        refreshTrigger={refreshBalanceTrigger}
      />

      {/* Tab Toggle */}
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

      {/* Input Section */}
      <div className="w-full bg-gray-800 p-4 rounded-lg shadow-lg">
        <label className="flex items-center justify-between text-gray-400">
          <span>{isDeposit ? "USDC" : "BLTM"} Amount</span>
          <span className="flex items-center">
            <span className="text-sm">Balance: {tokenBalance}</span>
          </span>
        </label>
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="text"
            placeholder="0.0"
            value={amount}
            onChange={handleAmountChange}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none"
          />
          <span className="text-white font-semibold">{isDeposit ? "USDC" : "BLTM"}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="px-4 py-2 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Processing...' : isDeposit ? 'Deposit USDC' : 'Withdraw BLTM'}
      </button>

      {/* Transaction Status */}
      {transactionStatus && (
        <p className={`text-center mt-2 ${transactionStatus.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
          {transactionStatus}
        </p>
      )}
    </div>
  );
}