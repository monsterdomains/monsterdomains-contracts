const namehash = require('eth-ens-namehash');
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { keccak256 } from 'js-sha3'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 00_deploy_base_registrar_implementation ====================`);

  const { getNamedAccounts, deployments, network } = hre
  const { deploy, fetchIfDifferent } = deployments
  const { deployer, owner } = await getNamedAccounts()

  // we are using root
  // if (!network.tags.use_root) {
  //   return true
  // }

  const registry = await ethers.getContract('MIDRegistry')
  const root = await ethers.getContract('Root')

  const deployArgs = {
    from: deployer,
    args: [registry.address, namehash.hash('bnb')],
    log: true,
  };

  const bri = await deploy('BaseRegistrarImplementation', deployArgs)

  // if just deployed, it means the owner must be the deployer
  console.log(`BaseRegistrarImplementation newlyDeployed: ${bri.newlyDeployed}`)
  if(!bri.newlyDeployed) {
    console.log('skip the following steps');
    return;
  }
  
  const registrar = await ethers.getContract('BaseRegistrarImplementation')

  const tx1 = await registrar.transferOwnership(owner, { from: deployer })
  console.log(`Transferring ownership of registrar to owner (tx: ${tx1.hash})...`)
  await tx1.wait()

  // Root set the owner of root domain(.bnb) to implementation
  const tx2 = await root
    .connect(await ethers.getSigner(owner))
    .setSubnodeOwner('0x' + keccak256('bnb'), registrar.address)
  console.log(
    `Setting owner of bnb node to registrar on root (tx: ${tx2.hash})...`,
  )
  await tx2.wait()
}

func.id = 'registrar'
func.tags = ['midregistrar', 'BaseRegistrarImplementation']
func.dependencies = ['registry', 'root']

export default func
