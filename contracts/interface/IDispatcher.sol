pragma solidity ^0.5.4;

interface IDispatcher {

	// external function
	function trigger() external returns (bool);
	function withdrawProfit() external returns (bool);

	// get function
	function getReserve() external view returns (uint256);
	function getReserveRatio() external view returns (uint256);
	function getPrinciple() external view returns (uint256);
	function getBalance() external view returns (uint256);
	function getProfit() external view returns (uint256);
	function getTHPrinciple(uint256 _index) external view returns (uint256);
	function getTHBalance(uint256 _index) external view returns (uint256);
	function getTHProfit(uint256 _index) external view returns (uint256);
	function getToken() external view returns (address);
	function getFund() external view returns (address);

	// 取得收益對象地址
	function getProfitBeneficiary() external view returns (address);

	// 取得 reserve 比例上限
	function getReserveUpperLimit() external view returns (uint256);

	// 取得 reserve 比例下限
	function getReserveLowerLimit() external view returns (uint256);

	// 取得執行最小單位
	function getExecuteUnit() external view returns (uint256);

	// governmence function 
	function setAimedPropotion(uint256[] calldata _thPropotion) external returns (bool);
	function addTargetHandler(address _targetHandlerAddr) external returns (bool);
	function removeTargetHandler(address _targetHandlerAddr, uint256 _index) external returns (bool);
	function setProfitBeneficiary(address _profitBeneficiary) external returns (bool);
	function setReserveLowerLimit(uint256 _number) external returns (bool);
	function setReserveUpperLimit(uint256 _number) external returns (bool);
	function setExecuteUnit(uint256 _number) external returns (bool);
}
