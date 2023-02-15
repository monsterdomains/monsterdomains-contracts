import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { ethers, web3 } from 'hardhat';
import { resolve } from 'path';
import { BigNumber } from 'ethers';
import { Wishlist } from 'src/types';
import { deployContract } from 'ethereum-waffle';
import { keccak256, namehash } from 'ethers/lib/utils';

const WISH_CAP = 3;
const BASE_NODE = namehash('bnb')


describe('TestWishlist', function () {
  let signers: SignerWithAddress[];
  let wishlist: Wishlist;

  beforeEach(async function () {
    let ts = Number((await web3.eth.getBlock('latest')).timestamp);
    signers = await ethers.getSigners()
    wishlist = <Wishlist>await (await ethers.getContractFactory('Wishlist', signers[0])).deploy(
      WISH_CAP, ts, ts + 10000, BASE_NODE
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
      await expect(wishlist.connect(signers[0]).setBaseNode(ethers.constants.HashZero)).to.be.revertedWith(
        'invalid parameters',
      );
      await wishlist.connect(signers[0]).setBaseNode(BASE_NODE); // ok
      await wishlist.connect(signers[0]).setWishCap(3); // ok
    })
  });

  describe('add list', function () {
    it('phrase tests', async function () {
      await wishlist.connect(signers[0]).setWishPhraseTime(10, 20); // ok
      await expect(wishlist.connect(signers[2]).setWishes(['haha', 'hehe', 'yoyo'])).to.be.revertedWith(
        'not wishlist phrase',
      );
    })

    it('set wish tests', async function () {
      let ts = Number((await web3.eth.getBlock('latest')).timestamp);
      await wishlist.connect(signers[0]).setWishCap(3); // ok
      await wishlist.setWishPhraseTime(ts - 10, ts + 10000)
      await expect(wishlist.connect(signers[1]).setWishes(['', '', ''])).to.be.revertedWith(
        'empty name',
      );

      await wishlist.connect(signers[1]).setWishes(['22', 'user2_name1', 'user2_name2'])
      await wishlist.connect(signers[2]).setWishes(['33', 'user2_name1', 'user2_name2'])
      await expect(wishlist.connect(signers[3]).setWishes(['456', '456', '780'])).to.be.revertedWith(
        'duplicated wish',
      );

      await wishlist.connect(signers[3]).setWishes(['666', 'user2_name1', 'user2_name2'])

      expect(await wishlist.userHasWish(signers[1].address, '22')).to.be.equal(true)
      expect(await wishlist.userHasWish(signers[1].address, 'user2_name1')).to.be.equal(true)
      expect(!(await wishlist.userHasWish(signers[1].address, '999999'))).to.be.equal(true)
      expect(await wishlist.userHasWish(signers[2].address, '33')).to.be.equal(true)
      expect(await wishlist.userHasWish(signers[3].address, '666')).to.be.equal(true)
      expect(await wishlist.userHasWish(signers[3].address, 'user2_name1')).to.be.equal(true)
    });

    it('wish cap', async function () {
      await expect(wishlist.connect(signers[1]).setWishes(['999', '123123', '12312312312', 'sdf'])).to.be.revertedWith(
        'wrong wish number',
      );
    })

    it('cross wish', async function () {
      await wishlist.connect(signers[3]).setWishes(['5555', '6666', '7777'])
      await wishlist.connect(signers[2]).setWishes(['5555', '6666', '7777'])
      expect(await wishlist.wishCounts(keccak256(Buffer.from('5555')))).to.be.equal(2)
      expect(await wishlist.wishCounts(keccak256(Buffer.from('6666')))).to.be.equal(2)
      expect(await wishlist.wishCounts(keccak256(Buffer.from('7777')))).to.be.equal(2)
    })

    it('wish count', async function () {

    })
  })
})
