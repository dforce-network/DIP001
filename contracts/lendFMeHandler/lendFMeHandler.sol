pragma solidity ^0.5.4;

import '../DSLibrary/DSAuth.sol';
import '../DSLibrary/DSMath.sol';
import '../interface/ITargetHandler.sol';
import '../interface/IERC20.sol';

interface ILendFMe {
	function supply(address _token, uint _amounts) external returns (uint);
	function withdraw(address _token, uint _amounts) external returns (uint);
	function getSupplyBalance(address _user, address _token) external view returns (uint256);
}

contract lendFMeHandler is ITargetHandler, DSAuth, DSMath {

	address public targetAddr;
	address public token;
	uint256 public principle;

	constructor (address _targetAddr, address _token) public {
		targetAddr = _targetAddr;
		token = _token;
		IERC20(token).approve(_targetAddr, uint256(-1));
	}

	// trigger token deposit
	function trigger() external {
		uint256 amount = IERC20(token).balanceOf(address(this));
		principle = add(principle, amount);
		ILendFMe(targetAddr).supply(address(token), amount);
	}

	// withdraw the token back to this contract
	// TODO: check sender, must be dispatcher!!
	function withdraw(uint256 _amounts) external auth {
		//require(msg.sender == owner, "sender must be owner");
		// check the fund in the reserve (contract balance) is enough or not
		// if not enough, drain from the defi
		uint256 _tokenBalance = IERC20(token).balanceOf(address(this));
		if (_tokenBalance < _amounts) {
			ILendFMe(targetAddr).withdraw(address(token), sub(_amounts, _tokenBalance));
		}

		principle = sub(principle, _amounts);
		require(IERC20(token).transfer(msg.sender, _amounts));
	}

	function withdrawProfit(address _beneficiary) external auth {
		uint256 _amount = getProfit();
		ILendFMe(targetAddr).withdraw(address(token), _amount);
		require(IERC20(token).transfer(_beneficiary, _amount));
	}

	function getBalance() public view returns (uint256) {
		return ILendFMe(targetAddr).getSupplyBalance(address(this), address(token));
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