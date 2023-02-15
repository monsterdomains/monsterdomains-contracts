import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { ethers, web3 } from 'hardhat';
import { resolve } from 'path';
import { BigNumber } from 'ethers';
import { BaseRegistrarImplementation, BulkMigration, DummyOracle, DummySourceBaseRegistrar, DummySourceRegistry, MID, MIDRegistrarController, MIDRegistrarMigrationController, PriceOracle, PublicResolver, SourceRegistry, StablePriceOracle, Wishlist } from 'src/types';
import { deployContract } from 'ethereum-waffle';
import { keccak256, namehash } from 'ethers/lib/utils';

describe('TestBulkMigration', function () {
  let signers: SignerWithAddress[];
  let ownerAccount: SignerWithAddress;
  let bulkMigration: BulkMigration;
  let mid: MID;
  let baseRegistrar: BaseRegistrarImplementation;
  let priceOracle: StablePriceOracle;
  let controller: MIDRegistrarMigrationController;
  let resolver: PublicResolver;
  let sourceRegistry: DummySourceRegistry;
  let sourceBaseRegistrar: DummySourceBaseRegistrar;


  beforeEach(async function () {
    signers = await ethers.getSigners()
    ownerAccount = signers[0]

    sourceRegistry = <DummySourceRegistry>await (await ethers.getContractFactory('DummySourceRegistry', ownerAccount)).deploy();
    sourceBaseRegistrar = <DummySourceBaseRegistrar>await (await ethers.getContractFactory('DummySourceBaseRegistrar', ownerAccount)).deploy();
    
    mid = <MID>await (await ethers.getContractFactory('MIDRegistry', ownerAccount)).deploy();
    baseRegistrar = <BaseRegistrarImplementation>await (await ethers.getContractFactory('BaseRegistrarImplementation', ownerAccount)).deploy(
      mid.address, namehash('bnb')
    );

    await baseRegistrar.setMaxMintPerUser(10);
    await mid.setSubnodeOwner(ethers.constants.HashZero, keccak256(Buffer.from('bnb')), baseRegistrar.address);

    const dummyOracle = <DummyOracle>await (await ethers.getContractFactory('DummyOracle', ownerAccount)).deploy(
      BigNumber.from(100000000) // $1
    );

    priceOracle = <StablePriceOracle>await (await ethers.getContractFactory('StablePriceOracle', ownerAccount)).deploy(
      dummyOracle.address, [1, 1, 1, 1, 1]
    );

    controller = <MIDRegistrarMigrationController>await (await ethers.getContractFactory('MIDRegistrarMigrationController', ownerAccount)).deploy(
      baseRegistrar.address,
      priceOracle.address,
      sourceRegistry.address,
      sourceBaseRegistrar.address,
      ethers.constants.AddressZero,
      600,
      86400,
      [50, 60, 70, 80, 90]
    );

    bulkMigration = <BulkMigration>await (await ethers.getContractFactory('BulkMigration', ownerAccount)).deploy(
      controller.address
    );

    await baseRegistrar.addController(controller.address);
    await controller.setPriceOracle(priceOracle.address);

    resolver = <PublicResolver>await (await ethers.getContractFactory('PublicResolver', ownerAccount)).deploy(
      mid.address, ethers.constants.AddressZero, ethers.constants.AddressZero, ethers.constants.AddressZero
    );
  });

  describe('bulk migration', function () {
    it('rent price', async function () {
      let rentPrices = await bulkMigration.rentPrices(
        ['name1', 'name2', 'cool', 'dope'],
      )
      expect(rentPrices).to.be.equal(0) // no source yet
      await sourceRegistry.setOwnerByLabelName('name1', ownerAccount.address)
      await sourceRegistry.setOwnerByLabelName('name2', ownerAccount.address)
      await sourceRegistry.setOwnerByLabelName('cool', ownerAccount.address)
      await sourceRegistry.setOwnerByLabelName('dope', ownerAccount.address)

      
      let ts = Number((await web3.eth.getBlock('latest')).timestamp);
      await sourceBaseRegistrar.setNameExpiresByLabelName('name1', ts + 86400 * 100)
      await sourceBaseRegistrar.setNameExpiresByLabelName('name2', ts + 500)
      await sourceBaseRegistrar.setNameExpiresByLabelName('cool', ts + 200)
      await sourceBaseRegistrar.setNameExpiresByLabelName('dope', ts - 10)


      rentPrices = await bulkMigration.rentPrices(
        ['name1', 'name2', 'cool', 'dope'],
      )
      
      const roundupUnit = await controller.durationRoundUpUnit()
      expect(rentPrices).to.be.equal(
        1 * 2 * roundupUnit.toNumber() * 0.9 + 
        1 * roundupUnit.toNumber() * 0.9 +
        1 * roundupUnit.toNumber() * 0.8
      )

    })
    it('should bulk migrate domain names from source', async function () {
      await sourceRegistry.setOwnerByLabelName('name1', ownerAccount.address)
      await sourceRegistry.setOwnerByLabelName('name2', ownerAccount.address)
      
      let ts = Number((await web3.eth.getBlock('latest')).timestamp);
      await sourceBaseRegistrar.setNameExpiresByLabelName('name1', ts + 86400 * 100) // 100 days
      await sourceBaseRegistrar.setNameExpiresByLabelName('name2', ts + 500)

      const cost = await bulkMigration.rentPrices(['name1', 'name2'])
  
      // make it start
      await controller.setActivePeriod(ts, ts + 10000)

      ts += 4 // 4 tx passes
    
      await bulkMigration.batchMigrateWithResolver(['name1', 'name2'], ownerAccount.address, resolver.address, {
        value: cost
      })

      expect(
        await baseRegistrar.ownerOf(keccak256(Buffer.from('name1')))
      ).to.be.equal(ownerAccount.address)
      expect(
        await baseRegistrar.ownerOf(keccak256(Buffer.from('name2')))
      ).to.be.equal(ownerAccount.address)
      expect(
        await baseRegistrar.nameExpires(keccak256(Buffer.from('name1')))
      ).to.be.equal(ts + 86400 * 30 * 6)
      expect(
        await baseRegistrar.nameExpires(keccak256(Buffer.from('name2')))
      ).to.be.equal(ts + 86400 * 30 * 3)
    })
  })
})
