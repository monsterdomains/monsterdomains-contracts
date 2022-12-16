import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Interface, randomBytes } from 'ethers/lib/utils';
import { MIDRegistrarController } from 'src/types';
import { BigNumber } from 'ethers';

const { makeInterfaceId } = require('@openzeppelin/test-helpers')

function computeInterfaceId(iface: Interface) {
  return makeInterfaceId.ERC165(
    Object.values(iface.functions).map((frag) => frag.format('sighash')),
  )
}

const sleep = (sec: number) => {
  return new Promise((res) => {
    setTimeout(() => {
      res(1);
    }, sec * 1000)
  })
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const BNB_ROOT_NODE = ethers.utils.namehash('bnb');


const makeSalt = () => {
  // Generate a random value to mask our commitment
  const random = randomBytes(32);
  const salt = '0x' + Array.from(random).map(b => b.toString(16).padStart(2, '0')).join('');
  return salt;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 00_deploy_public_resolver ====================`);

  const { getNamedAccounts, deployments, ethers } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const registry = await ethers.getContract('MIDRegistry', owner)
  const controller = <MIDRegistrarController>await ethers.getContract('MIDRegistrarController', owner)
  const reverseRegistrar = await ethers.getContract('ReverseRegistrar', owner)

  const deployArgs = {
    from: deployer,
    args: [
      registry.address,
      ZERO_ADDRESS, // no need for namewrapper
      controller.address,
      reverseRegistrar.address,
    ],
    log: true,
  }

  const resolverDeployResult = await deploy('PublicResolver', deployArgs)
  console.log(`publicResolver newlyDeployed: ${resolverDeployResult.newlyDeployed}`)
  // if (!resolverDeployResult.newlyDeployed) {
  //   console.log('skip the following steps');
  //   return;
  // }

  const resolverHash = ethers.utils.namehash('resolver.bnb');
  let resolverOwner = await registry.owner(resolverHash);

  // if not registered, register one
  if (resolverOwner === ZERO_ADDRESS) {
    // make salt
    const salt = makeSalt();
    const commitment = await controller.makeCommitment('resolver', owner, salt);
    console.log(`commitment: ${commitment}`);
    const tx = await controller.commit(commitment);
    await tx.wait();

    console.log('now let\'s wait for 15s to register');
    await sleep(16);

    const rentPrice = await controller.rentPrice('resolver', 86400 * 365) ; // $300 per bnb
    console.log(`price: ${rentPrice.div(BigNumber.from(10).pow(18)).toString()} base token`)
    const tx1 = await controller.register('resolver', owner, 86400 * 365, salt, {
      value: rentPrice,
    });
    await tx1.wait();
    console.log(`register done`);
  }

  resolverOwner =  await registry.owner(resolverHash);

  // should be owner
  if (resolverOwner === owner) {
    const pr = await ethers.getContract('PublicResolver')
    const tx2 = await registry.setResolver(resolverHash, pr.address)
    console.log(
      `Setting resolver for resolver.bnb to PublicResolver (tx: ${tx2.hash})...`,
    )
    await tx2.wait()

    const tx3 = await pr['setAddr(bytes32,address)'](resolverHash, pr.address)
    console.log(
      `Setting address for resolver.bnb to PublicResolver (tx: ${tx3.hash})...`,
    )
    await tx3.wait()
  } else {
    console.warn(
      'resolver.bnb is not owned by the owner address, not setting resolver',
    )
  }
}

func.id = 'resolver'
func.tags = ['resolvers', 'PublicResolver']
func.dependencies = [
  'registry',
  'MIDRegistrarController',
  'ReverseRegistrar',
]

export default func
