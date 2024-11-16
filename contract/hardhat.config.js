require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("Please set your PRIVATE_KEY in a .env file");
  process.exit(1);
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    nibiru: {
      url: "https://evm-rpc.testnet-1.nibiru.fi",
      chainId: 7210,
      accounts: [`0x${PRIVATE_KEY}`],
      timeout: 120000,
      gasPrice: "auto",
      gas: "auto",
      gasMultiplier: 1.2, // Add some buffer to gas estimation
      allowUnlimitedContractSize: true,
    }
  },
  etherscan: {
    apiKey: {
      nibiru: "no-api-key-needed"
    }
  },
  mocha: {
    timeout: 120000
  }
};