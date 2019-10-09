pragma solidity ^0.5.0;

interface IERC20 {
    function balanceOf(address _owner) external view returns (uint);
    function allowance(address _owner, address _spender) external view returns (uint);
    function transfer(address _to, uint _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint _value) external returns (bool success);
    function approve(address _spender, uint _value) external returns (bool success);
    function totalSupply() external view returns (uint);
}

contract DeFi {
	address public token;
	mapping(address => uint256) public balances;

	constructor (address _token) public {
		token = _token;
	}

	function deposit(uint256 _amounts) external {
		require(IERC20(token).transferFrom(msg.sender, address(this), _amounts));
	}

	function withdraw(uint256 _amounts) external {
		require(getBalance(msg.sender) >= _amounts);
		require(IERC20(token).transfer(msg.sender, _amounts));
	}

	function getBalance(address _owner) public view returns (uint256) {
		return IERC20(token).balanceOf(address(this));
	}
}
