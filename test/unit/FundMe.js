const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const { describe, it, beforeEach } = require("mocha");
const { devChains, networkConfig } = require("../../hardhatConfigHelper");

describe("FundMe", async function() {
    let fundMe;
    let deployer;
    let mockV3Aggregator;
    let accounts;
    // const sendVal = "1000000000000000000"; // 1 ETH
    const sendVal = ethers.parseEther("1.0"); // 1 ETH

    beforeEach(async function() {
        const accounts = await ethers.getSigners(); // returns list of accounts for current network specified in hardhat config
        deployer = accounts[0];

        await deployments.fixture(["all"]);

        const FundMeDeployment = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt(
            "FundMe",
            FundMeDeployment.address,
            deployer
        );

        let MockV3AggregatorDeployment;
        let ethUsdPriceFeedAddress;

        if (devChains.includes(network.name)) {
            MockV3AggregatorDeployment = await deployments.get("MockV3Aggregator");
            ethUsdPriceFeedAddress = MockV3AggregatorDeployment.address;

            mockV3Aggregator = await ethers.getContractAt(
                "MockV3Aggregator",
                MockV3AggregatorDeployment.address,
                deployer
            );
        } else {
            const chainId = network.config.chainId;
            ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
        }
    });

    describe("Constructor", async function() {
        it("Sets the aggregator addresses correctly", async function() {
            const response = await fundMe.getPriceFeed();
            assert.equal(response, await mockV3Aggregator.getAddress());
        });
    });

    describe("Fund", async function () {
        it("Should fail if we don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough!");
        });

        it("Should update the amountFunded data structure", async function () {
            await fundMe.fund({value: sendVal});
            const response = await fundMe.getAddressToAmountFunded(deployer);
            assert.equal(response.toString(), sendVal.toString());
        });
        it("Should add the address of funder to funders array", async function () {
            await fundMe.fund({value: sendVal});
            const funder = await fundMe.getFunders(0);
            assert.equal(funder, await deployer.getAddress());
        });
    });

    describe("Withdraw", async function () {
        beforeEach(async function () {
            await fundMe.fund({value: sendVal});
        });

        it("Should withdraw ETH from a single funder", async function() {
            const startingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );

            const startingDeployerBalance = await ethers.provider.getBalance(
               await deployer.getAddress()
            );

            const txResponse = await fundMe.withdraw();
            const txReceipt = await txResponse.wait(1);

            const endingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );

            const endingDeployerBalance = await ethers.provider.getBalance(
                await deployer.getAddress()
            );

            const { gasPrice, gasUsed } = txReceipt;
            const gasCost = gasUsed * gasPrice;

            assert.equal(endingFundMeBalance, 0);
            assert.equal(`${startingFundMeBalance + startingDeployerBalance}`, `${endingDeployerBalance + gasCost}`);
        });

        it("Should allow withdrawing with multiple funders", async function() {
            const accounts = await ethers.getSigners();

            for (let i = 1; i < accounts.length; i ++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                await fundMeConnectedContract.fund({value: sendVal});
            }

            const startingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );

            const startingDeployerBalance = await ethers.provider.getBalance(
                await deployer.getAddress()
            );

            const txResponse = await fundMe.withdraw();
            const txReceipt = await txResponse.wait(1);

            const { gasPrice, gasUsed } = txReceipt;
            const gasCost = gasUsed * gasPrice;

            const endingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );

            const endingDeployerBalance = await ethers.provider.getBalance(
                await deployer.getAddress()
            );

            assert.equal(endingFundMeBalance, 0);
            assert.equal(`${startingFundMeBalance + startingDeployerBalance}`, `${endingDeployerBalance + gasCost}`);

            await expect(fundMe.getFunders(0)).to.be.reverted;

            for (let i = 1; i < 6; i ++) {
                assert.equal(await fundMe.getAddressToAmountFunded(await accounts[i].getAddress()), 0);
            }
        });

        it("Should allow only owner to withdraw", async function() {
            const accounts = await ethers.getSigners();
            const attacker = accounts[1];

            const connectedAttacker = await fundMe.connect(attacker);

            try {
                await connectedAttacker.withdraw();
                // If we reach here, the transaction didn't revert as expected
                assert.fail("Transaction should have reverted");
            } catch (error) {
                // Check if the error contains the expected reason
                expect(error.message).to.include("FundMe__NotOwner");
            }
        });

        // it("", async function() {});
        it("cheaper withdraw", async function() {
            const accounts = await ethers.getSigners();

            for (let i = 1; i < accounts.length; i ++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                await fundMeConnectedContract.fund({value: sendVal});
            }

            const startingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );

            const startingDeployerBalance = await ethers.provider.getBalance(
                await deployer.getAddress()
            );

            const txResponse = await fundMe.cheaperWithdraw();
            const txReceipt = await txResponse.wait(1);

            const { gasPrice, gasUsed } = txReceipt;
            const gasCost = gasUsed * gasPrice;

            const endingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );

            const endingDeployerBalance = await ethers.provider.getBalance(
                await deployer.getAddress()
            );

            assert.equal(endingFundMeBalance, 0);
            assert.equal(`${startingFundMeBalance + startingDeployerBalance}`, `${endingDeployerBalance + gasCost}`);

            await expect(fundMe.getFunders(0)).to.be.reverted;

            for (let i = 1; i < 6; i ++) {
                assert.equal(await fundMe.getAddressToAmountFunded(await accounts[i].getAddress()), 0);
            }
        });

        it("cheaper withdraw for single", async function() {
            const startingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );

            const startingDeployerBalance = await ethers.provider.getBalance(
                await deployer.getAddress()
            );

            const txResponse = await fundMe.cheaperWithdraw();
            const txReceipt = await txResponse.wait(1);

            const endingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );

            const endingDeployerBalance = await ethers.provider.getBalance(
                await deployer.getAddress()
            );

            const { gasPrice, gasUsed } = txReceipt;
            const gasCost = gasUsed * gasPrice;

            assert.equal(endingFundMeBalance, 0);
            assert.equal(`${startingFundMeBalance + startingDeployerBalance}`, `${endingDeployerBalance + gasCost}`);
        });
    });
});
