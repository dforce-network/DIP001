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

contract('procedure without profit', function (accounts) {
	const admin = accounts[0]
	const profitBeneficiary = accounts[1]

	const ether = async function (amount) {
		return await web3.utils.toWei(amount, "ether")
	}

	const toEther = async function (amount) {
		return await web3.utils.fromWei(amount, "ether")
	}

	it("Dispatcher", async function () {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000", 18)
		let fund = await Fund.new(token.address)

		const balanceOf = async function (address) {
			return await toEther(await token.balanceOf(address))
		}

		let lendFMe = await LendFMe.new(token.address);
		let lendFMeHandler_1 = await LendFMeHandler.new(lendFMe.address, token.address)
		let lendFMeHandler_2 = await LendFMeHandler.new(lendFMe.address, token.address)
		let compound = await Compound.new(token.address);
		let compoundHandler_1 = await CompoundHandler.new(compound.address, token.address)

		let targetAddress = [lendFMeHandler_1.address]
		let targetPercentage = [1000]
		let dispatcher = await Dispatcher.new(token.address, fund.address, targetAddress, targetPercentage, 18)
		let dsGuard = await DSGuard.new()

		tx = await lendFMeHandler_1.setDispatcher(dispatcher.address);
		tx = await lendFMeHandler_2.setDispatcher(dispatcher.address);
		tx = await compoundHandler_1.setDispatcher(dispatcher.address);

		// set authority
		tx = await dispatcher.setAuthority(dsGuard.address, { from: admin })
		tx = await lendFMeHandler_1.setAuthority(dsGuard.address, { from: admin })
		tx = await lendFMeHandler_2.setAuthority(dsGuard.address, { from: admin })
		tx = await compoundHandler_1.setAuthority(dsGuard.address, {from: admin })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_1.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_2.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, compoundHandler_1.address, {from: admin })
		tx = await dsGuard.permitx(admin, dispatcher.address, {from: admin})
		tx = await dsGuard.permitx(admin, lendFMeHandler_1.address, {from: admin})
		tx = await dsGuard.permitx(admin, lendFMeHandler_2.address, {from: admin})
		tx = await dsGuard.permitx(admin, compoundHandler_1.address, {from: admin})

		let consoleIndex = 0
		const showResult = async function (note) {
			consoleIndex += 1
			console.log("-------------------------------------------")
			let aaa = consoleIndex + ". " + note
			console.log(aaa)
			let a = await dispatcher.getReserveLowerLimit()
			let b = await dispatcher.getReserveUpperLimit()
			console.log("\ttarget reserve ratio: ", a/1000, "~", b/1000)
			console.log("\tcurrent reserve ratio: ", (await dispatcher.getReserveRatio())/1000)
			let reserve = await dispatcher.getReserve()
			let balance = await dispatcher.getBalance()
			let total = reserve.add(balance)
			console.log("\tGross amount: ", (await toEther(total)))
			console.log("\tpool reserve: ", (await toEther(reserve)))
			console.log("\texecute unit: ", (await toEther(await dispatcher.getExecuteUnit())))
			console.log("\thandler info: ")
			let handlerInfo = await dispatcher.getTHStructures()
			for(let index in handlerInfo[1]) {
				let addr = handlerInfo[1][index]
				console.log("\t\thandler", addr)
				let handler = await IHandler.at(addr)
				console.log("\t\tpropotion: ", handlerInfo[0][index]/1000)
				console.log("\t\tbalance: ", await toEther(await handler.getBalance()))
				console.log("\t\tprinciple: ", await toEther(await handler.getPrinciple()))
				console.log("\t\tprofit: ", await toEther(await handler.getProfit()))
			}
		}

		await showResult("init")

		// 2. deposit 10000 token
		tx = await token.mint(fund.address, await ether("10000"))
		await showResult("deposit 10000 token")

		// withdraw profit, should dailed
		try {
			await dispatcher.withdrawProfit({ from: admin })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// 3. set profit beneficiary
		tx = await dispatcher.setProfitBeneficiary(profitBeneficiary)
		tx = await dispatcher.withdrawProfit({ from: admin })
		await showResult("set profit beneficiary, and withdraw profit for nothing")

		// 4. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// 5. set target ratio and trigger
		tx = await dispatcher.setReserveLowerLimit(450)
		tx = await dispatcher.setReserveUpperLimit(550)
		tx = await dispatcher.trigger()
		await showResult("set target ratio and trigger")

		// 6. add second target handler (compound handler)
		targetPercentage = [700, 300]
		tx = await dispatcher.addTargetHandler(compoundHandler_1.address, targetPercentage)
		await showResult("add new target handler, 70:30")

		// 7. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// 8. add 6000 to reserve, and trigger
		tx = await token.mint(fund.address, (await ether("6000")))
		tx = await dispatcher.trigger()
		await showResult("add 6000 to pool and trigger")

		// remove compund handler, should fail
		try {
			targetPercentage = [1000]
			tx = await dispatcher.removeTargetHandler(compoundHandler_1.address, 1, targetPercentage, { from: admin })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// 9. set profit beneficiary, and drain compound handler 
		tx = await dispatcher.setProfitBeneficiary(profitBeneficiary)
		tx = await dispatcher.drainFunds(1)
		await showResult("drain compound handler ")

		// 10. remove compound handler
		targetPercentage = [1000]
		tx = await dispatcher.removeTargetHandler(compoundHandler_1.address, 1, targetPercentage, { from: admin })
		await showResult("remove compound handler ")

		// 11. withdraw 6000
		tx = await fund.withdraw((await ether("6000")))
		await showResult("withdraw 6000")

		// 12. add compound handler
		targetPercentage = [700, 300]
		tx = await dispatcher.addTargetHandler(compoundHandler_1.address, targetPercentage)
		await showResult("add handler")

		// 13. add 10000 to reserve, and trigger
		tx = await token.mint(fund.address, (await ether("10000")))
		await showResult("add 10000 to pool")

		// 14. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// 15. withdraw 5000 
		tx = await fund.withdraw((await ether("5000")))
		await showResult("withdraw 5000")

		// 16. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// 17. add handler 3
		targetPercentage = [400, 500, 100]
		tx = await dispatcher.addTargetHandler(lendFMeHandler_2.address, targetPercentage)

		// 18. add 5000
		tx = await token.mint(fund.address, (await ether("5000")))
		await showResult("add 5000 to pool")

		// 19. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// 20. add 10000
		tx = await token.mint(fund.address, (await ether("10000")))
		await showResult("add 10000 to pool")

		// 21. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// remove handler 3, should fail
		try {
			targetPercentage = [500, 500]
			await dispatcher.removeTargetHandler(lendFMeHandler_2.address, 2, targetPercentage, { from: admin })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// 22. drain handler3
		tx = await dispatcher.drainFunds(2)
		await showResult("drain handler 3")

		// 23. remove handler3
		targetPercentage = [500, 500]
		tx = await dispatcher.removeTargetHandler(lendFMeHandler_2.address, 2, targetPercentage, { from: admin })
		await showResult("remove handler 3")

		// 24. drain compound handler
		tx = await dispatcher.drainFunds(1)
		await showResult("drain handler 2 (compound)")

		// 23. remove handler3
		targetPercentage = [1000]
		tx = await dispatcher.removeTargetHandler(compoundHandler_1.address, 1, targetPercentage, { from: admin })
		await showResult("remove handler 3 (compound)")

	});
});

