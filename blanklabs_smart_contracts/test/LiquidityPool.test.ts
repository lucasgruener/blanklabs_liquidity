import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { LiquidityPool, BLTM, IERC20 } from "../typechain-types"; // Adjust the path as necessary

describe("LiquidityPool", function () {
    let liquidityPool: LiquidityPool;
    let bltm: BLTM;
    let usdcToken: IERC20;
    let owner: Signer;
    let user: Signer;

    const exchangeRate = 100;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
    
        // Deploy BLTM contract
        const BLTMFactory = await ethers.getContractFactory("BLTM");
        bltm = (await BLTMFactory.deploy()) as BLTM;
        await bltm.waitForDeployment();
    
        // Grant DEFAULT_ADMIN_ROLE to deployer for role assignment
        await bltm.grantRole(await bltm.DEFAULT_ADMIN_ROLE(), await owner.getAddress());
    
        // Deploy mock USDC token contract
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        usdcToken = (await MockERC20Factory.deploy("USD Coin", "USDC", await owner.getAddress(), ethers.parseUnits("1000000", 6))) as IERC20;
        await usdcToken.waitForDeployment();

        // Transfer some USDC to the user account for testing
        await usdcToken.transfer(await user.getAddress(), ethers.parseUnits("10000", 6));

        // Transfer some USDC to the owner account for testing
        await usdcToken.transfer(await owner.getAddress(), ethers.parseUnits("10000", 6));
    
        // Deploy LiquidityPool contract
        const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");
        liquidityPool = (await LiquidityPoolFactory.deploy(usdcToken.getAddress(), bltm.getAddress(), exchangeRate)) as LiquidityPool;
        await liquidityPool.waitForDeployment();
    
        // Assign MINTER_ROLE to LiquidityPool contract for BLTM
        await bltm.grantRole(await bltm.MINTER_ROLE(), liquidityPool.getAddress());
    });

    it("should deposit USDC and mint BLTM tokens", async function () {
        await usdcToken.connect(user).approve(liquidityPool.getAddress(), ethers.parseUnits("100", 6));
        await liquidityPool.connect(user).depositUSDC(ethers.parseUnits("100", 6));

        const balance = await bltm.balanceOf(await user.getAddress());
        expect(balance).to.equal(ethers.parseUnits("10000", 6)); // 100 USDC * 100 exchange rate
    });

    it("should withdraw USDC when burning BLTM tokens", async function () {
        // Minting BLTM tokens to the user
        await bltm.connect(owner).mint(user.getAddress(), ethers.parseUnits("1000", 6)); 
    
        const bltmBalance = await bltm.balanceOf(await user.getAddress());
        expect(bltmBalance).to.be.gt(0);
    
        // Approve the LiquidityPool contract to spend BLTM tokens
        await bltm.connect(user).approve(liquidityPool.getAddress(), ethers.parseUnits("50", 6));
       
    
        // Transfer USDC to LiquidityPool contract to ensure it has enough balance
        await usdcToken.connect(owner).transfer(liquidityPool.getAddress(), ethers.parseUnits("100", 6));
        const liquidityPoolBalance = await usdcToken.balanceOf(liquidityPool.getAddress());
       
        // Check user's USDC balance before withdrawal
        const userBalanceBefore = await usdcToken.balanceOf(await user.getAddress());
    
        // Now burn BLTM tokens and withdraw USDC
        await liquidityPool.connect(user).withdrawERC20(ethers.parseUnits("50", 6)); 
    
        // Check the USDC balance of the user after withdrawal
        const userBalanceAfter = await usdcToken.balanceOf(await user.getAddress());
        
        // Assert that the user has received USDC
        expect(userBalanceAfter).to.be.gt(userBalanceBefore); // Ensure user has received USDC
    });

    it("should update exchange rate by owner", async function () {
        await liquidityPool.connect(owner).updateExchangeRate(200);
        expect(await liquidityPool.exchangeRate()).to.equal(200);
    });

    it("should not allow non-owner to update exchange rate", async function () {
        const nonOwnerAddress = await user.getAddress();
        const adminRole = await liquidityPool.DEFAULT_ADMIN_ROLE();
    
        await expect(
            liquidityPool.connect(user).updateExchangeRate(200)
        ).to.be.revertedWithCustomError(liquidityPool, "AccessControlUnauthorizedAccount")
    });
    
    it("should allow owner to withdraw USDC", async function () {
        // Ensure the user approves the deposit amount to the liquidity pool contract
        await usdcToken.connect(user).approve(liquidityPool.getAddress(), ethers.parseUnits("100", 6));
        await liquidityPool.connect(user).depositUSDC(ethers.parseUnits("100", 6));
    
        // Check token balance change for owner after withdrawal
        await expect(() => liquidityPool.connect(owner).withdrawUSDC(ethers.parseUnits("50", 6)))
            .to.changeTokenBalance(usdcToken, owner, ethers.parseUnits("50", 6));
    });
    
    it("should not allow non-owner to withdraw USDC", async function () {
        const nonOwnerAddress = await user.getAddress();
        const adminRole = await liquidityPool.DEFAULT_ADMIN_ROLE();
    
        await expect(
            liquidityPool.connect(user).withdrawUSDC(ethers.parseUnits("50", 6))
        ).to.be.revertedWithCustomError(liquidityPool, "AccessControlUnauthorizedAccount")
    });
});