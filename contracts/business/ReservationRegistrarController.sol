
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../cidregistrar/StringUtils.sol";
import "../cidregistrar/MIDRegistrarController.sol";
import "./IWishlist.sol";


/**
 * To make some domains reserved for future usage
 */
contract ReservationRegistrarController is MIDRegistrarController {
    using StringUtils for *;

    bytes32 public baseNode;

    // default auction list, which will always be alive and nobody can register than till we release them
    uint256[] public auctionList;

    // wishlist contract
    IWishlist public wishlist;

    // reservation period, out of which we    
    uint256 public reservationPhraseStart;
    uint256 public reservationPhraseEnd;

    event ReservedTokenAdded(uint256 indexed count);

    constructor(
        address wishlist_,
        bytes32 baseNode_,
        uint256 reservationPhraseStart_,
        uint256 reservationPhraseEnd_,
        // parent initial parameters
        BaseRegistrarImplementation _base, 
        PriceOracle _prices, 
        uint _minCommitmentAge, 
        uint _maxCommitmentAge
    ) MIDRegistrarController(_base, _prices, _minCommitmentAge, _maxCommitmentAge) {
        initialize(wishlist_, baseNode_, reservationPhraseStart_, reservationPhraseEnd_);
    }


    function initialize(address wishlist_, bytes32 baseNode_, uint256 reservationPhraseStart_, uint256 reservationPhraseEnd_) public onlyOwner {
        require(wishlist_ != address(0), "invalid parameters");
        baseNode = baseNode_;
        wishlist = IWishlist(wishlist_);
        reservationPhraseStart = reservationPhraseStart_;
        reservationPhraseEnd = reservationPhraseEnd_;
        // must be for the same root domain
        require(wishlist.baseNode() == baseNode, "wrong wishlist");
    }

    function isReservationAlive() public view returns (bool) {
        return block.timestamp > reservationPhraseStart && block.timestamp < reservationPhraseEnd;
    }

    // register a reserved name for a particular user
    // NOTE: name is label name without suffix
    function registerWithConfig(string memory name, address owner, uint duration, bytes32 secret, address resolver, address addr) public payable override {
        require(isReservationAlive(), "reservation not alive");

        // A name can be registered in reserved phrase when only one user has wished it
        require(wishlist.wishCounts(keccak256(bytes(name))) == 1, "wish count must be 1");
        require(wishlist.userHasWish(owner, name), "not owner's wish");
        
        // if user has registered, it will fail
        super.registerWithConfig(name, owner, duration, secret, resolver, addr);
    }
}