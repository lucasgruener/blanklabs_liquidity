# Blank Labs Liquidity Pool

[Lucas Gruener Lima] Basic dApp for liquidity provider

# Tech Stack

- Solidity
- Hardhat
- Typechain
- TypeScript
- React.js
- Next.js
- Wagmi
- Viem
- Jest


# BLTM Token and Liquditiy Pool

- Make sure you have node.js installed

> cd blanklabs_smart_contracts

- Copy and rename .env.example to .env

- Add a personal Polygon Amoy address private key .env (Make sure the wallet holds some Polygon Amoy)

> npm install

> npm run compile

> npm run deploy

- The console will contain logs with the created contracts addresses


# blanklabs-frontend

- Make sure you have node.js installed

> cd blanklabs-frontend

- Rename .env.example to .env

- Add logged addresses from BLTM and LiquidityPool contracts to .env

> npm install

> npm run dev


# Tests

- For blanklabs_smart_contracts

> npm run test

- For blanklabs-frontend

> npm test


# Challenges

Due to time constraints not all of the features were implemented correctly

List of know issues:

- Transaction history table not displaying any records
- Ineficient gas limit management can cause some transactions to fail



