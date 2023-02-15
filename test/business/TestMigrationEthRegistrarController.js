const MID = artifacts.require('./registry/MIDRegistry');
const PublicResolver = artifacts.require('./resolvers/PublicResolver');
const BaseRegistrar = artifacts.require('./BaseRegistrarImplementation');
const MIDRegistrarMigrationController = artifacts.require('./MIDRegistrarMigrationController');
const DummyOracle = artifacts.require('./DummyOracle');
const DummySourceBaseRegistrar = artifacts.require('./DummySourceBaseRegistrar');
const DummySourceRegistry = artifacts.require('./DummySourceRegistry');
const StablePriceOracle = artifacts.require('./StablePriceOracle');
const { expect, assert } = require("chai");
const namehash = require('eth-ens-namehash');
const sha3 = require('web3-utils').sha3;
const toBN = require('web3-utils').toBN;

const DAYS = 24 * 60 * 60;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const checkLabels = {
    "testing": true,
    "longname12345678": true,
    "sixsix": true,
    "five5": true,
    "four": true,
    "iii": true,
    "ii": true,
    "i": false,
    "": false,

    // { ni } { hao } { ma } (chinese; simplified)
    "\u4f60\u597d\u5417": true,

    // { ta } { ko } (japanese; hiragana)
    "\u305f\u3053": true,

    // { poop } { poop } { poop } (emoji)
    "\ud83d\udca9\ud83d\udca9\ud83d\udca9": true,

    // { poop } { poop } (emoji)
    "\ud83d\udca9\ud83d\udca9": true
};


