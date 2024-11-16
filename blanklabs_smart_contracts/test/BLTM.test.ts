import { expect } from "chai";
import { ethers } from "hardhat";
import { BLTM } from "../typechain-types"; 

describe("BLTM Contract", function () {
    let bltm: BLTM;
    let owner: any, pauser: any, minter: any, otherAccount: any;

    beforeEach(async function () {
        const BLTMFactory = await ethers.getContractFactory("BLTM");
        [owner, pauser, minter, otherAccount] = await ethers.getSigners();

        // Deploy the contract
        bltm = (await BLTMFactory.deploy()) as BLTM;
        await bltm.waitForDeployment();
    });

    it("Should initialize with the correct name, symbol, and decimals", async function () {
        expect(await bltm.name()).to.equal("BLTM");
        expect(await bltm.symbol()).to.equal("BLTM");
        expect(await bltm.decimals()).to.equal(6);
    });

    it("Should grant deployer the default admin, minter, and pauser roles", async function () {
        const DEFAULT_ADMIN_ROLE = await bltm.DEFAULT_ADMIN_ROLE();
        const PAUSER_ROLE = await bltm.PAUSER_ROLE();
        const MINTER_ROLE = await bltm.MINTER_ROLE();

        expect(await bltm.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
        expect(await bltm.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
        expect(await bltm.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });

    it("Should allow only minter to mint tokens", async function () {
        await bltm.connect(owner).grantRole(await bltm.MINTER_ROLE(), minter.address);

        // Mint tokens as minter
        await bltm.connect(minter).mint(otherAccount.address, 500);
        expect(await bltm.balanceOf(otherAccount.address)).to.equal(500);

        // Attempt minting by an account without the minter role
        await expect(bltm.connect(otherAccount).mint(otherAccount.address, 500))
            .to.be.revertedWithCustomError(bltm, "AccessControlUnauthorizedAccount")
            .withArgs(otherAccount.address, await bltm.MINTER_ROLE());
    });

    it("Should allow only pauser to pause and unpause", async function () {
        await bltm.connect(owner).grantRole(await bltm.PAUSER_ROLE(), pauser.address);

        // Pause the contract
        await bltm.connect(pauser).pause();
        expect(await bltm.paused()).to.be.true;

        // Unpause the contract
        await bltm.connect(pauser).unpause();
        expect(await bltm.paused()).to.be.false;

        // Attempt to pause by an account without the pauser role
        await expect(bltm.connect(otherAccount).pause())
            .to.be.revertedWithCustomError(bltm, "AccessControlUnauthorizedAccount")
            .withArgs(otherAccount.address, await bltm.PAUSER_ROLE());
    });

    it("Should prevent token transfers when paused", async function () {
        // Mint tokens to owner and pause contract
        await bltm.mint(owner.address, 1000);
        await bltm.pause();
    
        // Attempt transfer when paused and expect EnforcedPause error
        await expect(bltm.transfer(otherAccount.address, 100)).to.be.revertedWithCustomError(
            bltm,
            "EnforcedPause"
        );
    
        // Unpause and transfer
        await bltm.unpause();
        await bltm.transfer(otherAccount.address, 100);
        expect(await bltm.balanceOf(otherAccount.address)).to.equal(100);
    });
    
    it("Should burn tokens from the correct account", async function () {
        // Mint tokens to owner
        await bltm.mint(owner.address, 1000);
        
        // Attempt to burn from otherAccount, expecting InsufficientBalance error
        await expect(bltm.connect(otherAccount).burn(500)).to.be.revertedWithCustomError(
            bltm,
            "ERC20InsufficientBalance"
        );
    
        // Burn a valid amount from the owner
        await bltm.burn(200);
        expect(await bltm.balanceOf(owner.address)).to.equal(800);
    });

    it("Should prevent unauthorized roles from minting or pausing", async function () {
        // Test minting without minter role
        await expect(bltm.connect(otherAccount).mint(owner.address, 1000))
            .to.be.revertedWithCustomError(bltm, "AccessControlUnauthorizedAccount")
            .withArgs(otherAccount.address, await bltm.MINTER_ROLE());

        // Test pausing without pauser role
        await expect(bltm.connect(otherAccount).pause())
            .to.be.revertedWithCustomError(bltm, "AccessControlUnauthorizedAccount")
            .withArgs(otherAccount.address, await bltm.PAUSER_ROLE());
    });
});