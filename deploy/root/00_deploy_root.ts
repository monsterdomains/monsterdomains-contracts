import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const ZERO_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 00_deploy_root ====================`);
  
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()
  console.log(`deployer: ${deployer}, owner: ${owner}`);

  // we are using root!
  // if (!network.tags.use_root) {
  //   return true
  // }

  const registry = await ethers.getContract('MIDRegistry')

  await deploy('Root', {
    from: deployer,
    args: [registry.address],
    log: true,
  })

  const root = await ethers.getContract('Root')

  const tx1 = await registry.setOwner(ZERO_HASH, root.address)
  console.log(
    `Setting owner of root node (zero hash) to root contract (tx: ${tx1.hash})...`,
  )
  await tx1.wait()

  const rootOwner = await root.owner()
  console.log(`root owner: ${rootOwner}`)

  switch (rootOwner) {
    case deployer:
      const tx2 = await root
        .connect(await ethers.getSigner(deployer))
        .transferOwnership(owner)
      console.log(
        `Transferring root ownership to final owner (tx: ${tx2.hash})...`,
      )
      await tx2.wait()
    case owner:
      if (!(await root.controllers(owner))) {
        const tx2 = await root
          .connect(await ethers.getSigner(owner))
          .setController(owner, true)
        console.log(
          `Setting final owner as controller on root contract (tx: ${tx2.hash})...`,
        )
        await tx2.wait()
      }
      break
    default:
      console.log(
        `WARNING: Root is owned by ${rootOwner}; cannot transfer to owner account`,
      )
  }

  return true
}

func.id = 'root'
func.tags = ['root', 'Root']
func.dependencies = ['MIDRegistry']

export default func
