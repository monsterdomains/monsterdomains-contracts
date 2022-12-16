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

  const registry = await ethers.getContract('MIDRegistry')
  const controller = await ethers.getContract('MIDRegistrarController')


  const deployArgs = {
    from: deployer,
    args: [registry.address, controller.address],
    log: true,
  };

  const bulkRenewal = await deploy('BulkRenewal', deployArgs)
  console.log(`BulkRenewal controller: ${bulkRenewal.address}`)
}

func.id = 'bulkrenewal'
func.tags = ['bulkrenewal']
func.dependencies = ['MIDRegistry', 'MIDRegistrarController']

export default func
