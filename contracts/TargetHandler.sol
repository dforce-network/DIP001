pragma solidity ^0.5.2;

import './DSLibrary/DSAuth.sol';

interface IERC20 {
    function balanceOf(address _owner) external view returns (uint);
    function allowance(address _owner, address _spender) external view returns (uint);
    function transfer(address _to, uint _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint _value) external returns (bool success);
    function approve(address _spender, uint _value) external returns (bool success);
    function totalSupply() external view returns (uint);
}

interface IDeFi {
	function deposit(uint256 _amounts) external;
	function withdraw(uint256 _amounts) external;
	function getBalance(address _owner) external view returns (uint256);
}

library DSMath {
    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, "ds-math-add-overflow");
    }
    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }
}

contract TargetHandler is DSAuth{
	using DSMath for uint256;

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
		principle = principle.add(amount);
		IDeFi(targetAddr).deposit(amount);
	}

	// withdraw the token back to this contract
	// TODO: check sender, must be dispatcher!!
	function withdraw(uint256 _amounts) external auth {
		//require(msg.sender == owner, "sender must be owner");
		// check the fund in the reserve (contract balance) is enough or not
		// if not enough, drain from the defi
		uint256 _tokenBalance = IERC20(token).balanceOf(address(this));
		if (_tokenBalance < _amounts) {
			IDeFi(targetAddr).withdraw(_amounts - _tokenBalance);
		}

		principle = principle.sub(_amounts);
		require(IERC20(token).transfer(msg.sender, _amounts));
	}

	function withdrawProfit(address _beneficiary) external {
		uint256 _amount = getProfit();
		IDeFi(targetAddr).withdraw(_amount);
		require(IERC20(token).transfer(_beneficiary, _amount));
	}

	function getBalance() public view returns (uint256) {
		return IDeFi(targetAddr).getBalance(address(this));
	}

	function getPrinciple() public view returns (uint256) {
		return principle;
	}

	function getProfit() public view returns (uint256) {
		return getBalance().sub(getPrinciple());
	}

	function getTargetAddress() public view returns (address) {
		return targetAddr;
	}
}
