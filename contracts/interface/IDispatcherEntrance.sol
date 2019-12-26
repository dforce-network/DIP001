pragma solidity ^0.5.4;

interface IDispatcherEntrance {
	// _fund: 資金來源地址
	// _token: 代幣地址
	// _fund 搭配 _token 為 index 可以取得對應 dispatcher

	function registDispatcher(address _fund, address _token, address _dispatcher) external;

	// 取得對應 dispatcher 地址
	function getDispatcher(address _fund, address _token) external returns (address);

	// 觸發該 dispatcher 執行資金移轉
	function trigger(address _fund, address _token) external returns (bool);

	// 觸發該 dispatcher 的獲益提領
	function withdrawProfit(address _fund, address _token) external returns (bool);

	// 取得該 dispatcher 現有 reserve 值
	function getReserve(address _fund, address _token) external returns (uint256);

	// 取得該 disptcher reserve 值所佔比例，分母為 1000
	function getReserveRatio(address _fund, address _token) external returns (uint256);

	// 取得該 dispatcher 目前本金總額(已存入defi總額)
	function getPrinciple(address _fund, address _token) external returns (uint256);

	// 取得該 dispatcher 目前餘額(各defi餘額總和)
	function getBalance(address _fund, address _token) external returns (uint256);

	// 取得該 dispatcher 目前收益
	function getProfit(address _fund, address _token) external returns (uint256);

	// 取得該 dispatcher, 第 _index 個 handler 的本金
	function getTHPrinciple(address _fund, address _token, uint256 _index) external returns (uint256);

	// 取得該 dispatcher, 第 _index 個 handler 的餘額
	function getTHBalance(address _fund, address _token, uint256 _index) external returns (uint256);

	// 取得該 dispatcher, 第 _index 個 handler 的收益
	function getTHProfit(address _fund, address _token, uint256 _index) external returns (uint256);
}