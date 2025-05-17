const { assert, expect } = require("chai");
const { ethers, deployments, network} = require("hardhat");
const { describe, it, beforeEach } = require("mocha");
const { devChains } = require("../../hardhatConfigHelper");

devChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
        let fundMe;
        let deployer;
        const sendVal = ethers.parseEther("1");
        beforeEach(async function () {
            const accounts = await ethers.getSigners();
            deployer = accounts[0];

            const FundMeDeployment = await deployments.get("FundMe");

            fundMe = await ethers.getContractAt(
                "FundMe",
                FundMeDeployment.address,
                deployer
            );
        });

        it("Should allow people to fund and withdraw", async function () {
            await fundMe.fund({ value: sendVal });
            await fundMe.withdraw();

            const endingBalance = await fundMe.provider.getBalance(
                fundMe.address
            );

            assert.equal(endingBalance.toString(), "0");
        });
    });