contract('MIDRegistrarMigrationController', function (accounts) {
    let mid;
    let resolver;
    let baseRegistrar;
    let sourceRegistry;
    let sourceBaseRegistrar;
    let controller;
    let priceOracle;
    let treasury = accounts[10];

    const ownerAccount = accounts[0]; // Account that owns the registrar
    const oraclePrices = [1000, 100, 50, 10, 1]

    before(async () => {
        mid = await MID.new();
        baseRegistrar = await BaseRegistrar.new(mid.address, namehash.hash('bnb'), {from: ownerAccount});
		await baseRegistrar.setMaxMintPerUser(3); // test the balance cap along the way
        await mid.setSubnodeOwner('0x0', sha3('bnb'), baseRegistrar.address);

        sourceRegistry = await DummySourceRegistry.new();
        sourceBaseRegistrar = await DummySourceBaseRegistrar.new();

        const dummyOracle = await DummyOracle.new(toBN(100000000));
        // length 1 to 5, $1000 to $1
        priceOracle = await StablePriceOracle.new(dummyOracle.address, oraclePrices);
		const ts = (await web3.eth.getBlock('latest')).timestamp;

        controller = await MIDRegistrarMigrationController.new(
            baseRegistrar.address,
            priceOracle.address,
            sourceRegistry.address,
            sourceBaseRegistrar.address,
            treasury,
            ts,
            ts + 86400,
            [50, 60, 70, 80, 90],
            {from: ownerAccount}
        );
        await baseRegistrar.addController(controller.address, {from: ownerAccount});
        // add owner account as controller so we can directly register
        await baseRegistrar.addController(ownerAccount); 

        resolver = await PublicResolver.new(mid.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS);
    });

    it('setters check', async () => {
        // only check
        await expect(controller.setDiscountPercentages([1, 1, 1, 1, 1], {from: accounts[1]})).to.be.revertedWith(
			'Ownable: caller is not the owner',
		);
        await expect(controller.setDurationRoundUpUnit(100, {from: accounts[1]})).to.be.revertedWith(
			'Ownable: caller is not the owner',
		);
        await expect(controller.setPriceOracle(accounts[0], {from: accounts[1]})).to.be.revertedWith(
			'Ownable: caller is not the owner',
		);
        await expect(controller.setActivePeriod(100, 1000, {from: accounts[1]})).to.be.revertedWith(
			'Ownable: caller is not the owner',
		);
        await expect(controller.setTreasury(ZERO_ADDRESS, {from: accounts[1]})).to.be.revertedWith(
			'Ownable: caller is not the owner',
		);
        // value check
        await expect(controller.setDiscountPercentages([])).to.be.revertedWith(
			'empty discount percentages',
		);
        await expect(controller.setDurationRoundUpUnit(0)).to.be.revertedWith(
			'invalid roundup unit',
		);
        await expect(controller.setPriceOracle(ZERO_ADDRESS)).to.be.revertedWith(
			'invalid address',
		);
        await expect(controller.setActivePeriod(10, 1)).to.be.revertedWith(
			'invalid period',
		);
    })

    it('migrated duration will be rounded up according the roundup unit', async () => {
        const tokenId = sha3("newname");
		let currentTime = (await web3.eth.getBlock('latest')).timestamp;
        let sourceExpiry = currentTime + 86400;

        await sourceBaseRegistrar.setNameExpires(tokenId, sourceExpiry); 
        await controller.setDurationRoundUpUnit(86400 * 30); // 1 month
        let actualDuration = await controller.migratedDuration(tokenId)
        assert.equal(actualDuration, 86400 * 30)

        await controller.setDurationRoundUpUnit(86400 * 100); // 100 days
        actualDuration = await controller.migratedDuration(tokenId)
        assert.equal(actualDuration, 86400 * 100)

		currentTime = (await web3.eth.getBlock('latest')).timestamp;
        sourceExpiry = currentTime + 86400 * 202; // 2 roundup units + 2 days
        await sourceBaseRegistrar.setNameExpires(tokenId, sourceExpiry); 
        actualDuration = await controller.migratedDuration(tokenId)
        assert.equal(actualDuration, 86400 * 300) // 3 units

        await controller.setDurationRoundUpUnit(86400 * 30);
        actualDuration = await controller.migratedDuration(tokenId)
        assert.equal(actualDuration, 86400 * 30 * 7) // 3 units

        await controller.setDurationRoundUpUnit(86400 * 3000); 
        actualDuration = await controller.migratedDuration(tokenId)
        assert.equal(actualDuration, 86400 * 3000)
    })

    it('should report label validity', async () => {
        for (const label in checkLabels) {
            assert.equal(await controller.valid(label), checkLabels[label], label);
        }
    });


    it('should report unused names as available', async () => {
        assert.equal(await controller.available(sha3('available')), true);
    });

    it('node hash test', async () => {
        assert.equal(await controller.nodeHashByLabel('hhhh'), namehash.hash('hhhh.bnb'));
        assert.equal(await controller.nodeHashByLabel('ssss'), namehash.hash('ssss.bnb'));
        assert.equal(await controller.nodeHashByLabel('123123'), namehash.hash('123123.bnb'));
    })

    it('rent price with discount', async () => {
        let cost = await controller.rentPriceWithDuration('good', 86400);
        assert.equal(cost, oraclePrices[4 - 1] * 86400 * 0.8)

        cost = await controller.rentPriceWithDuration('asdadasd', 86400);
        assert.equal(cost, oraclePrices[4] * 86400 * 0.9)

        cost = await controller.rentPriceWithDuration('god', 86400);
        assert.equal(cost, oraclePrices[3 - 1] * 86400 * 0.7)
    })

    it('migrations precheck', async () => {
        const balanceBefore = await web3.eth.getBalance(controller.address);
        
        // precheck
		let ts = (await web3.eth.getBlock('latest')).timestamp;
        await controller.setActivePeriod(100, ts - 1)
        await expect(controller.migrateWithResolver("newname", ownerAccount, resolver.address, {value: 0})).to.be.revertedWith(
			'migration not available',
		);

        await controller.setActivePeriod(ts - 10, ts + 10)
        await expect(controller.migrateWithResolver("newname", ownerAccount, resolver.address, {value: 0})).to.be.revertedWith(
			'not the source name owner',
		);

        await sourceRegistry.setOwner(namehash.hash("newname.bnb"), ownerAccount);
        await sourceBaseRegistrar.setNameExpires(sha3("newname"), ts - 1); 
        await expect(controller.migrateWithResolver("newname", ownerAccount, resolver.address, {value: 0, from: ownerAccount})).to.be.revertedWith(
			'source token might be expired',
		);
        
        await sourceBaseRegistrar.setNameExpires(sha3("newname"), ts + 100); 
        await expect(controller.migrateWithResolver("newname", ownerAccount, ZERO_ADDRESS, {value: 0})).to.be.revertedWith(
			'empty resolver',
		);
    });

    it('should permit migrations with discount', async () => {
        const treasuryBalanceBefore = await web3.eth.getBalance(treasury);

        // prepare a valid env
		let ts = (await web3.eth.getBlock('latest')).timestamp;
        await controller.setActivePeriod(ts - 10, ts + 10)
        await controller.setDurationRoundUpUnit(86400);

        await sourceRegistry.setOwner(namehash.hash("great.bnb"), ownerAccount);
        let expiry = ts + 100
        await sourceBaseRegistrar.setNameExpires(sha3("great"), expiry); 

        await expect(controller.migrateWithResolver("great", ownerAccount, resolver.address, {value: 0})).to.be.revertedWith('insufficient payment')
        
        const duration = expiry - (await web3.eth.getBlock('latest')).timestamp;
        const newDuration = Math.ceil(duration / 86400) * 86400
        const cost = oraclePrices[4] * newDuration * 0.9 // manual calculation
        
        const tx = await controller.migrateWithResolver("great", ownerAccount, resolver.address, {value: cost})
        const newExpiry = (await web3.eth.getBlock('latest')).timestamp + newDuration
        
        assert.equal(tx.logs[0].event, 'Migrated');
        assert.equal(tx.logs[0].args.labelname, 'great');
        assert.equal(tx.logs[0].args.account, ownerAccount);
        assert.equal(tx.logs[0].args.cost, cost);
		ts = (await web3.eth.getBlock('latest')).timestamp;
        assert.equal(tx.logs[0].args.expiry, newExpiry);

        assert.equal(tx.logs[1].event, 'NameRegistered');
        assert.equal(tx.logs[1].args.label, sha3('great'));
        assert.equal(tx.logs[1].args.owner, ownerAccount);
        assert.equal(tx.logs[1].args.expires, newExpiry);
        assert.equal(tx.logs[1].args.cost, cost);

        const nodehash = namehash.hash("great.bnb");
        assert.equal((await mid.resolver(nodehash)), resolver.address);
        assert.equal((await mid.owner(nodehash)), ownerAccount);
        assert.equal((await resolver.addr(nodehash)), ownerAccount);
        assert.equal(toBN(await web3.eth.getBalance(treasury)).sub(toBN(treasuryBalanceBefore)).toNumber(), cost);

        await expect(controller.migrateWithResolver("great", ownerAccount, resolver.address, {value: 0}))
            .to.be.revertedWith('name already migrated')
    })
    
    it('should report registered names as unavailable', async () => {
        assert.equal(await controller.available('great'), false);
    });

    it('should allow the migration contract owner to withdraw funds', async () => {
        await controller.withdraw({from: ownerAccount});
        assert.equal(await web3.eth.getBalance(controller.address), 0);
    });
});
