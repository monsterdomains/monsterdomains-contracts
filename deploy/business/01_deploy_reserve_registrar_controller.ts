import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 01_deploy_reserve_registrar_controller ====================`);
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

  const wishlist = await ethers.getContract(
    'Wishlist', owner
  )
  const now = 1675743226
  const deployArgs = {
    from: deployer,
    args: [
      wishlist.address,
      now,
      now + 86400 * 30,
      registrar.address,
      priceOracle.address,
      15,
      86400,
    ],
    log: true,
  }
  const controller = await deploy('ReservationRegistrarController', deployArgs)

  // if just deployed, it means the owner must be the deployer
  console.log(`ReservationRegistrarController newlyDeployed: ${controller.newlyDeployed}`)
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
    const c = await ethers.getContract('ReservationRegistrarController', deployer)
    const tx = await c.transferOwnership(owner)
    console.log(
      `Transferring ownership of ReservationRegistrarController to ${owner} (tx: ${tx.hash})...`,
    )
    await tx.wait()
  }

  // Only attempt to make controller etc changes directly on testnets
  if (network.name === 'mainnet') return

  // we don't need controller for this, controller thing is not online yet
  // const tx1 = await reverseRegistrar.setController(controller.address, true)
  // console.log(
  //   `Adding ReservationRegistrarController as a controller of ReverseRegistrar (tx: ${tx1.hash})...`,
  // )
  // await tx1.wait()
}

func.tags = ['ethregistrar', 'ReservationRegistrarController']
func.dependencies = [
  'Wishlist',
  'MIDRegistry',
  'BaseRegistrarImplementation',
  'StablePriceOracle',
  'ReverseRegistrar',
]

export default func
