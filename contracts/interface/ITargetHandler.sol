pragma solidity ^0.5.4;

interface ITargetHandler {
	function deposit() external returns (uint256); // token deposit 
	function withdraw(uint256 _amounts) external returns (uint256);
	function withdrawProfit() external returns (uint256);
	function getBalance() view external returns (uint256);
	function getPrinciple() view external returns (uint256);
	function getProfit() view external returns (uint256);
	function getTargetAddress() view external returns (address);
	function getToken() view external returns (address);
	function getDispatcher() view external returns (address);
}