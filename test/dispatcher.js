'use strict'
var DSToken = artifacts.require("DSToken");
var Dispatcher = artifacts.require("Dispatcher")
var TargetHandler = artifacts.require("TargetHandler")
var DeFi = artifacts.require("DeFi")

contract('test', function(accounts) {
	const admin = accounts[0]
	const user1 = accounts[1]
	const user2 = accounts[2]
	const user3 = accounts[3]
	const wallet = accounts[4]

	const ether = async function (amount) {
		return await web3.utils.toWei(amount, "ether")
	}

	const toEther = async function (amount) {
		return await web3.utils.fromWei(amount, "ether")
	}

	it("dispatcher", async function() {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000")
		tx = await token.mint(user1, await web3.utils.toWei("100", "ether"))
		tx = await token.mint(user2, await web3.utils.toWei("100", "ether"))

		const balanceOf = async function(address) {
			return await toEther(await token.balanceOf(address))
		}

	});

	it("TargetHandler", async function() {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000")
		tx = await token.mint(user1, await web3.utils.toWei("100", "ether"))
		tx = await token.mint(user2, await web3.utils.toWei("100", "ether"))

		const balanceOf = async function(address) {
			return await toEther(await token.balanceOf(address))
		}

		let defi = await DeFi.new(token.address);
		let targetHandler = await TargetHandler.new(defi.address, token.address)

		tx = await token.transfer(targetHandler.address, await web3.utils.toWei("10", "ether"), {from: user1})
		console.log("infornation before trigger")
		//console.log("balance of user1: ", await balanceOf(user1))
		console.log("balance of targetHandler: ", await balanceOf(targetHandler.address))
		console.log("balance of defi: ", await balanceOf(defi.address))
		console.log("principle: ", await toEther((await targetHandler.principle.call()).toString()));
		console.log("balance in DeFi: ", await toEther((await targetHandler.getBalance.call()).toString()));
		console.log("profit in Defi: ", await toEther((await targetHandler.getProfit.call()).toString()));
		console.log("-------------------------------------------")

		tx = await targetHandler.trigger()
		console.log("infornation after trigger")
		//console.log("balance of user1: ", await balanceOf(user1))
		console.log("balance of targetHandler: ", await balanceOf(targetHandler.address))
		console.log("balance of defi: ", await balanceOf(defi.address))
		console.log("principle: ", await toEther((await targetHandler.principle.call()).toString()));
		console.log("balance in DeFi: ", await toEther((await targetHandler.getBalance.call()).toString()));
		console.log("profit in Defi: ", await toEther((await targetHandler.getProfit.call()).toString()));
		console.log("-------------------------------------------")

		tx = await token.transfer(defi.address, await web3.utils.toWei("10", "ether"), {from: user2})
		console.log("infornation after interest")
		//console.log("balance of user1: ", await balanceOf(user1))
		console.log("balance of targetHandler: ", await balanceOf(targetHandler.address))
		console.log("balance of defi: ", await balanceOf(defi.address))
		console.log("principle: ", await toEther((await targetHandler.principle.call()).toString()));
		console.log("balance in DeFi: ", await toEther((await targetHandler.getBalance.call()).toString()));
		console.log("profit in Defi: ", await toEther((await targetHandler.getProfit.call()).toString()));
		console.log("-------------------------------------------")

	});
});

