"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
require("@typechain/hardhat");
const config = {
    solidity: {
        version: "0.8.22",
        settings: {
            optimizer: {
                enabled: true,
            },
        },
    },
    typechain: {
        outDir: "typechain-types", 
        target: "ethers-v6", 
    },
};
exports.default = config;
