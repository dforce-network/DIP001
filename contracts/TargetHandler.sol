pragma solidity ^0.5.0;

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

contract TargetHandler {
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
		principle += amount;
		IDeFi(targetAddr).deposit(amount);
	}

	// withdraw the token back to this contract
	function withdraw(uint256 _amounts) external {
		principle -= _amounts;
		IDeFi(targetAddr).withdraw(_amounts);
	}

	function withdrawProfit(address _beneficiary) external {
		uint256 amount = getProfit();
		IDeFi(targetAddr).withdraw(amount);
		require(IERC20(token).transfer(_beneficiary, amount));
	}

	function getBalance() public view returns (uint256) {
		return IDeFi(targetAddr).getBalance(address(this));
	}

	function getPrinciple() public view returns (uint256) {
		return principle;
	}

	function getProfit() public view returns (uint256) {
		return getBalance() - getPrinciple();
	}
}
