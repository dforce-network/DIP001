pragma solidity ^0.5.0;

interface ITargetHandler {
	function trigger() external; // trigger token deposit 
	function withdraw(uint256 _amounts) external;
	function withdrawProfit(address payable _beneficiary) external;
	function getBalance() external;
	function getPrinciple() external;
	function getProfit() external;
}

interface IERC20 {
    function balanceOf(address _owner) external view returns (uint);
    function allowance(address _owner, address _spender) external view returns (uint);
    function transfer(address _to, uint _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint _value) external returns (bool success);
    function approve(address _spender, uint _value) external returns (bool success);
    function totalSupply() external view returns (uint);
}


contract Dispatcher {

	address public owner;
	address public token;
	address payable public profitBeneficiary;
	uint256 public principle;
	Target[] public targets; 

	struct Target {
		address targetAddress;
		uint256 percentage;
	}

	modifier onlyOwner () {
		require(msg.sender == owner);
		_;
	}

	constructor (address _tokenAddr, address[] memory _targetAddress, uint256[] memory _targetPercentage) public {
		owner = msg.sender;
		token = _tokenAddr;
		require(_targetPercentage.length == _targetAddress.length);
		uint256 sum = 0;
		uint256 i;
		for(i = 0; i < _targetAddress.length; ++i) {
			sum += _targetPercentage[i];
		}
		require(sum == 1000);
		for(i = 0; i < _targetAddress.length; ++i) {
			targets.push(Target(_targetAddress[i], _targetPercentage[i]));
		}
	}

	function deposit (uint256 _amounts) external {
		uint256 i;
		uint256 targetAmounts;
		Target memory target;
		for(i = 0; i < targets.length; ++i) {
			target = targets[i];
			targetAmounts = _amounts * target.percentage / 1000;
			require(IERC20(token).transferFrom(msg.sender, target.targetAddress, targetAmounts));
			ITargetHandler(target.targetAddress).trigger();
		}
		principle += _amounts;
	}

	function withdrawPrinciple (uint256 _amounts) external {
		uint256 i;
		uint256 targetAmounts;
		Target memory target;
		for(i = 0; i < targets.length; ++i) {
			target = targets[i];
			targetAmounts = _amounts * target.percentage / 1000;
			ITargetHandler(target.targetAddress).withdraw(targetAmounts);
		}
		principle -= _amounts;
	}

	function withdrawProfit () external {
		uint256 i;
		Target memory target;
		for(i = 0; i < targets.length; ++i) {
			target = targets[i];
			ITargetHandler(target.targetAddress).withdrawProfit(profitBeneficiary);
		}		
	}

	function updateTargets() onlyOwner external {

	}

	function addTargets() onlyOwner external {

	}
}
