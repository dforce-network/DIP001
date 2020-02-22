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

contract('authority check', function (accounts) {
	const owner1 = accounts[0]
	const owner2 = accounts[1]
	const admin1 = accounts[2]
	const admin2 = accounts[3]
	const user1  = accounts[4]
	const user2  = accounts[5]
	const profitBeneficiary = accounts[6]

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
		tx = await dispatcher.setAuthority(dsGuard.address, { from: owner1 })
		tx = await lendFMeHandler_1.setAuthority(dsGuard.address, { from: owner1 })
		tx = await lendFMeHandler_2.setAuthority(dsGuard.address, { from: owner1 })
		tx = await compoundHandler_1.setAuthority(dsGuard.address, {from: owner1 })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_1.address, { from: owner1 })
		tx = await dsGuard.permitx(dispatcher.address, lendFMeHandler_2.address, { from: owner1 })
		tx = await dsGuard.permitx(dispatcher.address, compoundHandler_1.address, {from: owner1 })
		tx = await dsGuard.permitx(owner1, dispatcher.address, {from: owner1})
		tx = await dsGuard.permitx(owner1, lendFMeHandler_1.address, {from: owner1})
		tx = await dsGuard.permitx(owner1, lendFMeHandler_2.address, {from: owner1})
		tx = await dsGuard.permitx(owner1, compoundHandler_1.address, {from: owner1})

		// give money to defi
		tx = await token.mint(lendFMe.address, await ether("100000000"))
		tx = await token.mint(compound.address, await ether("100000000"))

		// should fail if user change owner
		try {
			await dispatcher.transferOwnership(user1, { from: user1 })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user add admin
		try {
			await dsGuard.permitx(user1, dispatcher.address, { from: user1 })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user delete admin
		try {
			await dsGuard.forbidx(owner1, dispatcher.address, { from: user1 })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user add targetHandler
		targetPercentage = [700, 300]
		try {
			await dispatcher.addTargetHandler(compoundHandler_1.address, targetPercentage, {from: user1})
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}
		tx = await dispatcher.addTargetHandler(compoundHandler_1.address, targetPercentage, {from: owner1})


		// should fail if user remove targetHandler
		try {
			targetPercentage = [1000]
			await dispatcher.removeTargetHandler(compoundHandler_1.address, 1, targetPercentage, {from: user1})
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user withdraw profit
		tx = await dispatcher.setProfitBeneficiary(profitBeneficiary)
		try {
			tx = await dispatcher.withdrawProfit({ from: user1 })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user withdraw principle
		tx = await dispatcher.setProfitBeneficiary(profitBeneficiary)
		try {
			tx = await dispatcher.drainFunds(1, { from: user1 })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user set aimed propotion
		targetPercentage = [700, 300]
		try {
			tx = await dispatcher.setAimedPropotion(targetPercentage, { from: user1 })
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user setReserveUpperLimit
		try {
			tx = await dispatcher.setReserveUpperLimit(550, {from: user1})
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user setReserveLowerLimit
		try {
			tx = await dispatcher.setReserveLowerLimit(250, {from: user1})
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user set execute unit
		try {
			tx = await dispatcher.setExecuteUnit(100, {from: user1})
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}

		// should fail if user set profit beneficiary
		try {
			tx = await dispatcher.setProfitBeneficiary(user1, {from : user1})
			assert.fail('Expected revert not received');
		} catch (error) {
			const revertFound = error.message.search('revert') >= 0;
			assert(revertFound, `Expected "revert", got ${error} instead`)
		}
	});
});

