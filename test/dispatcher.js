'use strict'
var DSToken = artifacts.require("DSToken");
var Dispatcher = artifacts.require("Dispatcher")
var TargetHandler = artifacts.require("TargetHandler")
var DeFi = artifacts.require("FakeDeFi")
var DSGuard = artifacts.require("DSGuard")

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
		tx = await defi.makeProfitToUser(targetHandler.address)
		console.log("infornation after interest")
		//console.log("balance of user1: ", await balanceOf(user1))
		console.log("balance of targetHandler: ", await balanceOf(targetHandler.address))
		console.log("balance of defi: ", await balanceOf(defi.address))
		console.log("principle: ", await toEther((await targetHandler.principle.call()).toString()));
		console.log("balance in DeFi: ", await toEther((await targetHandler.getBalance.call()).toString()));
		console.log("profit in Defi: ", await toEther((await targetHandler.getProfit.call()).toString()));
		console.log("-------------------------------------------")
	});

	it("Dispatcher", async function() {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000")
		tx = await token.mint(user1, await web3.utils.toWei("1000000", "ether"))
		tx = await token.mint(user2, await web3.utils.toWei("1000000", "ether"))

		const balanceOf = async function(address) {
			return await toEther(await token.balanceOf(address))
		}

		const showResult = async function() {
			console.log("\tbalance of dispatcher: ", await toEther((await dispatcher.getBalance.call()).toString()))
			console.log("\tbalance of targetHandler_1: ", await toEther((await dispatcher.getTHBalance.call(0)).toString()))
			console.log("\tbalance of targetHandler_2: ", await toEther((await dispatcher.getTHBalance.call(1)).toString()))
			console.log("\treserve in the dispatcher: ", await toEther((await dispatcher.getReserve.call()).toString()))
			console.log("\treserve ratio: ", (await dispatcher.getReserveRatio.call()).toNumber() / 1000)
			console.log("\tprinciple of dispatcher: ", await toEther((await dispatcher.getPrinciple.call()).toString()))
			console.log("\tprinciple of targetHandler_1: ", await toEther((await dispatcher.getTHPrinciple.call(0)).toString()))
			console.log("\tprinciple of targetHandler_2: ", await toEther((await dispatcher.getTHPrinciple.call(1)).toString()))
			console.log("\tprofit of dispatcher: ", await toEther((await dispatcher.getProfit.call()).toString()))
			console.log("\tprofit of targetHandler_1: ", await toEther((await dispatcher.getTHProfit.call(0)).toString()))
			console.log("\tprofit of targetHandler_2: ", await toEther((await dispatcher.getTHProfit.call(1)).toString()))
			console.log("")	
			await showAimedPropotion()
			await showCurrentPropotion()		
		}

		const showAimedPropotion = async function () {
			let targetInfo = await dispatcher.ths.call(0)
			console.log("\ttargetHandler 1 aimedPropotion: ", targetInfo.aimedPropotion.toNumber() / 1000)

			targetInfo = await dispatcher.ths.call(1)
			console.log("\ttargetHandler 2 aimedPropotion: ", targetInfo.aimedPropotion.toNumber() / 1000)
			console.log("")		
		}

		const showCurrentPropotion = async function () {
			let th1 = (await dispatcher.getTHBalance.call(0))
			let th2 = (await dispatcher.getTHBalance.call(1))
			let total = th1.add(th2)
			console.log("\ttargetHandler 1 current propotion: ", th1 / total)
			console.log("\ttargetHandler 2 current proporion: ", th2 / total)
			console.log("")
		}

		let defi_1 = await DeFi.new(token.address);
		let targetHandler_1 = await TargetHandler.new(defi_1.address, token.address)
		let defi_2 = await DeFi.new(token.address);
		let targetHandler_2 = await TargetHandler.new(defi_2.address, token.address)

		let targetAddress = [targetHandler_1.address, targetHandler_2.address]
		let targetPercentage = [200, 800]
		let dispatcher = await Dispatcher.new(token.address, targetAddress, targetPercentage)
		let dsGuard = await DSGuard.new()

		// set authority
		tx = await dispatcher.setAuthority(dsGuard.address, {from: admin})
		tx = await targetHandler_1.setAuthority(dsGuard.address, {from: admin})
		tx = await targetHandler_2.setAuthority(dsGuard.address, {from: admin})
		tx = await dsGuard.permitx(dispatcher.address, targetHandler_1.address, {from: admin})
		tx = await dsGuard.permitx(dispatcher.address, targetHandler_2.address, {from: admin})

		tx = await token.approvex(dispatcher.address, {from: user1})
		tx = await token.approvex(dispatcher.address, {from: user2})

		console.log("address info")
		console.log("defi_1: ", defi_1.address)
		console.log("defi_2: ", defi_2.address)
		console.log("targetHandler_1: ", targetHandler_1.address)
		console.log("targetHandler_2: ", targetHandler_2.address)
		console.log("dispatcher: ", dispatcher.address)
		console.log("")

		console.log("-------------------------------------------")
		console.log("initial infornation")
		console.log("reserve ratio max: ", (await dispatcher.reserveUpperLimit.call()).toNumber() / 1000)
		console.log("reserve ratio min: ", (await dispatcher.reserveLowerLimit.call()).toNumber() / 1000)	
		let targetInfo = await dispatcher.ths.call(0)
		console.log("\ttarget 1 info: ")
		console.log("\t\taddress: ", targetInfo.targetHandlerAddr)
		console.log("\t\tpercentage: ", targetInfo.aimedPropotion.toString())

		targetInfo = await dispatcher.ths.call(1)
		console.log("\ttarget 2 info: ")
		console.log("\t\taddress: ", targetInfo.targetHandlerAddr)
		console.log("\t\tpercentage: ", targetInfo.aimedPropotion.toString())
		console.log("")

		await showResult()

		// deopsit 10 tokens to dispatcher, should dispatch 2 to th1, 8 to th2
		// should reserve 3.5, and dispatch 6.5 / 5 = 1.3 to th1, 5.2 to th2
		console.log("-------------------------------------------")
		console.log("infornation after deposit 10 tokens")
		tx = await token.transfer(dispatcher.address, await ether("10"), {from: user2})
		tx = await dispatcher.trigger()
		await showResult()

		console.log("-------------------------------------------")
		console.log("information after defi_1 get 10% profit and difi_2 get two 10% profit")
		tx = await token.transfer(defi_1.address, await ether("1000"), {from: user2})
		tx = await token.transfer(defi_2.address, await ether("1000"), {from: user2})
		tx = await defi_1.makeProfitToUser(targetHandler_1.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		await showResult()

		console.log("-------------------------------------------")
		console.log("deposit 10 more tokens")
		tx = await token.transfer(dispatcher.address, await ether("10"), {from: user2})
		tx = await dispatcher.trigger()
		await showResult()

		// defi_2 get a lots profit until the reserve rate is too low
		// than trigger should deposit more
		console.log("-------------------------------------------")
		console.log("defi_2 get a lots profit")
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		await showResult()

		console.log("-------------------------------------------")
		console.log("trigger again, should withdraw some principle")
		tx = await dispatcher.trigger()
		await showResult()

		console.log("-------------------------------------------")
		console.log("current propotion")
		await showAimedPropotion()
		await showCurrentPropotion()

		console.log("-------------------------------------------")
		console.log("update aimed propotion to 4:6")
		targetPercentage = [400, 600]
		tx = await dispatcher.setAimedPropotion(targetPercentage, {from: admin})
		await showAimedPropotion()
		await showCurrentPropotion()

		console.log("-------------------------------------------")
		console.log("deposit 10 more tokens")
		tx = await token.transfer(dispatcher.address, await ether("10"), {from: user2})
		tx = await dispatcher.trigger()
		await showResult()

		console.log("-------------------------------------------")
		console.log("deposit 50 more tokens")
		tx = await token.transfer(dispatcher.address, await ether("50"), {from: user2})
		tx = await dispatcher.trigger()
		await showResult()

		console.log("-------------------------------------------")
		console.log("defi get profit")
		tx = await token.transfer(defi_1.address, await ether("1000"), {from: user2})
		tx = await token.transfer(defi_2.address, await ether("1000"), {from: user2})
		tx = await defi_1.makeProfitToUser(targetHandler_1.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		await showResult()

		console.log("-------------------------------------------")
		console.log("withdraw profit")
		tx = await dispatcher.withdrawProfit();
		await showResult()

		console.log("-------------------------------------------")
		console.log("trigger again")
		tx = await dispatcher.trigger()
		await showResult()
	});
});

