export * from './src/types';

// export deployments
// import BaseRegistrarImplementation97 from './deployments/bsctestnet/BaseRegistrarImplementation.json';
// import DefaultReverseResolver97 from './deployments/bsctestnet/DefaultReverseResolver.json';
// import MIDRegistrarController97 from './deployments/bsctestnet/MIDRegistrarController.json';
// import MIDRegistry97 from './deployments/bsctestnet/MIDRegistry.json';
// import PublicResolver97 from './deployments/bsctestnet/PublicResolver.json';
// import ReverseRegistrar97 from './deployments/bsctestnet/ReverseRegistrar.json';
// import Root97 from './deployments/bsctestnet/Root.json';
// import StablePriceOracle97 from './deployments/bsctestnet/StablePriceOracle.json';
// import BulkRenewal97 from './deployments/bsctestnet/BulkRenewal.json';

// mumbai
import BaseRegistrarImplementation80001 from './deployments/mumbai/BaseRegistrarImplementation.json';
import DefaultReverseResolver80001 from './deployments/mumbai/DefaultReverseResolver.json';
import MIDRegistrarController80001 from './deployments/mumbai/MIDRegistrarController.json';
import MIDRegistrarMigrationController80001 from './deployments/mumbai/MIDRegistrarMigrationController.json';
import MIDRegistry80001 from './deployments/mumbai/MIDRegistry.json';
import PublicResolver80001 from './deployments/mumbai/PublicResolver.json';
import ReverseRegistrar80001 from './deployments/mumbai/ReverseRegistrar.json';
import Root80001 from './deployments/mumbai/Root.json';
import StablePriceOracle80001 from './deployments/mumbai/StablePriceOracle.json';
import BulkRenewal80001 from './deployments/mumbai/BulkRenewal.json';


export const deployments = {
  BaseRegistrarImplementation: {
    abi: BaseRegistrarImplementation80001.abi,
    address: {
      // 97: BaseRegistrarImplementation97.address,
      80001: BaseRegistrarImplementation80001.address,
    },
  },
  DefaultReverseResolver: {
    abi: DefaultReverseResolver80001.abi,
    address: {
      // 97: DefaultReverseResolver97.address,
      80001: DefaultReverseResolver80001.address,
    }
  },
  MIDRegistrarController: {
    abi: MIDRegistrarController80001.abi,
    address: {
      // // 97: MIDRegistrarController97.address,
      80001: MIDRegistrarController80001.address,
    }
  },
  MIDRegistry: {
    abi: MIDRegistry80001.abi,
    address: {
      // // 97: MIDRegistry97.address,
      80001: MIDRegistry80001.address,
    }
  },
  PublicResolver: {
    abi: PublicResolver80001.abi,
    address: {
      // // 97: PublicResolver97.address,
      80001: PublicResolver80001.address,
    }
  },
  ReverseRegistrar: {
    abi: ReverseRegistrar80001.abi,
    address: {
      // // 97: ReverseRegistrar97.address,
      80001: ReverseRegistrar80001.address,
    }
  },
  Root: {
    abi: Root80001.abi,
    address: {
      // // 97: Root97.address,
      80001: Root80001.address,
    }
  },
  StablePriceOracle: {
    abi: StablePriceOracle80001.abi,
    address: {
      // // 97: StablePriceOracle97.address,
      80001: StablePriceOracle80001.address,
    }
  },
  BulkRenewal: {
    abi: BulkRenewal80001.abi,
    address: {
      // 97: BulkRenewal97.address,
      80001: BulkRenewal80001.address,
    }
  },
  MIDRegistrarMigrationController: {
    abi: MIDRegistrarMigrationController80001.abi,
    address: {
      // 97: BulkRenewal97.address,
      80001: MIDRegistrarMigrationController80001.address,
    }
  }
}
