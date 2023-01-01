const MID = artifacts.require('./registry/MIDRegistry');
const PublicResolver = artifacts.require('./resolvers/PublicResolver');
const BaseRegistrar = artifacts.require('./BaseRegistrarImplementation');
const MIDRegistrarController = artifacts.require('./MIDRegistrarController');
const DummyOracle = artifacts.require('./DummyOracle');
const StablePriceOracle = artifacts.require('./StablePriceOracle');
const BulkRenewal = artifacts.require('./BulkRenewal');
const NameWrapper = artifacts.require('DummyNameWrapper.sol');

const { Interface } = require('@ethersproject/abi');
const { makeInterfaceId } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const namehash = require('eth-ens-namehash');
const { deployments } = require('hardhat');
const sha3 = require('web3-utils').sha3;
const toBN = require('web3-utils').toBN;	
const { exceptions, evm } = require("../test-utils");
const { NULL_ADDRESS } = require('../test-utils/address');

const BNB_LABEL = sha3('bnb');
const MID_NAMEHASH = namehash.hash('bnb');
const DAYS = 86400;

function computeInterfaceId(iface) {
	return makeInterfaceId.ERC165(
	  Object.values(iface.functions).map((frag) => frag.format('sighash')),
	)
}
  

contract('BulkRenewal', function (accounts) {
	let mid;
	let resolver;
	let baseRegistrar;
	let controller;
	let priceOracle;
	let bulkRenewal;
	let nameWrapper;

	const secret = "0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";
	const ownerAccount = accounts[0]; // Account that owns the registrar
	const registrantAccount = accounts[1]; // Account that owns test names

	before(async () => {
		// Create a registry
		mid = await MID.new();
		nameWrapper = await NameWrapper.new();
		// Create a public resolver
		resolver = await PublicResolver.new(mid.address, nameWrapper.address, NULL_ADDRESS, NULL_ADDRESS);

		// Create a base registrar
		baseRegistrar = await BaseRegistrar.new(mid.address, namehash.hash('bnb'), {from: ownerAccount});
		await baseRegistrar.setMaxMintPerUser(10);

		// Set up a dummy price oracle and a controller
		const dummyOracle = await DummyOracle.new(toBN(100000000));
		priceOracle = await StablePriceOracle.new(dummyOracle.address, [5, 4, 3, 2, 2]);
		controller = await MIDRegistrarController.new(
			baseRegistrar.address,
			priceOracle.address,
			600,
			86400,
			{from: ownerAccount});
		await baseRegistrar.addController(controller.address, {from: ownerAccount});
		await baseRegistrar.addController(ownerAccount, {from: ownerAccount});
		// Create the bulk registration contract
		bulkRenewal = await BulkRenewal.new(mid.address, controller.address);

		// Configure a resolver for .bnb and register the controller interface
		// then transfer the .bnb node to the base registrar.
		await mid.setSubnodeRecord('0x0', BNB_LABEL, ownerAccount, resolver.address, 0);
		await mid.setOwner(MID_NAMEHASH, baseRegistrar.address);

		// Register some names
		for(const name of ['test1', 'test2', 'test3']) {
			await baseRegistrar.register(sha3(name), registrantAccount, 31536000);
		}
	});

	it('should return the cost of a bulk renewal', async () => {
		assert.equal(await bulkRenewal.rentPrice(['test1', 'test2'], 86400), 86400 * 2 * 2);
		assert.equal(await bulkRenewal.rentPrices(['test1', 'test2'], [86400, 86400 / 2]), (86400 + 86400 / 2) * 2);
	});

	it('should raise an error trying to renew a nonexistent name', async () => {
		await exceptions.expectFailure(bulkRenewal.renewAll(['foobar'], 86400));
	})

	it('should permit bulk renewal of names', async () => {
		const oldExpiry = await baseRegistrar.nameExpires(sha3('test2'));
		const tx = await bulkRenewal.renewAll(['test1', 'test2'], 86400, {value: 86401 * 2 * 2});
		assert.equal(tx.receipt.status, true);
		const newExpiry = await baseRegistrar.nameExpires(sha3('test2'));
		assert.equal(newExpiry - oldExpiry, 86400);
		// Check any excess funds are returned
		assert.equal(await web3.eth.getBalance(bulkRenewal.address), 0);
	});

	it('should revert when bulk register 0 names or name length mismatch', async () => {
		await expect(bulkRenewal.batchCommit([])).to.be.revertedWith(
			'commitment count 0',
		);
		await expect(bulkRenewal.batchRegisterWithConfig([], 
			registrantAccount, [0], secret,
			NULL_ADDRESS, NULL_ADDRESS
		)).to.be.revertedWith(
			'name count 0',
		);
		await expect(bulkRenewal.batchRegisterWithConfig([
			'namename'
		], registrantAccount, [10, 10], secret, NULL_ADDRESS, NULL_ADDRESS)).to.be.revertedWith(
			'length mismatch'
		)
	})

	it('should register bulk domain names', async () => {
		const commitments = await bulkRenewal.makeBatchCommitmentWithConfig([
			"newname",
			"zoo"
		], 
			registrantAccount, secret, 
			NULL_ADDRESS, NULL_ADDRESS
		);
        let tx = await bulkRenewal.batchCommit(commitments);
        assert.equal(await controller.commitments(commitments[0]), (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp);
        assert.equal(await controller.commitments(commitments[1]), (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp);

        await evm.advanceTime((await controller.minCommitmentAge()).toNumber());
        const balanceBefore = await web3.eth.getBalance(controller.address);
        tx = await bulkRenewal.batchRegisterWithConfig([
			"newname", // price 2
			"zoo" // price 3
		], registrantAccount, 
		[28 * DAYS, 88 * DAYS], secret,
			NULL_ADDRESS, NULL_ADDRESS,
			{value: (2 * 28 + 3 * 88) * DAYS + 1});

        assert.equal((await web3.eth.getBalance(controller.address)) - balanceBefore, (2 * 28 + 3 * 88) * DAYS);

	});
});
