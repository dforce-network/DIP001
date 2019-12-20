pragma solidity ^0.5.4;

import './DSLibrary/DSAuth.sol';
import './Dispatcher.sol';

contract DispatcherEntrance is DSAuth{

	mapping(address => address) dispatchers;

    modifier onlySupportedToken(address _token) {
        require(dispatchers[_token] != address(0), "not supported token");
        _;
    }

	function registDispatcher(address _token, address _dispatcher) auth external {
		dispatchers[_token] = _dispatcher;
	}

	function getReserve(address _token) onlySupportedToken(_token) view public returns (uint256) {
		return Dispatcher(dispatchers[_token]).getReserve();
	}

	function getReserveRatio(address _token) onlySupportedToken(_token) view public returns (uint256) {
		return Dispatcher(dispatchers[_token]).getReserveRatio();
	}

	function getPrinciple(address _token) onlySupportedToken(_token) view public returns (uint256) {
		return Dispatcher(dispatchers[_token]).getPrinciple();	
	}

	function getBalance(address _token) onlySupportedToken(_token) view public returns (uint256) {
		return Dispatcher(dispatchers[_token]).getBalance();
	}

	function getProfit(address _token) onlySupportedToken(_token) view public returns (uint256) {
		return Dispatcher(dispatchers[_token]).getProfit();
	}

	function getTHPrinciple(address _token, uint256 _index) onlySupportedToken(_token) view public returns (uint256) {
		return Dispatcher(dispatchers[_token]).getTHPrinciple(_index);
	}

	function getTHBalance(address _token, uint256 _index) onlySupportedToken(_token) view public returns (uint256) {
		return Dispatcher(dispatchers[_token]).getTHBalance(_index);
	}

	function getTHProfit(address _token, uint256 _index) onlySupportedToken(_token) view public returns (uint256) {
		return Dispatcher(dispatchers[_token]).getTHProfit(_index);
	}
}