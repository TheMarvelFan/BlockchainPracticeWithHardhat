const { deployments, ethers } = require("hardhat");

async function main() {
    const accounts = await ethers.getSigners(); // returns list of accounts for current network specified in hardhat config
    const deployer = accounts[0];

    await deployments.fixture(["all"]);

    const FundMeDeployment = await deployments.get("FundMe");
    const fundMe = await ethers.getContractAt(
        "FundMe",
        FundMeDeployment.address,
        deployer
    );

    console.log("Withdrawing from contract...");

    const transactionResponse = await fundMe.withdraw();
    const transactionReceipt = await transactionResponse.wait(1);

    if (transactionReceipt.status === 1) {
        console.log("Withdrawn!");
    } else {
        console.log("Transaction failed!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
