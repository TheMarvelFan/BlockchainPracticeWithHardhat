const networkConfig = {
    // sepolia network Id
    11155111: {
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },
    // polygon mainnet id
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    },
};

const devChains = ["hardhat", "localhost"];

const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000;

module.exports = {
    networkConfig,
    devChains,
    DECIMALS,
    INITIAL_ANSWER
};
