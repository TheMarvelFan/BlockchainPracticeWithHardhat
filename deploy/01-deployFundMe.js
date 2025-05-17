const { network } = require("hardhat");
const { networkConfig, devChains} = require("../hardhatConfigHelper");
const { verify } = require("../utils/verify");

module.exports = async ({
        getNamedAccounts,
        deployments
    }) => {
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let ethUsdPriceFeedAddress;

    if (devChains.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    // if we are testing on local hardhat chain, it does not come with its own price feed address
    // in that case, we will need mock contracts

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], // put price-feed address here
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    });

    const args = [ethUsdPriceFeedAddress];

    if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args);
    }

    log("-----------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];

// after deploying these contracts to the hardhat network, they will always be available on the hardhat chain
// and can be accessed after running the hardhat node command
