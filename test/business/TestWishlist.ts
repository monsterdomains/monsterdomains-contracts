import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { ethers, web3 } from 'hardhat';
import { resolve } from 'path';
import { BigNumber } from 'ethers';
import { Wishlist } from 'src/types';
import { deployContract } from 'ethereum-waffle';
import { keccak256, namehash } from 'ethers/lib/utils';

const WISH_CAP = 5;
const BASE_NODE = namehash('bnb')
const ZERO_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000'


describe('TestWishlist', function () {
  let signers: SignerWithAddress[];
  let wishlist: Wishlist;

  before(async function () {
    signers = await ethers.getSigners()
    wishlist = <Wishlist>await (await ethers.getContractFactory('Wishlist', signers[0])).deploy(
      WISH_CAP, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 1, BASE_NODE
    );
  });

  describe('initialize test', function () {
    it('only admin can call initialize & parameter must be valid', async function () {
      await expect(wishlist.connect(signers[1]).setBaseNode(BASE_NODE)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );

      await expect(wishlist.connect(signers[0]).setWishCap(0)).to.be.revertedWith(
        'invalid parameters',
      );
      await expect(wishlist.connect(signers[0]).setWishPhraseTime(0, 0)).to.be.revertedWith(
        'invalid parameters',
      );
      await expect(wishlist.connect(signers[0]).setBaseNode(ZERO_HASH)).to.be.revertedWith(
        'invalid parameters',
      );
      await wishlist.connect(signers[0]).setBaseNode(BASE_NODE); // ok
      await wishlist.connect(signers[0]).setWishCap(11); // ok
      await wishlist.connect(signers[0]).setWishPhraseTime(10, 20); // ok

    })
  });

  describe('add list', function () {
    it('basic tests', async function () {
      let ts = Number((await web3.eth.getBlock('latest')).timestamp);

      await expect(wishlist.connect(signers[2]).addWish('haha')).to.be.revertedWith(
        'not wishlist phrase',
      );

      await wishlist.connect(signers[0]).setWishCap(2); // ok
      await wishlist.setWishPhraseTime(ts - 10, ts + 10000)
      await expect(wishlist.connect(signers[1]).addWish('')).to.be.revertedWith(
        'empty name',
      );

      await wishlist.connect(signers[1]).addWish('22')
      await wishlist.connect(signers[2]).addWish('33')
      await wishlist.connect(signers[3]).addWish('666')
      await expect(wishlist.connect(signers[3]).addWish('666')).to.be.revertedWith(
        'duplicated wish',
      );

      expect(await wishlist.userHasWish(signers[1].address, '22'))
      expect(!(await wishlist.userHasWish(signers[1].address, '999999')))
      expect(await wishlist.userHasWish(signers[2].address, '33'))
      expect(await wishlist.userHasWish(signers[3].address, '666'))
    });

    it('wish cap', async function () {
      await wishlist.connect(signers[1]).addWish('5555')
      await expect(wishlist.connect(signers[1]).addWish('999')).to.be.revertedWith(
        'exceed wish cap',
      );
      expect(await wishlist.userWishes(signers[1].address)).deep.equal(['22', '5555'])
    })

    it('cross wish', async function () {
      await wishlist.connect(signers[3]).addWish('5555')
      await wishlist.connect(signers[2]).addWish('5555')
      expect(await wishlist.wishCounts(keccak256(Buffer.from('5555')))).to.be.equal(3)
    })
  })
})
