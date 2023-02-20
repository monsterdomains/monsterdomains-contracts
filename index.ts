export * from './src/types';

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
import DummySourceBaseRegistrar80001 from './deployments/mumbai/DummySourceBaseRegistrar.json';
import DummySourceRegistry80001 from './deployments/mumbai/DummySourceRegistry.json';
import Wishlist80001 from './deployments/mumbai/Wishlist.json';

// bsc
import BaseRegistrarImplementation56 from './deployments/bsc/BaseRegistrarImplementation.json';
import DefaultReverseResolver56 from './deployments/bsc/DefaultReverseResolver.json';
import MIDRegistrarController56 from './deployments/bsc/MIDRegistrarController.json';
import MIDRegistrarMigrationController56 from './deployments/bsc/MIDRegistrarMigrationController.json';
import MIDRegistry56 from './deployments/bsc/MIDRegistry.json';
import PublicResolver56 from './deployments/bsc/PublicResolver.json';
import ReverseRegistrar56 from './deployments/bsc/ReverseRegistrar.json';
import Root56 from './deployments/bsc/Root.json';
import StablePriceOracle56 from './deployments/bsc/StablePriceOracle.json';
import BulkRenewal56 from './deployments/bsc/BulkRenewal.json';
import Wishlist56 from './deployments/bsc/Wishlist.json';


export const deployments = {
  BaseRegistrarImplementation: {
    abi: BaseRegistrarImplementation56.abi,
    address: {
      80001: BaseRegistrarImplementation80001.address,
      56: BaseRegistrarImplementation56.address,
    },
  },
  DefaultReverseResolver: {
    abi: DefaultReverseResolver56.abi,
    address: {
      80001: DefaultReverseResolver80001.address,
      56: DefaultReverseResolver56.address,
    }
  },
  MIDRegistrarController: {
    abi: MIDRegistrarController56.abi,
    address: {
      80001: MIDRegistrarController80001.address,
      56: MIDRegistrarController56.address,
    }
  },
  MIDRegistry: {
    abi: MIDRegistry56.abi,
    address: {
      80001: MIDRegistry80001.address,
      56: MIDRegistry56.address,
    }
  },
  PublicResolver: {
    abi: PublicResolver56.abi,
    address: {
      80001: PublicResolver80001.address,
      56: PublicResolver56.address,
    }
  },
  ReverseRegistrar: {
    abi: ReverseRegistrar56.abi,
    address: {
      80001: ReverseRegistrar80001.address,
      56: ReverseRegistrar56.address,
    }
  },
  Root: {
    abi: Root56.abi,
    address: {
      80001: Root80001.address,
      56: Root56.address,
    }
  },
  StablePriceOracle: {
    abi: StablePriceOracle56.abi,
    address: {
      80001: StablePriceOracle80001.address,
      56: StablePriceOracle56.address,
    }
  },
  BulkRenewal: {
    abi: BulkRenewal56.abi,
    address: {
      80001: BulkRenewal80001.address,
      56: BulkRenewal56.address,
    }
  },
  MIDRegistrarMigrationController: {
    abi: MIDRegistrarMigrationController56.abi,
    address: {
      80001: MIDRegistrarMigrationController80001.address,
      56: MIDRegistrarMigrationController56.address,
    }
  },
  DummySourceBaseRegistrar: {
    abi: DummySourceBaseRegistrar80001.abi,
    address: {
      80001: DummySourceBaseRegistrar80001.address,
      56: '',
    }
  },
  DummySourceRegistry: {
    abi: DummySourceRegistry80001.abi,
    address: {
      80001: DummySourceRegistry80001.address,
      56: '',
    }
  },
  Wishlist: {
    abi: Wishlist56.abi,
    address: {
      80001: Wishlist80001.address,
      56: Wishlist56.address,
    }
  },
}
