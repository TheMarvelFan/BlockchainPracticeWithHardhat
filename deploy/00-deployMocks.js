const { network } = require("hardhat");
const {
    devChains,
    DECIMALS,
    INITIAL_ANSWER
} = require("../hardhatConfigHelper");

module.exports = async ({
    getNamedAccounts,
    deployments
}) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    if (devChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        });
        log("Mocks deployed!");
        log("----------------------------------------------------");
    }
}

module.exports.tags = ["all", "mocks"];
