import { BigNumber } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`==================== 01_deploy_stable_price_oracle ====================`);

  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  let oracleAddress;

  const dummyOracle = await deploy('DummyOracle', {
    from: deployer,
    log: true,
    args: [BigNumber.from(10).pow(10).mul(13)] // $1300
  })

  if (network.name === 'bsc') {
    oracleAddress = '0x0567f2323251f0aab15c8dfb1967e4e8a7d42aee';
  } else if (network.name === 'hardhat') {
    oracleAddress = dummyOracle.address;
  } else if (network.name === 'mumbai') {
    oracleAddress = '0x0715A7794a1dc8e42615F059dD6e406A6594651A'; // it's a ETH oracle, just for mininal cost
  } else {
    oracleAddress = '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526';
  }

  await deploy('StablePriceOracle', {
    from: deployer,
    args: [
      oracleAddress,
      // $2000, $888, $500, $120, $5
      [63419583967529, 28158295281582, 15854895991882, 3805175038051, 158548959918] 
    ],
    log: true,
  })
}

func.id = 'price-oracle'
func.tags = ['midregistrar', 'StablePriceOracle', 'DummyOracle']
func.dependencies = ['registry']

export default func
