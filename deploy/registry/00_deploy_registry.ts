import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const ZERO_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 00_deploy_registry ====================`);

  console.log('starting')
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, run } = deployments
  const { deployer, owner } = await getNamedAccounts()

  // no need for legacy deal

  await deploy('MIDRegistry', {
    from: deployer,
    args: [],
    log: true,
  })

  // We are using root to manage the root node
  // if (!network.tags.use_root) {
  //   const registry = await ethers.getContract('MIDRegistry')
  //   const rootOwner = await registry.owner(ZERO_HASH)
  //   switch (rootOwner) {
  //     case deployer:
  //       const tx = await registry.setOwner(ZERO_HASH, owner, { from: deployer })
  //       console.log(
  //         'Setting final owner of root node on registry (tx:${tx.hash})...',
  //       )
  //       await tx.wait()
  //       break
  //     case owner:
  //       break
  //     default:
  //       console.log(
  //         `WARNING: MID registry root is owned by ${rootOwner}; cannot transfer to owner`,
  //       )
  //   }
  // }

  return true
}

func.id = 'ens'
func.tags = ['registry', 'MIDRegistry']

export default func
