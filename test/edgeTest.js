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

contract('edge testing', function (accounts) {
	const admin = accounts[0]
	const profitBeneficiary = accounts[1]

	const ether = async function (amount) {
		return await web3.utils.toWei(amount, "ether")
	}

	const toEther = async function (amount) {
		return await web3.utils.fromWei(amount, "ether")
	}

	it("Only A target handler", async function () {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000")
		let fund = await Fund.new(token.address)

		const balanceOf = async function (address) {
			return await toEther(await token.balanceOf(address))
		}

		let lendFMe = await LendFMe.new(token.address);
		let lendFMeHandler_1 = await LendFMeHandler.new(lendFMe.address, token.address)

		let targetAddress = [lendFMeHandler_1.address]
		let targetPercentage = [1000]
		let dispatcher = await Dispatcher.new(token.address, fund.address, targetAddress, targetPercentage, 18)
		let dsGuard = await DSGuard.new()

		tx = await lendFMeHandler_1.setDispatcher(dispatcher.address);

		// set authority
		tx = await dispatcher.setAuthority(dsGuard.address, { from: admin })
		tx = await lendFMeHandler_1.setAuthority(dsGuard.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_1.address, { from: admin })
		tx = await dsGuard.permitx(admin, dispatcher.address, {from: admin})
		tx = await dsGuard.permitx(admin, lendFMeHandler_1.address, {from: admin})

		// give money to defi
		tx = await token.mint(lendFMe.address, await ether("100000000"))

		let consoleIndex = 0
		const showResult = async function (note) {
			// tx = await lendFMe.makeProfitToUser(lendFMeHandler_1.address, 10)
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

		// pool reserve 10000
		tx = await token.mint(fund.address, await ether("10000"))

		// 1. Set Target Reserve Ratio：95%~100%
		tx = await dispatcher.setReserveUpperLimit(1000)
		tx = await dispatcher.setReserveLowerLimit(950)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：95%~100%")

		// 2. Set Target Reserve Ratio：0%~5%
		tx = await dispatcher.setReserveLowerLimit(0)
		tx = await dispatcher.setReserveUpperLimit(50)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：0%~5%")

		// 3. Set Target Reserve Ratio：10%~90%
		tx = await dispatcher.setReserveUpperLimit(900)
		tx = await dispatcher.setReserveLowerLimit(100)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：10%~90%")

		// 4. Set Target Reserve Ratio：95.6%~100%
		tx = await dispatcher.setReserveUpperLimit(1000)
		tx = await dispatcher.setReserveLowerLimit(956)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：95.6%~100%")
	});

	it("A/B target handler", async function () {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000")
		let fund = await Fund.new(token.address)

		const balanceOf = async function (address) {
			return await toEther(await token.balanceOf(address))
		}

		let lendFMe = await LendFMe.new(token.address);
		let lendFMeHandler_1 = await LendFMeHandler.new(lendFMe.address, token.address)
		let lendFMeHandler_2 = await LendFMeHandler.new(lendFMe.address, token.address)

		let targetAddress = [lendFMeHandler_1.address, lendFMeHandler_2.address]
		let targetPercentage = [0, 1000]
		let dispatcher = await Dispatcher.new(token.address, fund.address, targetAddress, targetPercentage, 18)
		let dsGuard = await DSGuard.new()

		tx = await lendFMeHandler_1.setDispatcher(dispatcher.address);
		tx = await lendFMeHandler_2.setDispatcher(dispatcher.address);

		// set authority
		tx = await dispatcher.setAuthority(dsGuard.address, { from: admin })
		tx = await lendFMeHandler_1.setAuthority(dsGuard.address, { from: admin })
		tx = await lendFMeHandler_2.setAuthority(dsGuard.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_1.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_2.address, { from: admin })
		tx = await dsGuard.permitx(admin, dispatcher.address, {from: admin})
		tx = await dsGuard.permitx(admin, lendFMeHandler_1.address, {from: admin})
		tx = await dsGuard.permitx(admin, lendFMeHandler_2.address, {from: admin})

		// give money to defi
		tx = await token.mint(lendFMe.address, await ether("100000000"))

		let consoleIndex = 0
		const showResult = async function (note) {
			// tx = await lendFMe.makeProfitToUser(lendFMeHandler_1.address, 10)
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

		// pool reserve 10000
		tx = await token.mint(fund.address, await ether("10000"))

		// 1. Set Target Reserve Ratio：95%~100%
		tx = await dispatcher.setReserveUpperLimit(1000)
		tx = await dispatcher.setReserveLowerLimit(950)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：95%~100%")

		// 2. Set Target Reserve Ratio：0%~5%
		tx = await dispatcher.setReserveLowerLimit(0)
		tx = await dispatcher.setReserveUpperLimit(50)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：0%~5%")

		// 3. Set Target Reserve Ratio：10%~90%, handler ratio: 0.5%, 99.5%
		tx = await dispatcher.setReserveUpperLimit(900)
		tx = await dispatcher.setReserveLowerLimit(100)
		targetPercentage = [5, 995]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：10%~90%, handler ratio: 0.5%, 99.5%")

		// 4. Set Target Reserve Ratio：0%~0.5%, handler ratio: 0.5%, 99.5%
		tx = await dispatcher.setReserveLowerLimit(0)
		tx = await dispatcher.setReserveUpperLimit(5)
		targetPercentage = [5, 995]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：10%~90%, handler ratio: 0.5%, 99.5%")

		// 5. Set Target Reserve Ratio：95.6%~100%, handler ratio: 30%, 70%
		tx = await dispatcher.setReserveUpperLimit(1000)
		tx = await dispatcher.setReserveLowerLimit(956)
		targetPercentage = [300, 700]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：95.6%~100%, handler ratio: 30%, 70%")
	});

	it("A/B/C target handler", async function () {
		let tx
		let token = await DSToken.new("0x444600000000000000000000000000")
		let fund = await Fund.new(token.address)

		const balanceOf = async function (address) {
			return await toEther(await token.balanceOf(address))
		}

		let lendFMe = await LendFMe.new(token.address);
		let lendFMeHandler_1 = await LendFMeHandler.new(lendFMe.address, token.address)
		let lendFMeHandler_2 = await LendFMeHandler.new(lendFMe.address, token.address)
		let lendFMeHandler_3 = await LendFMeHandler.new(lendFMe.address, token.address)

		let targetAddress = [lendFMeHandler_1.address, lendFMeHandler_2.address, lendFMeHandler_3.address]
		let targetPercentage = [0, 0, 1000]
		let dispatcher = await Dispatcher.new(token.address, fund.address, targetAddress, targetPercentage, 18)
		let dsGuard = await DSGuard.new()

		tx = await lendFMeHandler_1.setDispatcher(dispatcher.address);
		tx = await lendFMeHandler_2.setDispatcher(dispatcher.address);
		tx = await lendFMeHandler_3.setDispatcher(dispatcher.address);

		// set authority
		tx = await dispatcher.setAuthority(dsGuard.address, { from: admin })
		tx = await lendFMeHandler_1.setAuthority(dsGuard.address, { from: admin })
		tx = await lendFMeHandler_2.setAuthority(dsGuard.address, { from: admin })
		tx = await lendFMeHandler_3.setAuthority(dsGuard.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_1.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_2.address, { from: admin })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_3.address, { from: admin })
		tx = await dsGuard.permitx(admin, dispatcher.address, {from: admin})
		tx = await dsGuard.permitx(admin, lendFMeHandler_1.address, {from: admin})
		tx = await dsGuard.permitx(admin, lendFMeHandler_2.address, {from: admin})
		tx = await dsGuard.permitx(admin, lendFMeHandler_3.address, {from: admin})

		// give money to defi
		tx = await token.mint(lendFMe.address, await ether("100000000"))

		let consoleIndex = 0
		const showResult = async function (note) {
			// tx = await lendFMe.makeProfitToUser(lendFMeHandler_1.address, 10)
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

		// pool reserve 10000
		tx = await token.mint(fund.address, await ether("10000"))

		// 1. Set Target Reserve Ratio：95%~100%
		tx = await dispatcher.setReserveUpperLimit(1000)
		tx = await dispatcher.setReserveLowerLimit(950)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：95%~100%")

		// 2. Set Target Reserve Ratio：0%~5%
		tx = await dispatcher.setReserveLowerLimit(0)
		tx = await dispatcher.setReserveUpperLimit(50)
		targetPercentage = [0, 100, 900]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：0%~5%")

		// 3. Set Target Reserve Ratio：10%~90%
		tx = await dispatcher.setReserveUpperLimit(900)
		tx = await dispatcher.setReserveLowerLimit(100)
		targetPercentage = [100, 253, 647]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：10%~90%, handler: 10, 25.3, 64.7")

		// 4. Set Target Reserve Ratio：0%~0.5%
		tx = await dispatcher.setReserveLowerLimit(0)
		tx = await dispatcher.setReserveUpperLimit(5)
		targetPercentage = [102, 251, 647]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：0%~0.5%, handler: 10.2, 25.1, 64.7")

		// 5. Set Target Reserve Ratio：95.6%~100%, handler ratio: 30%, 70%
		tx = await dispatcher.setReserveUpperLimit(1000)
		tx = await dispatcher.setReserveLowerLimit(956)
		targetPercentage = [300, 400, 300]
		tx = await dispatcher.setAimedPropotion(targetPercentage)
		tx = await dispatcher.trigger()
		await showResult("Set Target Reserve Ratio：95.6%~100%, handler ratio: 30%, 40%, 70%")
	});
});

