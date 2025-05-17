// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "./PriceConverter.sol";

    error FundMe__NotOwner(); // error declaration

/**
 * @title A contract for crowd funding
 * @author Kushagra Nigam
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as a library
*/
contract FundMe {
    address private immutable i_owner; // both constant and immutable keywords are used to mark a value as unchangeable
    // immutable is changeable before deployment, but cannot be changed after deployment
    // check documentation for details

    AggregatorV3Interface private s_priceFeed;

    using PriceConverter for uint256;
    uint256 public constant MIN_USD = 50 * 1e18; // constant only works on compile time assigned values, i.e., hardcoded values of global variables. Doing this saves gas
    // because instead of storing these constant and immutable variables in usual storage spaces, they are stored directly on the bytecode of the contract
    // (could possible be similar to bytecode (.class) in java for static variables, but we'll know much much later

    address[] private s_funders; // s_ is a convention to show that this variable is a state variable (and costs a lot of gas to store and access)
    mapping (address => uint256) private s_addressToAmountFunded;

    constructor(address priceFeedAddress) { // gets called immediately when contract is deployed
        i_owner = msg.sender; // whoever deployed this contract is the owner
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // receive and callback methods are used to receive money on contract's address

//    receive() external payable {
//        fund();
//    }
//
//    fallback() external payable {
//        fund();
//    }

    modifier onlyOwner {
        // _; // this signifies when to run the body of the function on which modifier is applied. in this case, modifier body will run after the function body
        // require(msg.sender == i_owner, "Only owner can call this function"); // instead of require, we can use custom error
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner(); // saves gas as strings don't need to be stored
        }

        _; // this signifies when to run the body of the function on which modifier is applied. in this case, modifier body will run before the function body
    }

    /**
      * @notice Funds this contract
      * @dev This implements price feeds as a library
    */
    function fund() public payable {
        require(msg.value.getConversionRate(s_priceFeed) >= MIN_USD, "Didn't send enough!"); // this is equivalent to 1 ETH (1000000000000000000 wei)
        // msg is a global object accessible in all contracts
        // when a revert occurs (basically an error encountered), everything that happened before the line on which error was encountered is undo
        // and the gas remaining at the time of error encounter is returned, however, any computations that
        // required gas for execution before the error was encountered proceeded normally, so the gas spent
        // on those operations is not refunded.
        // so, it is advisable that the require statement is written before any heavy computations
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }


    function withdraw() public onlyOwner { // modifier body runs before or after the function body. This is decided by
        // the position of the underscore ('_') in the modifier body

        // require(msg.sender == i_owner, "Only owner can withdraw funds");

        for (uint256 id = 0; id < s_funders.length; id ++) {
            address funder = s_funders[id];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);

        // 3 ways to send money back
        // transfer
        payable(msg.sender).transfer(address(this).balance); // max gas it takes is is 2300. if it fails, error is thrown

        // send
        bool success = payable(msg.sender).send(address(this).balance); // max gas it takes is is 2300. if it fails, bool is returned
        require(success, "Send failed"); // to revert if transfer fails

        // call
        (bool callSucc,) = payable(msg.sender).call{value: address(this).balance}(""); // call can be used to call methods from other contracts without having the ABI
        require(callSucc, "Call failed!"); // to revert if transfer fails
    }

    function cheaperWithdraw() public payable {
        address[] memory funders = s_funders; // this is a memory variable, so it is cheaper to access
        // mappings cannot be in-memory

        for (uint256 funderId = 0; funderId < funders.length; funderId ++) {
            address funder = funders[funderId];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
