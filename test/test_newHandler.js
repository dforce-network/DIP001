'use strict'
var DSToken = artifacts.require("DSToken");
var Dispatcher = artifacts.require("Dispatcher")
var TargetHandler = artifacts.require("TargetHandler")
var LendFMeHandler = artifacts.require("lendFMeHandler")
var CompoundHandler = artifacts.require("CompoundHandler")
var DeFi = artifacts.require("FakeDeFi")
var LendFMe = artifacts.require("FakeLendFMe")
var Compound = artifacts.require("FakeCompound")
var DSGuard = artifacts.require("DSGuard")
var Fund = artifacts.require("usdxSaver")
var IHandler = artifacts.require("ITargetHandler")

contract('procedure with profit growing', function (accounts) {
	const admin = accounts[0]
	const profitBeneficiary = accounts[1]

	it("newhandler", async function () {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000", 0)
		let principle = 100

		let admin = accounts[0]
		let fund = accounts[1]
		let profit = accounts[2]

		let lendFMe = await LendFMe.new(token.address);
		let lendFMeHandler_1 = await LendFMeHandler.new(lendFMe.address, token.address)

		let targetAddress = [lendFMeHandler_1.address]
		let targetPercentage = [1000]
		let dispatcher = await Dispatcher.new(token.address, fund, targetAddress, targetPercentage, 0)
		let dsGuard = await DSGuard.new()

		tx = await lendFMeHandler_1.setDispatcher(dispatcher.address);
		tx = await lendFMeHandler_1.setPrinciple(principle);

		// set authority
		tx = await dispatcher.setAuthority(dsGuard.address, { from: admin })
		tx = await lendFMeHandler_1.setAuthority(dsGuard.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_1.address, { from: admin })
		tx = await dsGuard.permitx(admin, dispatcher.address, {from: admin})
		tx = await dsGuard.permitx(admin, lendFMeHandler_1.address, {from: admin})

		tx = await dispatcher.setProfitBeneficiary(profit, {from: admin})

		let consoleIndex = 0
		const showResult = async function (note) {
			consoleIndex += 1
			console.log("-------------------------------------------")
			let aaa = consoleIndex + ". " + note
			console.log(aaa)
			console.log("\thandler info: ")
			console.log("\t\tprinciple: " + (await lendFMeHandler_1.principle()).toNumber())
			console.log("\t\tdrainedPrinciple: " + (await lendFMeHandler_1.drainedPrinciple()).toNumber())
			console.log("\ttoken balance: ")
			console.log("\t\t handler: " + (await token.balanceOf(lendFMeHandler_1.address)).toNumber())
			console.log("\t\t fund: " + (await token.balanceOf(fund)).toNumber())
			console.log("\t\t profit: " + (await token.balanceOf(profit)).toNumber())
		}

		await showResult("init with principle 100")

		// 1. send 50 
		tx = await token.mint(lendFMeHandler_1.address, 50)
		await showResult("deposit 50")

		// 2. drain, fund should get 50
		tx = await lendFMeHandler_1.drainFunds({from: admin})
		await showResult("drain, fund should get 50")

		// 3. send 60 
		tx = await token.mint(lendFMeHandler_1.address, 60)
		await showResult("deposit 60")

		// 4. drain, fund should get 50, profit should get 10
		tx = await lendFMeHandler_1.drainFunds({from: admin})
		await showResult("drain, fund should get 50")

		// 5. send 50 
		tx = await token.mint(lendFMeHandler_1.address, 50)
		await showResult("deposit 50")

		// 6. drain, profit should get 50
		tx = await lendFMeHandler_1.drainFunds({from: admin})
		await showResult("drain, fund should get 50")

	});
});

