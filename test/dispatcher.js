'use strict'
var DSToken = artifacts.require("DSToken");
var Dispatcher = artifacts.require("Dispatcher")
var TargetHandler = artifacts.require("TargetHandler")
var DeFi = artifacts.require("FakeDeFi")
var DSGuard = artifacts.require("DSGuard")
var Fund = artifacts.require("usdxSaver")

contract('test', function (accounts) {
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

	it("TargetHandler", async function () {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000")
		tx = await token.mint(user1, await web3.utils.toWei("100", "ether"))
		tx = await token.mint(user2, await web3.utils.toWei("100", "ether"))

		const balanceOf = async function (address) {
			return await toEther(await token.balanceOf(address))
		}

		let defi = await DeFi.new(token.address);
		let targetHandler = await TargetHandler.new(defi.address, token.address)

		tx = await token.transfer(targetHandler.address, await web3.utils.toWei("10", "ether"), { from: user1 })
		console.log("infornation before trigger")
		//console.log("balance of user1: ", await balanceOf(user1))
		console.log("balance of targetHandler: ", await balanceOf(targetHandler.address))
		console.log("balance of defi: ", await balanceOf(defi.address))
		console.log("principle: ", await toEther((await targetHandler.getPrinciple()).toString()));
		console.log("balance in DeFi: ", await toEther((await targetHandler.getBalance.call()).toString()));
		console.log("profit in Defi: ", await toEther((await targetHandler.getProfit.call()).toString()));
		console.log("-------------------------------------------")

		tx = await targetHandler.deposit()
		console.log("infornation after trigger")
		//console.log("balance of user1: ", await balanceOf(user1))
		console.log("balance of targetHandler: ", await balanceOf(targetHandler.address))
		console.log("balance of defi: ", await balanceOf(defi.address))
		console.log("principle: ", await toEther((await targetHandler.getPrinciple()).toString()));
		console.log("balance in DeFi: ", await toEther((await targetHandler.getBalance.call()).toString()));
		console.log("profit in Defi: ", await toEther((await targetHandler.getProfit.call()).toString()));
		console.log("-------------------------------------------")

		tx = await token.transfer(defi.address, await web3.utils.toWei("10", "ether"), { from: user2 })
		tx = await defi.makeProfitToUser(targetHandler.address)
		console.log("infornation after interest")
		//console.log("balance of user1: ", await balanceOf(user1))
		console.log("balance of targetHandler: ", await balanceOf(targetHandler.address))
		console.log("balance of defi: ", await balanceOf(defi.address))
		console.log("principle: ", await toEther((await targetHandler.getPrinciple()).toString()));
		console.log("balance in DeFi: ", await toEther((await targetHandler.getBalance.call()).toString()));
		console.log("profit in Defi: ", await toEther((await targetHandler.getProfit.call()).toString()));
		console.log("-------------------------------------------")
	});

	it("Dispatcher", async function () {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000")
		let fund = await Fund.new(token.address)

		const balanceOf = async function (address) {
			return await toEther(await token.balanceOf(address))
		}

		const showResult = async function () {
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
			console.log("\taimedPropotion: ", (await dispatcher.getPropotion()))	
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
		let dispatcher = await Dispatcher.new(token.address, fund.address, targetAddress, targetPercentage)
		let dsGuard = await DSGuard.new()

		tx = await targetHandler_1.setDispatcher(dispatcher.address);
		tx = await targetHandler_2.setDispatcher(dispatcher.address);

		// set authority
		tx = await dispatcher.setAuthority(dsGuard.address, { from: admin })
		tx = await targetHandler_1.setAuthority(dsGuard.address, { from: admin })
		tx = await targetHandler_2.setAuthority(dsGuard.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, targetHandler_1.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, targetHandler_2.address, { from: admin })

		tx = await token.approvex(dispatcher.address, { from: user1 })
		tx = await token.approvex(dispatcher.address, { from: user2 })

		console.log("address info")
		console.log("defi_1: ", defi_1.address)
		console.log("defi_2: ", defi_2.address)
		console.log("targetHandler_1: ", targetHandler_1.address)
		console.log("targetHandler_2: ", targetHandler_2.address)
		console.log("dispatcher: ", dispatcher.address)
		console.log("")

		console.log("-------------------------------------------")
		console.log("initial infornation")
		console.log("reserve ratio max: ", (await dispatcher.getReserveUpperLimit()).toNumber() / 1000)
		console.log("reserve ratio min: ", (await dispatcher.getReserveLowerLimit()).toNumber() / 1000)	
		console.log("\ttarget 1 address: ", (await dispatcher.getTargetAddress(0)))
		console.log("\ttarget 2 address: ", (await dispatcher.getTargetAddress(1)))
		console.log("\t\tpercentage: ", await dispatcher.getPropotion().toString())
		console.log("")

		await showResult()

		// deopsit 10 tokens to fund, should dispatch 2 to th1, 8 to th2
		// should reserve 3.5, and dispatch 6.5 / 5 = 1.3 to th1, 5.2 to th2
		console.log("-------------------------------------------")
		console.log("infornation after deposit 10 tokens")
		tx = await token.mint(fund.address, await ether("10"))
		tx = await dispatcher.trigger()
		console.log(tx.receipt.gasUSed)
		await showResult()

		console.log("-------------------------------------------")
		console.log("infornation after withdraw 3 tokens")
		tx = await fund.withdraw(await ether("3"))
		tx = await dispatcher.trigger()
		console.log(tx.receipt.gasUSed)
		await showResult()		

		console.log("-------------------------------------------")
		console.log("information after defi_1 get 10% profit and difi_2 get two 10% profit")

		tx = await token.mint(defi_1.address, await ether("1000"))
		tx = await token.mint(defi_2.address, await ether("1000"))
		tx = await defi_1.makeProfitToUser(targetHandler_1.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		await showResult()

		console.log("-------------------------------------------")
		console.log("deposit 10 more tokens")

		tx = await token.mint(fund.address, await ether("10"))
		tx = await dispatcher.trigger()
		console.log(tx.receipt.gasUSed)
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
		console.log(tx.receipt.gasUSed)
		await showResult()

		console.log("-------------------------------------------")
		console.log("current propotion")
		await showAimedPropotion()
		await showCurrentPropotion()

		console.log("-------------------------------------------")
		console.log("update aimed propotion to 4:6")
		targetPercentage = [400, 600]
		tx = await dispatcher.setAimedPropotion(targetPercentage, { from: admin })
		await showAimedPropotion()
		await showCurrentPropotion()

		console.log("-------------------------------------------")
		console.log("deposit 10 more tokens")

		tx = await token.mint(fund.address, await ether("10"))
		tx = await dispatcher.trigger()
		console.log(tx.receipt.gasUSed)
		await showResult()

		console.log("-------------------------------------------")
		console.log("deposit 50 more tokens")

		tx = await token.mint(fund.address, await ether("50"))

		tx = await dispatcher.trigger()
		console.log(tx.receipt.gasUSed)
		await showResult()

		console.log("-------------------------------------------")
		console.log("defi get profit")

		tx = await token.mint(defi_1.address, await ether("1000"))
		tx = await token.mint(defi_2.address, await ether("1000"))

		tx = await defi_1.makeProfitToUser(targetHandler_1.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		tx = await defi_2.makeProfitToUser(targetHandler_2.address)
		await showResult()

		console.log("-------------------------------------------")
		console.log("withdraw profit")
		tx = await dispatcher.withdrawProfit({from: admin});
		await showResult()

		console.log("-------------------------------------------")
		console.log("trigger again")
		tx = await dispatcher.trigger()
		console.log(tx.receipt.gasUSed)
		await showResult()
	});
});

