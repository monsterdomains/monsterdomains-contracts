const namehash = require('eth-ens-namehash');
const sha3 = require('web3-utils').sha3;

const { exceptions } = require("../test-utils")

let contracts = [
    [artifacts.require('./registry/MIDRegistry.sol'), 'Solidity']
];

contracts.forEach(function ([MID, lang]) {
    contract('MID ' + lang, function (accounts) {

        let mid;

        beforeEach(async () => {
            mid = await MID.new();
        });

        it('should allow ownership transfers', async () => {
            let addr = '0x0000000000000000000000000000000000001234';

            let result = await mid.setOwner('0x0', addr, {from: accounts[0]});

            assert.equal(await mid.owner('0x0'), addr)

            assert.equal(result.logs.length, 1);
            let args = result.logs[0].args;
            assert.equal(args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.equal(args.owner_, addr);
        });

        it('should prohibit transfers by non-owners', async () => {
            await exceptions.expectFailure(
                mid.setOwner('0x1', '0x0000000000000000000000000000000000001234', {from: accounts[0]})
            );
        });

        it('should allow setting resolvers', async () => {
            let addr = '0x0000000000000000000000000000000000001234'

            let result = await mid.setResolver('0x0', addr, {from: accounts[0]});

            assert.equal(await mid.resolver('0x0'), addr);

            assert.equal(result.logs.length, 1);
            let args = result.logs[0].args;
            assert.equal(args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.equal(args.resolver_, addr);
        });

        it('should prevent setting resolvers by non-owners', async () => {
            await exceptions.expectFailure(
                mid.setResolver('0x1', '0x0000000000000000000000000000000000001234', {from: accounts[0]})
            );
        });

        it('should allow setting the TTL', async () => {
            let result = await mid.setTTL('0x0', 3600, {from: accounts[0]});

            assert.equal((await mid.ttl('0x0')).toNumber(), 3600);

            assert.equal(result.logs.length, 1);
            let args = result.logs[0].args;
            assert.equal(args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.equal(args.ttl_.toNumber(), 3600);
        });

        it('should prevent setting the TTL by non-owners', async () => {
            await exceptions.expectFailure(mid.setTTL('0x1', 3600, {from: accounts[0]}));
        });

        it('should allow the creation of subnodes', async () => {
            let result = await mid.setSubnodeOwner('0x0', sha3('eth'), accounts[1], {from: accounts[0]});

            assert.equal(await mid.owner(namehash.hash('eth')), accounts[1]);

            assert.equal(result.logs.length, 1);
            let args = result.logs[0].args;
            assert.equal(args.node, "0x0000000000000000000000000000000000000000000000000000000000000000");
            assert.equal(args.label, sha3('eth'));
            assert.equal(args.owner_, accounts[1]);
        });

        it('should prohibit subnode creation by non-owners', async () => {
            await exceptions.expectFailure(mid.setSubnodeOwner('0x0', sha3('eth'), accounts[1], {from: accounts[1]}));
        });
    });
});
