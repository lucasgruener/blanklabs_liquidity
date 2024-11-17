import { BigNumber } from 'ethers';

export interface LiquidityPoolContract extends ethers.Contract {
  depositUSDC(amount: BigNumber, options?: { gasLimit?: BigNumber }): Promise<ethers.ContractTransaction>;
  withdrawERC20(amount: BigNumber, options?: { gasLimit?: BigNumber }): Promise<ethers.ContractTransaction>;
}

export interface BLTMContract extends ethers.Contract {
  approve(spender: string, amount: BigNumber, options?: { gasLimit?: BigNumber }): Promise<ethers.ContractTransaction>;
}