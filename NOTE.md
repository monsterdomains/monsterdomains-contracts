## MIDRegistrarController

identified with onchain, only baseimpl var name diff

## Register Impl
https://etherscan.io/address/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85

almost same, and better

## Price oracle & Safemath & MID & BaseRegistrar & LinearPremiumPriceOracle &
## MIDRegistry & MIDRegistryWithFallback(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e)

same

## BulkRenewal

same to space id, except:
- MID_NAMEHASH 

## oracle
https://etherscan.io/address/0xCF7fe2e614f568989869F4AADe060F4EB8a105BE#code
almost same

## PublicResolver

https://etherscan.io/address/0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41#code


## ABIResolver, AddrResolver, ContentHashResolver, DNSResolver, InterfaceResolver, NameResolver, PubkeyResolver, TextResolver

same



## Methods
### access control
- `Root` node owner, allocate top level domains
- `Registry` implementation, only controllers can call, including MIDRegistrarController
- `Registry` only cares about hirearchy access
- Resolvers, access controll aligns to `Registry`


### PublicResolver
get public resolver
`Registry`
- mid.owner(namehash("resolver.bnb"))
get address of a node
`AddrResolver`
- setAddr(bytes32 node, address addr)
- addr(bytes32 node)


### Reverse registrar
`DefaultReverseResolver`
save node --> name string,
`ReverseRegistrar`
just a wrapper of `DefaultReverseResolver`



## TODOS
- Add missing test for implementation contract metadata interfaces // not used
- Grace period should set to 0