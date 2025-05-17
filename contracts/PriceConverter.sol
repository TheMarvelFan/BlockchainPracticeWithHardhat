// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

library PriceConverter { // cannot have state variables and cannot send/store ether
    // it is a way to attach certain properties and methods to primitives, so that these properties can function
    // on the primitive as if they were an object of a contract which has properties to call

    function getVersion() internal view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        return priceFeed.version();
    }

    function getPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        // 0x694AA1769357215DE4FAC081bf1f309aDC325306
        // ABI
        (, int256 price,,,) = priceFeed.latestRoundData(); // remove everything that's not needed, weird way of object destructuring
        return uint256(price * 1e10); // because this is in
    }

    function getConversionRate(uint256 ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint256) {
        // when a primitive calls a method that takes 1 parameter, then that parameter is automatically assigned the value
        // of the calling primitive
        // if multiple parameters are required, then the 2nd parameter and beyond need to be explicitly mentioned in the method call
        // the 1st argument passed there would be assigned to the second parameter here, and so on

        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd; // uint numbers are rounded to ceil() automatically, instead of dropping the value after floating point
    }
}
