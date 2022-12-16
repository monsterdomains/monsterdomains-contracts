import { namehash } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { keccak256 } from 'js-sha3'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 01_deploy_reverse_registrar ====================`);

  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const registry = await ethers.getContract('MIDRegistry')

  const defaultReverseResolver = await deploy('DefaultReverseResolver', {
    from: deployer,
    args: [
      registry.address,
    ],
    log: true,
  });

  const reverseRegistrar = await deploy('ReverseRegistrar', {
    from: deployer,
    args: [registry.address, defaultReverseResolver.address],
    log: true,
  })

  // if just deployed, it means the owner must be the deployer
  console.log(`reverse registrar newly deployed? ${reverseRegistrar.newlyDeployed}`)
  if (!reverseRegistrar.newlyDeployed) {
    console.log('skip the following steps');
    return
  } 

  // no need for this, our version don't have ownership
  //   const r = await ethers.getContract('ReverseRegistrar', deployer)
  //   const tx = await r.transferOwnership(owner)
  //   console.log(
  //     `Transferring ownership of ReverseRegistrar to ${owner} (tx: ${tx.hash})...`,
  //   )
  //   await tx.wait()
  // }

  // Only attempt to make controller etc changes directly on testnets
  if (network.name === 'mainnet') return

  const root = await ethers.getContract('Root')

  const tx1 = await root
    .connect(await ethers.getSigner(owner))
    .setSubnodeOwner('0x' + keccak256('reverse'), owner)
  console.log(`Setting owner of .reverse to owner on root (tx: ${tx1.hash})...`)
  await tx1.wait()

  const tx2 = await registry
    .connect(await ethers.getSigner(owner))
    .setSubnodeOwner(
      namehash('reverse'),
      '0x' + keccak256('addr'),
      reverseRegistrar.address,
    )
  console.log(
    `Setting owner of .addr.reverse to ReverseRegistrar on registry (tx: ${tx2.hash})...`,
  )
  await tx2.wait()
}

func.id = 'reverse-registrar'
func.tags = ['ReverseRegistrar']
func.dependencies = ['root']

export default func
