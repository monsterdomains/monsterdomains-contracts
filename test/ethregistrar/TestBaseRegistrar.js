const MID = artifacts.require('./registry/MIDRegistry');
const BaseRegistrar = artifacts.require('./registrar/BaseRegistrarImplementation');

const namehash = require('eth-ens-namehash');
const sha3 = require('web3-utils').sha3;
const toBN = require('web3-utils').toBN;

const { evm, exceptions } = require("../test-utils");
const { expect } = require('chai');


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

contract('BaseRegistrar', function (accounts) {
	const ownerAccount = accounts[0];
	const controllerAccount = accounts[1];
	const registrantAccount = accounts[2];
	const otherAccount = accounts[3];
	const anotherAccount = accounts[4];

	let mid;
	let registrar;

	before(async () => {
		mid = await MID.new();

		registrar = await BaseRegistrar.new(mid.address, namehash.hash('bnb'), {from: ownerAccount});
		await registrar.setMaxMintPerUser(10);
		await registrar.addController(controllerAccount, {from: ownerAccount});
		await mid.setSubnodeOwner('0x0', sha3('bnb'), registrar.address);
	});

	it('global pause', async () => {
		await registrar.pause()
		await expect(registrar.pause()).to.be.revertedWith('Pausable: paused')

		await expect(
			registrar.register(sha3("areyoualive"), registrantAccount, 86400, {from: controllerAccount})
		).to.be.revertedWith('Pausable: paused')
		await expect(
			registrar.renew(sha3("areyoualive"), 86400, {from: controllerAccount})
		).to.be.revertedWith('Pausable: paused')

		await registrar.unpause()
		// OK
		await registrar.register(sha3("areyoualive"), registrantAccount, 86400, {from: controllerAccount});

	})

	it('should allow new registrations', async () => {
		const tx = await registrar.register(sha3("newname"), registrantAccount, 86400, {from: controllerAccount});
		const block = await web3.eth.getBlock(tx.receipt.blockHash);
		assert.equal(await mid.owner(namehash.hash("newname.bnb")), registrantAccount);
		assert.equal(await registrar.ownerOf(sha3("newname")), registrantAccount);
		assert.equal((await registrar.nameExpires(sha3("newname"))).toNumber(), block.timestamp + 86400);
	});

	it('should allow registrations without updating the registry', async () => {
		const tx = await registrar.registerOnly(sha3("silentname"), registrantAccount, 86400, {from: controllerAccount});
		const block = await web3.eth.getBlock(tx.receipt.blockHash);
		assert.equal(await mid.owner(namehash.hash("silentname.bnb")), ZERO_ADDRESS);
		assert.equal(await registrar.ownerOf(sha3("silentname")), registrantAccount);
		assert.equal((await registrar.nameExpires(sha3("silentname"))).toNumber(), block.timestamp + 86400);
	});

	it('should allow renewals', async () => {
		const oldExpires = await registrar.nameExpires(sha3("newname"));
		await registrar.renew(sha3("newname"), 86400, {from: controllerAccount});
		assert.equal((await registrar.nameExpires(sha3("newname"))).toNumber(), oldExpires.add(toBN(86400)).toNumber());
	});

	it('should only allow the controller to register', async () => {
		await exceptions.expectFailure(registrar.register(sha3("foo"), otherAccount, 86400, {from: otherAccount}));
	});

	it('should only allow the controller to renew', async () => {
		await exceptions.expectFailure(registrar.renew(sha3("newname"), 86400, {from: otherAccount}));
	});

	it('should not permit registration of already registered names', async () => {
		await exceptions.expectFailure(registrar.register(sha3("newname"), otherAccount, 86400, {from: controllerAccount}));
		assert.equal(await registrar.ownerOf(sha3("newname")), registrantAccount);
	});

	it('should not permit renewing a name that is not registered', async () => {
		await exceptions.expectFailure(registrar.renew(sha3("name3"), 86400, {from: controllerAccount}));
	});

	it('should permit the owner to reclaim a name', async () => {
		await mid.setSubnodeOwner(ZERO_HASH, sha3("bnb"), accounts[0]);
		await mid.setSubnodeOwner(namehash.hash("bnb"), sha3("newname"), ZERO_ADDRESS);
		assert.equal(await mid.owner(namehash.hash("newname.bnb")), ZERO_ADDRESS);
		await mid.setSubnodeOwner(ZERO_HASH, sha3("bnb"), registrar.address);
		await registrar.reclaim(sha3("newname"), registrantAccount, {from: registrantAccount});
		assert.equal(await mid.owner(namehash.hash("newname.bnb")), registrantAccount);
	});

	it('should prohibit anyone else from reclaiming a name', async () => {
		await exceptions.expectFailure(registrar.reclaim(sha3("newname"), registrantAccount, {from: otherAccount}));
	});

	// after a successful transfer, the owner of the node will also be transferred
	it('should permit the owner to transfer a registration', async () => {
		await registrar.transferFrom(registrantAccount, otherAccount, sha3("newname"), {from: registrantAccount});
		assert.equal((await registrar.ownerOf(sha3("newname"))), otherAccount);
		// Transfer does not update MID without a call to reclaim.
		assert.equal(await mid.owner(namehash.hash("newname.bnb")), otherAccount);
		await registrar.transferFrom(otherAccount, registrantAccount, sha3("newname"), {from: otherAccount});
	});

	it('should prohibit anyone else from transferring a registration', async () => {
		await exceptions.expectFailure(registrar.transferFrom(otherAccount, otherAccount, sha3("newname"), {from: otherAccount}));
	});

	it('should not permit transfer or reclaim during the grace period', async () => {
		// Advance to the grace period
		const ts = (await web3.eth.getBlock('latest')).timestamp;
		await evm.advanceTime((await registrar.nameExpires(sha3("newname"))).toNumber() - ts + 3600);
		await evm.mine()
		await exceptions.expectFailure(registrar.transferFrom(registrantAccount, otherAccount, sha3("newname"), {from: registrantAccount}));
		await exceptions.expectFailure(registrar.reclaim(sha3("newname"), registrantAccount, {from: registrantAccount}));
	});

	it('should allow renewal during the grace period', async () => {
		await registrar.renew(sha3("newname"), 86400, {from: controllerAccount});
	});

	it('should allow registration of an expired domain', async () => {
		const ts = (await web3.eth.getBlock('latest')).timestamp;
		const expires = await registrar.nameExpires(sha3("newname"));
		const grace = await registrar.gracePeriod();
		await evm.advanceTime(expires.toNumber() - ts + grace.toNumber() + 3600);

		try {
			await registrar.ownerOf(sha3("newname"));
			assert.fail("should throw an exception");
		} catch(error) {}

		await registrar.register(sha3("newname"), otherAccount, 86400, {from: controllerAccount});
		assert.equal(await registrar.ownerOf(sha3("newname")), otherAccount);
	});

	it('should allow the owner to set a resolver address', async () => {
		await registrar.setResolver(accounts[1], {from: ownerAccount});
		assert.equal(await mid.resolver(namehash.hash('bnb')), accounts[1]);
	});

	it('should limit the counts of domains held by users', async () => {
		// only owner can set the cap
		await expect(registrar.setMaxMintPerUser(1, {from: accounts[1]})).to.be.revertedWith(
			'Ownable: caller is not the owner',
		);
		await registrar.setMaxMintPerUser(2, {from: ownerAccount})
		await registrar.register(sha3("newname11"), anotherAccount, 86400, {from: controllerAccount});
		await registrar.register(sha3("newname22"), anotherAccount, 86400, {from: controllerAccount});
		await expect(registrar.register(sha3("newname33"), anotherAccount, 86400, {from: controllerAccount})).to.be.revertedWith(
			'balance exceeds cap',
		);
		await registrar.register(sha3("newname333"), otherAccount, 86400, {from: controllerAccount});
		
		// transfer should be prevented as well
		await expect(registrar.transferFrom(otherAccount, anotherAccount, sha3("newname333"), {from: otherAccount})).to.be.revertedWith(
			'balance exceeds cap',
		);
		await registrar.transferFrom(anotherAccount, controllerAccount, sha3("newname11"), {from: anotherAccount})
		await registrar.transferFrom(otherAccount, anotherAccount, sha3("newname333"), {from: otherAccount}) // ok
	});

	it('test token id reservation', async function () {
		// only owner can add reserved id
		await expect(registrar.addReservedTokenId([sha3("reservedname1"), sha3("reservedname2")], {from: anotherAccount})).to.be.revertedWith(
			'Ownable: caller is not the owner',
		);

		await registrar.addReservedTokenId([sha3("reservedname1"), sha3("reservedname2")]);
		await expect(registrar.register(sha3("reservedname1"), otherAccount, 86400, {from: controllerAccount})).to.be.revertedWith(
			'reserved token id',
		);
		await expect(registrar.register(sha3("reservedname2"), otherAccount, 86400, {from: controllerAccount})).to.be.revertedWith(
			'reserved token id',
		);
		// non-reserved id can still be registered
		await registrar.register(sha3("non_reserved_name"), otherAccount, 86400, {from: controllerAccount})

		await registrar.setReservedIDRegistrar(anotherAccount);
		registrar.register(sha3("reservedname1"), otherAccount, 86400, {from: anotherAccount})
		registrar.register(sha3("reservedname2"), otherAccount, 86400, {from: anotherAccount})
			
	})
});
