import '@typechain/hardhat';
import '@nomiclabs/hardhat-truffle5';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-solhint';
import 'hardhat-abi-exporter';
import 'hardhat-gas-reporter';
import 'hardhat-deploy';
import { resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';


dotenvConfig({ path: resolve(__dirname, './.env') });

const privateKey: string | undefined = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error('Please set your PRIVATE_KEY in a .env file');
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error('Please set your INFURA_API_KEY in a .env file');
}

export default {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      // Required for real DNS record tests
      initialDate: '2019-03-15T14:06:45.000+13:00'
    },
    goerli: {
      accounts: [`0x${privateKey}`],
      chainId: 5,
      url: 'https://goerli.infura.io/v3/' + infuraApiKey,
    },
    bsctestnet: {
      accounts: [`0x${privateKey}`],
      chainId: 97,
      url: 'https://bsctestapi.terminet.io/rpc',
      verify: {
        etherscan: {
          apiUrl: 'https://api-testnet.bscscan.com'
        }
      }
    },
    mumbai: {
      accounts: [`0x${privateKey}`],
      chainId: 80001,
      url: 'https://rpc.ankr.com/polygon_mumbai',
      verify: {
        etherscan: {
          apiUrl: 'https://api-testnet.polygonscan.com'
        }
      }
    }
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
    owner: {
      default: 0, // deployer is the owner
    }
  },
  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || 'BSCSCAN_API_KEY',
      bsctestnet: process.env.BSCSCAN_API_KEY || 'BSCSCAN_API_KEY',
      rinkeby: process.env.ETHERSCAN_API_KEY || 'ETHERSCAN_API_KEY',
      goerli: process.env.ETHERSCAN_API_KEY || 'ETHERSCAN_API_KEY',
      mumbai: process.env.PLOYGON_API_KEY || 'PLOYGON_API_KEY',
    },
  },
  abiExporter: {
    path: './build/contracts',
    clear: true,
    flat: true,
    spacing: 2
  },
  solidity: {
    compilers: [
      {
        version: '0.8.4'
      }
      
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: 'USD',
    src: './contracts',
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
  },
};

