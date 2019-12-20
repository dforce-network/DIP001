pragma solidity ^0.5.4;

import '../DSLibrary/DSAuth.sol';
import '../DSLibrary/DSMath.sol';
import '../interface/ITargetHandler.sol';
import '../interface/IERC20.sol';

interface CErc20 {
	function mint(uint mintAmount) external returns (uint);
	function redeemUnderlying(uint redeemAmount) external returns (uint);
	function exchangeRateCurrent() external view returns (uint);
}

contract CompoundHandler is ITargetHandler, DSAuth, DSMath {

	address public targetAddr;
	address public token;
	uint256 public principle;
	address public dispatcher;

	constructor (address _targetAddr, address _token) public {
		targetAddr = _targetAddr;
		token = _token;
		IERC20(token).approve(_targetAddr, uint256(-1));
	}

	function setDispatcher (address _dispatcher) public onlyOwner {
		dispatcher = _dispatcher;
	}

	// trigger token deposit
	function trigger() external {
		uint256 amount = IERC20(token).balanceOf(address(this));
		principle = add(principle, amount);
		require(CErc20(token).mint(amount) == 0);
	}

	// withdraw the token back to this contract
	function withdraw(uint256 _amounts) external auth {
		require(msg.sender == dispatcher, "sender must be dispatcher");
		// check the fund in the reserve (contract balance) is enough or not
		// if not enough, drain from the defi
		uint256 _tokenBalance = IERC20(token).balanceOf(address(this));
		if (_tokenBalance < _amounts) {
			require(CErc20(token).redeemUnderlying(sub(_amounts, _tokenBalance)) == 0);
		}

		principle = sub(principle, _amounts);
		require(IERC20(token).transfer(msg.sender, _amounts));
	}

	function withdrawProfit(address _beneficiary) external auth {
		require(msg.sender == dispatcher, "sender must be dispatcher");
		uint256 _amount = getProfit();
		require(CErc20(token).redeemUnderlying(_amount) == 0);
		require(IERC20(token).transfer(_beneficiary, _amount));
	}

	function getBalance() public view returns (uint256) {
		return mul(IERC20(token).balanceOf(address(this)), CErc20(token).exchangeRateCurrent());
	}

	function getPrinciple() public view returns (uint256) {
		return principle;
	}

	function getProfit() public view returns (uint256) {
		return sub(getBalance(), getPrinciple());
	}

	function getTargetAddress() public view returns (address) {
		return targetAddr;
	}
}