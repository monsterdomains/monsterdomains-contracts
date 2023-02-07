import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { keccak256, namehash, zeroPad } from 'ethers/lib/utils';
import { ethers, web3 } from 'hardhat';
import { expect } from 'chai';
import { BaseRegistrarImplementation, DummyOracle, MID, MIDRegistrarController, PriceOracle, PublicResolver, Wishlist } from 'src/types';
const { evm } = require('../test-utils')

const DAYS = 24 * 60 * 60;
const WISH_CAP = 10; // should be enough for our current test

describe('TestEthRegistrarController', function () {
  let mid: MID;
  let resolver: PublicResolver;
  let baseRegistrar: BaseRegistrarImplementation;
  let controller: MIDRegistrarController;
  let wishlist: Wishlist;
  let priceOracle: PriceOracle;
  let ownerAccount: SignerWithAddress;
  let registrantAccount: SignerWithAddress;
  let signers: SignerWithAddress[];

  const secret = '0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF';

  before(async () => {
    signers = await ethers.getSigners()
    ownerAccount = signers[0]
    registrantAccount = signers[1]

    let ts = Number((await web3.eth.getBlock('latest')).timestamp);
    wishlist = <Wishlist>await (await ethers.getContractFactory('Wishlist', signers[0])).deploy(
      WISH_CAP, ts - 10, ts + 10000, keccak256(Buffer.from('bnb'))
    )

    mid = <MID>await (await ethers.getContractFactory('MIDRegistry', ownerAccount)).deploy();
    baseRegistrar = <BaseRegistrarImplementation>await (await ethers.getContractFactory('BaseRegistrarImplementation', ownerAccount)).deploy(
      mid.address, namehash('bnb')
    );

    await baseRegistrar.setMaxMintPerUser(10);
    await mid.setSubnodeOwner(ethers.constants.HashZero, keccak256(Buffer.from('bnb')), baseRegistrar.address);

    const dummyOracle = <DummyOracle>await (await ethers.getContractFactory('DummyOracle', ownerAccount)).deploy(
      BigNumber.from(100000000)
    );

    priceOracle = <PriceOracle>await (await ethers.getContractFactory('StablePriceOracle', ownerAccount)).deploy(
      dummyOracle.address, [1, 1, 1, 1, 1]
    );

    controller = <MIDRegistrarController>await (await ethers.getContractFactory('MIDRegistrarController', ownerAccount)).deploy(
      wishlist.address,
      ts - 10, 
      ts + 10000,
      baseRegistrar.address,
      priceOracle.address,
      600,
      86400,
    );

    await baseRegistrar.addController(controller.address);
    await controller.setPriceOracle(priceOracle.address);

    resolver = <PublicResolver>await (await ethers.getContractFactory('PublicResolver', ownerAccount)).deploy(
      mid.address, ethers.constants.AddressZero, ethers.constants.AddressZero, ethers.constants.AddressZero
    );

  });

  const checkLabels: {
    [key: string]: boolean
  } = {
    'testing': true,
    'longname12345678': true,
    'sixsix': true,
    'five5': true,
    'four': true,
    'iii': true,
    'ii': true,
    'i': false,
    '': false,

    // { ni } { hao } { ma } (chinese; simplified)
    '\u4f60\u597d\u5417': true,

    // { ta } { ko } (japanese; hiragana)
    '\u305f\u3053': true,

    // { poop } { poop } { poop } (emoji)
    '\ud83d\udca9\ud83d\udca9\ud83d\udca9': true,

    // { poop } { poop } (emoji)
    '\ud83d\udca9\ud83d\udca9': true
  };

  it('should report label validity', async () => {
    for (const label in checkLabels) {
      expect(await controller.valid(label)).to.be.equal(checkLabels[label]);
    }
  });

  it('should report unused names as available', async () => {
    expect(await controller.available(keccak256(Buffer.from('available')))).to.be.equal(true);
  });

  it('cannot register when not alive', async () => {
    const commitment = await controller.makeCommitment('nonono', registrantAccount.address, secret);
    await controller.commit(commitment);
    await evm.advanceTime((await controller.minCommitmentAge()).toNumber());
    await controller.setReservationPhraseTime(1, 2)

    // if reservation not alive, just go with normal register without wished
    await controller.register('nonono', registrantAccount.address, 28 * DAYS, secret, { value: 28 * DAYS + 1 })
    
    // now it's alive
    await controller.setReservationPhraseTime(1, BigNumber.from(10).pow(18))
    await expect(controller.register('nonono1', registrantAccount.address, 28 * DAYS, secret, { value: 28 * DAYS + 1 }))
      .to.be.revertedWith('wish count must be 1')

      await wishlist.connect(registrantAccount).addWishes(['nonono1'])
    controller.register('nonono1', registrantAccount.address, 28 * DAYS, secret, { value: 28 * DAYS + 1 })
  })

  it('cannot register when not in wishlist', async () => {
    const commitment = await controller.makeCommitment('wish', registrantAccount.address, secret);
    await controller.commit(commitment);
    await evm.advanceTime((await controller.minCommitmentAge()).toNumber());

    await expect(controller.register('wish', registrantAccount.address, 28 * DAYS, secret, { value: 28 * DAYS + 1 }))
      .to.be.revertedWith('wish count must be 1')

    await wishlist.connect(registrantAccount).addWishes(['wish'])
    // OK
    await controller.register('wish', registrantAccount.address, 28 * DAYS, secret, { value: 28 * DAYS + 1 })
  })

  it('should permit new registrations', async () => {
    await wishlist.connect(registrantAccount).addWishes(['newname'])
    const commitment = await controller.makeCommitment('newname', registrantAccount.address, secret);
    await controller.commit(commitment);
    expect(await controller.available(keccak256(Buffer.from('available')))).to.be.equal(true);

    await evm.advanceTime((await controller.minCommitmentAge()).toNumber());
    const balanceBefore = await web3.eth.getBalance(controller.address);
    expect(
      await controller.register('newname', registrantAccount.address, 28 * DAYS, secret, { value: 28 * DAYS + 1 })
    ).to.emit(controller.address, 'NameRegistered').withArgs('newname', registrantAccount.address);
    expect(Number(await web3.eth.getBalance(controller.address)) - Number(balanceBefore)).to.be.equal(28 * DAYS)
  });

  it('should report registered names as unavailable', async () => {
    expect(await controller.available('newname')).to.be.equal(false);
  });

  it('should permit new registrations with config', async () => {
    await wishlist.connect(registrantAccount).addWishes(['newconfigname'])
    const commitment = await controller.makeCommitmentWithConfig('newconfigname', registrantAccount.address, secret, resolver.address, registrantAccount.address);
    await controller.commit(commitment);

    await evm.advanceTime((await controller.minCommitmentAge()).toNumber());
    const balanceBefore = await web3.eth.getBalance(controller.address);
    
    expect(
      await controller.registerWithConfig('newconfigname', registrantAccount.address, 28 * DAYS, secret, resolver.address, registrantAccount.address, { value: 28 * DAYS + 1 })
    ).to.emit(controller.address, 'NameRegistered').withArgs('newconfigname', registrantAccount.address);

    expect(Number(await web3.eth.getBalance(controller.address)) - Number(balanceBefore)).to.be.equal(28 * DAYS)

    const nodehash = namehash('newconfigname.bnb');
    expect((await mid.resolver(nodehash))).to.be.equal(resolver.address);
    expect((await mid.owner(nodehash))).to.be.equal(registrantAccount.address);
    expect((await resolver['addr(bytes32)'](nodehash))).to.be.equal(registrantAccount.address);
  });

  it('should not allow a commitment with addr but not resolver', async () => {
    await expect(controller.makeCommitmentWithConfig('newconfigname2', registrantAccount.address, secret, ethers.constants.AddressZero, registrantAccount.address)).to.be.revertedWith('');
  });

  it('should permit a registration with resolver but not addr', async () => {
    await wishlist.connect(registrantAccount).addWishes(['newconfigname2'])

    const commitment = await controller.makeCommitmentWithConfig('newconfigname2', registrantAccount.address, secret, resolver.address, ethers.constants.AddressZero);
    await controller.commit(commitment);

    await evm.advanceTime((await controller.minCommitmentAge()).toNumber());
    const balanceBefore = await web3.eth.getBalance(controller.address);
    
    expect(
      await controller.registerWithConfig('newconfigname2', registrantAccount.address, 28 * DAYS, secret, resolver.address, ethers.constants.AddressZero, { value: 28 * DAYS + 1 })
    ).to.emit(controller.address, 'NameRegistered').withArgs('newconfigname2', registrantAccount.address);
      
    expect(Number(await web3.eth.getBalance(controller.address)) - Number(balanceBefore)).to.be.equal(28 * DAYS)

    const nodehash = namehash('newconfigname2.bnb');
    expect(await mid.resolver(nodehash)).to.be.equal(resolver.address);
    expect(await resolver['addr(bytes32)'](nodehash)).to.be.equal(ethers.constants.AddressZero); // because we set `addr` to zero address
  });

  it('should include the owner in the commitment', async () => {
    await wishlist.connect(registrantAccount).addWishes(['newname2'])

    await controller.commit(await controller.makeCommitment('newname2', signers[2].address, secret));

    await evm.advanceTime((await controller.minCommitmentAge()).toNumber());
    const balanceBefore = await web3.eth.getBalance(controller.address);
    await expect(controller.register('newname2', registrantAccount.address, 28 * DAYS, secret, { value: 28 * DAYS })).to.be.revertedWith('');
  });

  it('should reject duplicate registrations', async () => {
    await controller.commit(await controller.makeCommitment('newname', registrantAccount.address, secret));

    await evm.advanceTime((await controller.minCommitmentAge()).toNumber());
    const balanceBefore = await web3.eth.getBalance(controller.address);
    await expect(controller.register('newname', registrantAccount.address, 28 * DAYS, secret, { value: 28 * DAYS })).to.be.revertedWith('');
  });

  it('should reject for expired commitments', async () => {
    await controller.commit(await controller.makeCommitment('newname2', registrantAccount.address, secret));

    await evm.advanceTime((await controller.maxCommitmentAge()).toNumber() + 1);
    const balanceBefore = await web3.eth.getBalance(controller.address);
    await expect(controller.register('newname2', registrantAccount.address, 28 * DAYS, secret, { value: 28 * DAYS })).to.be.revertedWith('');;
  });

  it('should allow anyone to renew a name', async () => {
    const expires = await baseRegistrar.nameExpires(keccak256(Buffer.from('newname')));
    const balanceBefore = await web3.eth.getBalance(controller.address);
    await controller.renew('newname', 86400, { value: 86400 + 1 });
    const newExpires = await baseRegistrar.nameExpires(keccak256(Buffer.from('newname')));
    expect(newExpires.toNumber() - expires.toNumber()).to.be.equal(86400);
    const balanceAfter = await web3.eth.getBalance(controller.address)
    expect(Number(balanceAfter) - Number(balanceBefore)).to.be.equal(86400);
  });

  it('should require sufficient value for a renewal', async () => {
    await expect(controller.renew('name', 86400)).to.be.revertedWith('');
  });

  it('should allow the registrar owner to withdraw funds', async () => {
    await controller.withdraw();
    expect(Number(await web3.eth.getBalance(controller.address))).to.be.equal(0);
  });
});
