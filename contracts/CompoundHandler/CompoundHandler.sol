pragma solidity ^0.5.4;

import '../DSLibrary/DSAuth.sol';
import '../DSLibrary/DSMath.sol';
import '../interface/ITargetHandler.sol';
import '../interface/IDispatcher.sol';
import '../interface/IERC20.sol';

interface CErc20 {
	function mint(uint mintAmount) external returns (uint);
	function redeemUnderlying(uint redeemAmount) external returns (uint);
	function exchangeRateStored() external view returns (uint);
}

contract CompoundHandler is ITargetHandler, DSAuth, DSMath {

	address targetAddr;
	address token;
	uint256 principle;
	address dispatcher;

	constructor (address _targetAddr, address _token) public {
		targetAddr = _targetAddr;
		token = _token;
		IERC20(token).approve(_targetAddr, uint256(-1));
	}

	function setDispatcher (address _dispatcher) public onlyOwner {
		dispatcher = _dispatcher;
	}

	// token deposit
	function deposit() external returns (uint256) {
		uint256 amount = IERC20(token).balanceOf(address(this));
		principle = add(principle, amount);
		if(CErc20(targetAddr).mint(amount) == 0) {
			return 0;
		}
		return 1;
	}

	// withdraw the token back to this contract
	function withdraw(uint256 _amounts) external returns (uint256) {
		require(msg.sender == dispatcher, "sender must be dispatcher");
		// check the fund in the reserve (contract balance) is enough or not
		// if not enough, drain from the defi
		uint256 _tokenBalance = IERC20(token).balanceOf(address(this));
		if (_tokenBalance < _amounts) {
			if(CErc20(targetAddr).redeemUnderlying(sub(_amounts, _tokenBalance)) != 0) { // redeem fail
				if (_tokenBalance != 0) {
					principle = sub(principle, _tokenBalance);
					IERC20(token).transfer(IDispatcher(dispatcher).getFund(), _tokenBalance);
				}
				return 1;
			}
		}

		principle = sub(principle, _amounts);
		IERC20(token).transfer(IDispatcher(dispatcher).getFund(), _amounts);
		return 0;
	}

	function withdrawProfit() external auth returns (uint256) {
		uint256 _amount = getProfit();
		if (_amount != 0) {
			if (CErc20(targetAddr).redeemUnderlying(_amount) != 0) {
				return 1;
			}
			IERC20(token).transfer(IDispatcher(dispatcher).getProfitBeneficiary(), _amount);
		}
		return 0;
	}

	function getBalance() public view returns (uint256) {
	    uint256 currentBalance = mul(IERC20(targetAddr).balanceOf(address(this)), CErc20(targetAddr).exchangeRateStored());
	    return currentBalance / (10 ** 18);
	}

	function getPrinciple() public view returns (uint256) {
		return principle;
	}

	function getProfit() public view returns (uint256) {
	    uint256 _balance = getBalance();
	    uint256 _principle = getPrinciple();
	    if (_balance < _principle) {
	        return 0;
	    } else {
	        return sub(_balance, _principle);
	    }
	}

	function getTargetAddress() public view returns (address) {
		return targetAddr;
	}

	function getToken() external view returns (address) {
		return token;
	}

	function getDispatcher() external view returns (address) {
		return dispatcher;
	}
}