pragma solidity ^0.5.4;

import './DSLibrary/DSAuth.sol';
import './interface/IDispatcher.sol';

contract DispatcherEntrance is DSAuth{

	mapping(address => mapping(address => address)) dispatchers;

    modifier onlySupportedPair(address _fund, address _token) {
        require(dispatchers[_fund][_token] != address(0), "not supported pair");
        _;
    }

	function registDispatcher(address _fund, address _token, address _dispatcher) auth external {
		dispatchers[_fund][_token] = _dispatcher;
	}

	function trigger(address _fund, address _token) onlySupportedPair(_fund, _token) external returns (bool) {
		return IDispatcher(dispatchers[_fund][_token]).trigger();
	}

	function withdrawProfit(address _fund, address _token) onlySupportedPair(_fund, _token) external returns (bool) {
		return IDispatcher(dispatchers[_fund][_token]).withdrawProfit();
	}

	function getDispatcher(address _fund, address _token) view public returns (address) {
		return dispatchers[_fund][_token];
	}
	
	function getReserve(address _fund, address _token) onlySupportedPair(_fund, _token) view public returns (uint256) {
		return IDispatcher(dispatchers[_fund][_token]).getReserve();
	}

	function getReserveRatio(address _fund, address _token) onlySupportedPair(_fund, _token) view public returns (uint256) {
		return IDispatcher(dispatchers[_fund][_token]).getReserveRatio();
	}

	function getPrinciple(address _fund, address _token) onlySupportedPair(_fund, _token) view public returns (uint256) {
		return IDispatcher(dispatchers[_fund][_token]).getPrinciple();	
	}

	function getBalance(address _fund, address _token) onlySupportedPair(_fund, _token) view public returns (uint256) {
		return IDispatcher(dispatchers[_fund][_token]).getBalance();
	}

	function getProfit(address _fund, address _token) onlySupportedPair(_fund, _token) view public returns (uint256) {
		return IDispatcher(dispatchers[_fund][_token]).getProfit();
	}

	function getTHPrinciple(address _fund, address _token, uint256 _index) onlySupportedPair(_fund, _token) view public returns (uint256) {
		return IDispatcher(dispatchers[_fund][_token]).getTHPrinciple(_index);
	}

	function getTHBalance(address _fund, address _token, uint256 _index) onlySupportedPair(_fund, _token) view public returns (uint256) {
		return IDispatcher(dispatchers[_fund][_token]).getTHBalance(_index);
	}

	function getTHProfit(address _fund, address _token, uint256 _index) onlySupportedPair(_fund, _token) view public returns (uint256) {
		return IDispatcher(dispatchers[_fund][_token]).getTHProfit(_index);
	}
}