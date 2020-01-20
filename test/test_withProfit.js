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

	const ether = async function (amount) {
		return await web3.utils.toWei(amount, "ether")
	}

	const toEther = async function (amount) {
		return await web3.utils.fromWei(amount, "ether")
	}

	it("Dispatcher", async function () {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000")
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

		// give money to defi
		tx = await token.mint(lendFMe.address, await ether("100000000"))
		tx = await token.mint(compound.address, await ether("100000000"))

		let consoleIndex = 0
		const showResult = async function (note) {
			tx = await lendFMe.makeProfitToUser(lendFMeHandler_1.address, 10)
			tx = await lendFMe.makeProfitToUser(lendFMeHandler_2.address, 10)
			tx = await compound.makeProfitToUser(compoundHandler_1.address, 10)
			consoleIndex += 1
			console.log("-------------------------------------------")
			let aaa = consoleIndex + ". " + note
			console.log(aaa)
			let a = await dispatcher.getReserveLowerLimit()
			let b = await dispatcher.getReserveUpperLimit()
			console.log("\ttarget reserve ratio: ", a/1000, "~", b/1000)
			console.log("\tcurrent reserve ratio: ", (await dispatcher.getReserveRatio())/1000)
			let reserve = await dispatcher.getReserve()
			console.log("\treserve: ", await toEther(reserve))
			let balance = await dispatcher.getBalance()
			console.log("\ttotal balance (without reserve): ", await toEther(balance))
			let principle = await dispatcher.getPrinciple()
			console.log("\ttotal principle: ", await toEther(principle))
			let totalBelongToPool = reserve.add(principle)
			let profit = await dispatcher.getProfit()
			console.log("\tGross amount: ", (await toEther(totalBelongToPool)))
			console.log("\tpool reserve: ", (await toEther(reserve)))
			console.log("\tprofit: ", await toEther(profit))
			console.log("\ttotal fund in lendFMe: ", await toEther(await token.balanceOf(lendFMe.address)))
			console.log("\ttotal fund in compound: ", await toEther(await token.balanceOf(compound.address)))
			console.log("\texecute unit: ", (await toEther(await dispatcher.getExecuteUnit())))
			console.log("\thandler info: ")
			let handlerInfo = await dispatcher.getTHStructures()
			for(let index in handlerInfo[1]) {
				let addr = handlerInfo[1][index]
				console.log("\t\thandler", addr)
				let handler = await IHandler.at(addr)
				console.log("\t\tpropotion: ", handlerInfo[0][index]/1000)
				console.log("\t\tbalance: ", await toEther(await dispatcher.getTHBalance(index)))
				console.log("\t\tprinciple: ", await toEther(await dispatcher.getTHPrinciple(index)))
				console.log("\t\tprofit: ", await toEther(await dispatcher.getTHProfit(index)))
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
		tx = await dispatcher.setReserveUpperLimit(550)
		tx = await dispatcher.setReserveLowerLimit(450)
		tx = await dispatcher.trigger()
		await showResult("set target ratio and trigger")

		// 6. add second target handler (compound handler)
		tx = await dispatcher.addTargetHandler(compoundHandler_1.address)
		targetPercentage = [700, 300]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
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
			await dispatcher.removeTargetHandler(compoundHandler_1.address, 1, { from: admin })
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
		tx = await dispatcher.removeTargetHandler(compoundHandler_1.address, 1, { from: admin })
		targetPercentage = [1000]
		tx = await dispatcher.setAimedPropotion(targetPercentage, { from: admin})
		await showResult("remove compound handler ")

		// 11. withdraw 6000
		tx = await fund.withdraw((await ether("6000")))
		await showResult("withdraw 6000")

		// 12. add compound handler
		tx = await dispatcher.addTargetHandler(compoundHandler_1.address)
		targetPercentage = [700, 300]
		tx = await dispatcher.setAimedPropotion(targetPercentage, { from: admin})
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

		tx = await dispatcher.addTargetHandler(lendFMeHandler_2.address)
		targetPercentage = [400, 500, 100]
		tx = await dispatcher.setAimedPropotion(targetPercentage, { from: admin})

		// 17. add 5000
		tx = await token.mint(fund.address, (await ether("5000")))
		await showResult("add 5000 to pool")

		// 18. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// 19. add 10000
		tx = await token.mint(fund.address, (await ether("10000")))
		await showResult("add 10000 to pool")

		// 20. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// remove handler 3, should fail
		try {
			await dispatcher.removeTargetHandler(lendFMeHandler_2.address, 2, { from: admin })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// 21. drain handler3
		tx = await dispatcher.drainFunds(2)
		await showResult("drain handler 3")

		// 22. remove handler3
		tx = await dispatcher.removeTargetHandler(lendFMeHandler_2.address, 2, { from: admin })
		// targetPercentage = [500]
		// tx = await dispatcher.setAimedPropotion(targetPercentage, { from: admin})
		await showResult("remove handler 3")

		// 23. drain compound handler
		tx = await dispatcher.drainFunds(1)
		await showResult("drain handler 2 (compound)")

		// 24. remove handler2
		tx = await dispatcher.removeTargetHandler(compoundHandler_1.address, 1, { from: admin })
		// targetPercentage = [1000]
		// tx = await dispatcher.setAimedPropotion(targetPercentage, { from: admin})
		await showResult("remove handler 2 (compound)")

		// 25. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// 26. add compound handler
		tx = await dispatcher.addTargetHandler(compoundHandler_1.address)
		targetPercentage = [700, 300]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
		await showResult("add compound handler, 70:30")

		// 27. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")

		// 28. withdraw profit
		tx = await dispatcher.withdrawProfit()
		await showResult("withdraw profit")

		// 29. update setting
		tx = await dispatcher.setReserveUpperLimit(800)
		tx = await dispatcher.setReserveLowerLimit(750)
		targetPercentage = [300, 700]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
		await showResult("update setting: reserve 75%~80%, handler 3:7")

		// 30. trigger
		tx = await dispatcher.trigger()
		await showResult("trigger")
	});
});

