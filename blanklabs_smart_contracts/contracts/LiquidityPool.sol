// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./BLTM.sol"; 

contract LiquidityPool is AccessControl {
    IERC20 public usdcToken;
    BLTM public bltm;
    uint256 public exchangeRate;

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

    constructor(address _usdcToken, address _bltm, uint256 _exchangeRate) {
        usdcToken = IERC20(_usdcToken);
        bltm = BLTM(_bltm);
        exchangeRate = _exchangeRate;

        _grantRole(OWNER_ROLE, msg.sender);
    
    }

    function updateExchangeRate(uint256 newRate) public onlyRole(OWNER_ROLE) {
        exchangeRate = newRate;
    }

    function depositUSDC(uint256 amount) public {
        usdcToken.transferFrom(msg.sender, address(this), amount);
        uint256 tokensToMint = amount * exchangeRate;
        bltm.mint(msg.sender, tokensToMint);
    }

    function withdrawERC20(uint256 amount) public {
        bltm.burnFrom(msg.sender, amount);
        uint256 usdcToTransfer = amount / exchangeRate;
        usdcToken.transfer(msg.sender, usdcToTransfer);
    }

    function withdrawUSDC(uint256 amount) public onlyRole(OWNER_ROLE) {
        usdcToken.transfer(msg.sender, amount);
    }
}