import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 03_deploy_migration_registrar_controller ====================`);
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

  let sourceRegistry
  let sourceBaseRegistrar

  if (network.name === 'bsc') {
    sourceRegistry = '0x08ced32a7f3eec915ba84415e9c07a7286977956'
    sourceBaseRegistrar = '0xE3b1D32e43Ce8d658368e2CBFF95D57Ef39Be8a6'
  } else {
    const dummySourceRegistry = await deploy('DummySourceRegistry', {
      from: deployer, args: []
    })
    sourceRegistry = dummySourceRegistry.address

    const dummySourceBaseRegistrar = await deploy('DummySourceBaseRegistrar', {
      from: deployer, args: []
    })
    sourceBaseRegistrar = dummySourceBaseRegistrar.address
  }

  // BaseRegistrarImplementation base_,
  // PriceOracle priceOracle_, 
  // SourceRegistry sourceRegistry_,
  // SourceBaseRegistrar sourceBaseRegistrar_,
  // address treasury_,
  // uint256 start_,
  // uint256 end_
  const now = 1675743226
  const deployArgs = {
    from: deployer,
    args: [
      registrar.address,
      priceOracle.address,
      sourceRegistry,
      sourceBaseRegistrar,
      '0x0000000000000000000000000000000000000000',
      now,
      now + 86400 * 100,
    ],
    log: true,
  }
  const controller = await deploy('MIDRegistrarMigrationController', deployArgs)

  // if just deployed, it means the owner must be the deployer
  console.log(`MIDRegistrarMigrationController newlyDeployed: ${controller.newlyDeployed}`)
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

func.tags = ['ethregistrar', 'MIDMigrationRegistrarController']
func.dependencies = [
  'MIDRegistry',
  'BaseRegistrarImplementation',
  'StablePriceOracle',
  'ReverseRegistrar',
]

export default func
