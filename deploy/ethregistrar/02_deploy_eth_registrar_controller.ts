import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 02_deploy_mid_registrar_controller ====================`);
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const registrar = await ethers.getContract(
    'BaseRegistrarImplementation',
    owner,
  )
  const priceOracle = await ethers.getContract(
    'StablePriceOracle',
    owner,
  )

  const wishlist = await ethers.getContract('Wishlist', owner)

  const deployArgs = {
    from: deployer,
    args: [
      wishlist.address,
      1675743226,
      1675743226 + 86400 * 30,
      registrar.address,
      priceOracle.address,
      15,
      86400,
    ],
    log: true,
  }
  const controller = await deploy('MIDRegistrarController', deployArgs)

  // if just deployed, it means the owner must be the deployer
  console.log(`MIDRegistrarController newlyDeployed: ${controller.newlyDeployed}`)
  if (!controller.newlyDeployed) {
    console.log('skip the following steps');
    return
  }

  // add controller to implementation
  const tx = await registrar.addController(controller.address)
  console.log(
    `Adding controller as controller on registrar (tx: ${tx.hash})...`,
  )
  await tx.wait()


  if (owner !== deployer) {
    const c = await ethers.getContract('MIDRegistrarController', deployer)
    const tx = await c.transferOwnership(owner)
    console.log(
      `Transferring ownership of MIDRegistrarController to ${owner} (tx: ${tx.hash})...`,
    )
    await tx.wait()
  }

  // Only attempt to make controller etc changes directly on testnets
  if (network.name === 'bsc') return

  // we don't need controller for this, controller thing is not online yet
  // const tx1 = await reverseRegistrar.setController(controller.address, true)
  // console.log(
  //   `Adding MIDRegistrarController as a controller of ReverseRegistrar (tx: ${tx1.hash})...`,
  // )
  // await tx1.wait()
}

func.tags = ['ethregistrar', 'MIDRegistrarController']
func.dependencies = [
  'MIDRegistry',
  'BaseRegistrarImplementation',
  'StablePriceOracle',
  'ReverseRegistrar',
]

export default func
