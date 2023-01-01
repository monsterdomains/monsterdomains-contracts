const MID = artifacts.require('./registry/MIDRegistry');
const BaseRegistrar = artifacts.require('./BaseRegistrarImplementation');
const DummyOracle = artifacts.require('./DummyOracle');
const StablePriceOracle = artifacts.require('./StablePriceOracle');

const { expect } = require('chai');
const namehash = require('eth-ens-namehash');
const sha3 = require('web3-utils').sha3;
const toBN = require('web3-utils').toBN;

contract('StablePriceOracle', function (accounts) {
    let priceOracle;

    before(async () => {
        mid = await MID.new();
        registrar = await BaseRegistrar.new(mid.address, namehash.hash('eth'));
        await registrar.setMaxMintPerUser(10);

        // Dummy oracle with 1 ETH == 10 USD
        var dummyOracle = await DummyOracle.new(toBN(1000000000));
        // 4 attousd per second for 3 character names, 2 attousd per second for 4 character names,
        // 1 attousd per second for longer names.
        priceOracle = await StablePriceOracle.new(dummyOracle.address, [0, 0, 4, 2, 1]);
    });

    it('name length should be in [2, 63]', async () => {
        await expect(
            priceOracle.price('a', 100, 100)
        ).to.be.revertedWith('name too short');
        await expect(
            priceOracle.price('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 100, 100)
        ).to.be.revertedWith('name too long');
    })

    it('should return correct prices', async () => {
        assert.equal((await priceOracle.price("foo", 0, 3600)).toNumber(), 1440);
        assert.equal((await priceOracle.price("quux", 0, 3600)).toNumber(), 720);
        assert.equal((await priceOracle.price("fubar", 0, 3600)).toNumber(), 360);
        assert.equal((await priceOracle.price("foobie", 0, 3600)).toNumber(), 360);
    });

    it('should work with larger values', async () => {
        // 1 USD per second!
        await priceOracle.setPrices([toBN("1000000000000000000"), toBN("100000000000000000"), toBN("10000000000000000")]);
        assert.equal((await priceOracle.price("foo", 0, 86400)).toString(), "86400000000000000000" );
    })
});
