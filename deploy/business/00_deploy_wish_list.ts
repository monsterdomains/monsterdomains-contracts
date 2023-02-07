const namehash = require('eth-ens-namehash');
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 00_deploy_wish_list ====================`);

  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const now = 1675743226 // get from Math.floor((new Date()).getTime() / 1000)

  const deployArgs = {
    from: deployer,
    args: [
      5,
      now,
      now + 86400 * 30,
      namehash.hash('bnb')
    ],
    log: true,
  };

  const wl = await deploy('Wishlist', deployArgs)

  // if just deployed, it means the owner must be the deployer
  console.log(`Wishlist newlyDeployed: ${wl.newlyDeployed}`)
}

func.id = 'wishlist'
func.tags = ['wishlist']
func.dependencies = []

export default func
