pragma solidity ^0.5.4;

import './interface/ITargetHandler.sol';

contract FakeDispatcher {
    address public fundPool;
    address public profitBeneficiary;
    
    function setFund(address _addr) external {
        fundPool = _addr;
    }
    
    function setProfitB(address _addr) external {
        profitBeneficiary = _addr;
    }

	function getFund() view external returns (address) {
		return fundPool;
	}

	function getProfitBeneficiary() view external returns (address) {
		return profitBeneficiary;
	}
	
	function callWithdraw(address _target, uint _amount) external {
	    require(ITargetHandler(_target).withdraw(_amount) == true);
	}
	
}
