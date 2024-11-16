const { ethers } = require("hardhat");

async function main() {
 

  // Deploy BLTM contract
  const BLTM = await ethers.getContractFactory("BLTM");
  const bltm = await BLTM.deploy();
  await bltm.waitForDeployment();
  const bltmAddress = await bltm.getAddress();
  console.log("BLTM deployed to:", bltmAddress);

  // Deploy LiquidityPool contract
  const USDC_ADDRESS = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582";
  const EXCHANGE_RATE = 2;
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(USDC_ADDRESS, bltmAddress, EXCHANGE_RATE);
  await liquidityPool.waitForDeployment();
  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("LiquidityPool deployed to:", liquidityPoolAddress);

  // Grant the minter role to the LiquidityPool contract
  const tx = await bltm.grantRole(await bltm.MINTER_ROLE(), liquidityPoolAddress);
  await tx.wait();
  console.log("Minter role granted to LiquidityPool");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });