const hre = require("hardhat");

async function main() {
  try {
    console.log("Starting deployment of FortuneBlock on Nibiru Testnet...");

    // Get the deployer's signer
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance));

    // Deploy FortuneBlock with explicit gas settings
    const FortuneBlock = await hre.ethers.getContractFactory("FortuneBlock");
    console.log("Deploying FortuneBlock...");
    
    const fortuneBlock = await FortuneBlock.deploy({
      gasLimit: 3000000, // Set a safe gas limit
    });

    console.log("Deployment transaction submitted...");
    
    await fortuneBlock.waitForDeployment();
    const contractAddress = await fortuneBlock.getAddress();

    console.log("FortuneBlock deployed to:", contractAddress);
    
    // Wait for more block confirmations
    console.log("Waiting for block confirmations...");
    await fortuneBlock.deploymentTransaction().wait(5);
    console.log("Deployment confirmed!");

    // Create initial lottery for testing
    try {
        console.log("Creating initial test lottery...");
        const DAILY_DURATION = 24 * 60 * 60; // 1 day in seconds
        const tx = await fortuneBlock.createLottery(DAILY_DURATION, {
          gasLimit: 200000, // Set gas limit for lottery creation
        });
        await tx.wait(2);
        console.log("Initial lottery created successfully!");
    } catch (error) {
        console.log("Failed to create initial lottery:", error.message);
    }

    // Log deployment information
    console.log("\nDeployment Summary:");
    console.log("-------------------");
    console.log("Network: Nibiru Testnet");
    console.log("Contract Address:", contractAddress);
    console.log("Deployer Address:", deployer.address);
    console.log("\nVerification command:");
    console.log(`npx hardhat verify --network nibiru ${contractAddress}`);

  } catch (error) {
    console.error("\nDeployment failed:", error);
    if (error.error) {
      console.error("\nError details:", error.error);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });