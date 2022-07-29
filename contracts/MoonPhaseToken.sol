// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * NFT contract representing the Jeff Koons Moon Phase project. Implements the
 * ERC721 NFT standard; extends a number of interfaces and library supercontracts.
 *
 * IERC721: non-fungible token interface standard.
 * ERC721Enumerable: ERC721 extension allowing enumeration of all token IDs
 *    and those owned by a particular user. Moon Phase tokens do not have
 *    sequential IDs.
 * ERC721URIStorage: allow updating of ERC721 tokenURIs as the moon mission proceeds.
 * AccessControlEnumerable: manages administration roles for the following actions,
 *    with roles being independently renounced as they are no longer needed.
 *      Royalty CHANGES: ROYALTY_ROLE can set royalty recipients.
 *      Shipping Status Updates: SHIPPER_ROLE can set a field representing physical trophy status
 *      Token Minting: MINTER_ROLE can create the 125 tokens
 *      URI Updates: UPDATER_ROLE can alter the tokenURI when appropriate
 * Ownable: used to report royalty recipient to OpenSea and make sale edits
 * EIP-2981: used to report royalty recipient in a future-proof way (NFT Royalty Standard)
 */
contract MoonPhaseToken is
    Context,
    AccessControlEnumerable,
    Ownable,
    ERC721URIStorage,
    ERC721Enumerable,
    IERC2981
{
    event TrophyStatusChanged(uint256 indexed tokenId, string trophyStatus);
    event TokenURIChanged(uint256 indexed tokenId, string tokenURI);
    event ProvenanceRecordChanged(string documentationURI, string documentationHash, string provenanceHash);
    event RoyaltyChanged(address indexed receiver, uint256 percentBips);

    bytes32 public constant ROYALTY_ADMIN = keccak256("ROYALTY_ADMIN");
    bytes32 public constant SHIPPER_ADMIN = keccak256("SHIPPER_ADMIN");
    bytes32 public constant UPDATER_ADMIN = keccak256("UPDATER_ADMIN");
    bytes32 public constant MINTER_ADMIN = keccak256("MINTER_ADMIN");

    bytes32 public constant ROYALTY_ROLE = keccak256("ROYALTY_ROLE");
    bytes32 public constant SHIPPER_ROLE = keccak256("SHIPPER_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 constant STATUS_IN_PROGRESS = 0;
    uint256 constant STATUS_READY_TO_SHIP = 1;
    uint256 constant STATUS_IN_TRANSIT = 2;
    uint256 constant STATUS_RECEIVED = 3;

    // Trophy Status
    mapping(uint256 => uint256) private _trophyStatus;

    // Royalty Receiver
    address public royaltyReceiver;
    uint256 public royaltyPercentBips; // eg 10% royalty would be 1000 bips

    // Provenance hash
    string public provenanceDocumentationURI = "";
    string public provenanceDocumentationHash = "";
    string public provenanceHash = "";

    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `ROYALTY_ROLE`, `SHIPPER_ROLE`,
     * `UPDATER_ROLE`, and `MINTER_ROLE` to the account that deploys the contract.
     *
     * Token URIs are provided at minting time and may be  altered by anyone with `UPDATER_ROLE`.
     * See {ERC721-tokenURI}.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _royaltyReceiver,
        uint256 _royaltyPercentBips
    ) ERC721(_name, _symbol) {
        // confirm receiver
        require(_royaltyReceiver != address(0), "MoonPhaseToken: receiver is the zero address");

        // set royalties
        _setRoyalty(_royaltyReceiver, _royaltyPercentBips);

        // set role administration: each ADMIN role administrates itself
        // and a subordinate feature role. There is no SUPERADMIN so individual
        // features can be permanently abandoned when all authorized users
        // renounce it.
        _setRoleAdmin(ROYALTY_ADMIN, ROYALTY_ADMIN);
        _setRoleAdmin(ROYALTY_ROLE, ROYALTY_ADMIN);

        _setRoleAdmin(SHIPPER_ADMIN, SHIPPER_ADMIN);
        _setRoleAdmin(SHIPPER_ROLE, SHIPPER_ADMIN);

        _setRoleAdmin(UPDATER_ADMIN, UPDATER_ADMIN);
        _setRoleAdmin(UPDATER_ROLE, UPDATER_ADMIN);

        _setRoleAdmin(MINTER_ADMIN, MINTER_ADMIN);
        _setRoleAdmin(MINTER_ROLE, MINTER_ADMIN);

        // set deployer as initial admin for all features
        _grantRole(ROYALTY_ADMIN, _msgSender());
        _grantRole(SHIPPER_ADMIN, _msgSender());
        _grantRole(UPDATER_ADMIN, _msgSender());
        _grantRole(MINTER_ADMIN, _msgSender());

        _grantRole(ROYALTY_ROLE, _msgSender());
        _grantRole(SHIPPER_ROLE, _msgSender());
        _grantRole(UPDATER_ROLE, _msgSender());
        _grantRole(MINTER_ROLE, _msgSender());
    }

    /**
     * @notice Safely mint a token (checks contract recipient for compatibility).
     *
     * * Requirements:
     *
     * - `tokenId` must not yet exist.
     * - the caller must have the `MINTER_ROLE`.
     */
    function safeMint(address to, uint256 tokenId, bytes memory _data, string memory _tokenURI) external virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), "MoonPhaseToken: must have minter role to safeMint");
        _safeMint(to, tokenId, _data);
        _setTokenURI(tokenId, _tokenURI);
        // default status; no need to set
        // _setTrophyStatus(tokenId, STATUS_IN_PROGRESS);
    }

    /**
     * @notice Mint a token (does not check contract recipient for compatibility).
     *
     * * Requirements:
     *
     * - `tokenId` must not yet exist.
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 tokenId, string memory _tokenURI) external virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), "MoonPhaseToken: must have minter role to mint");
        _mint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        // default status; no need to set
        // _setTrophyStatus(tokenId, STATUS_IN_PROGRESS);
    }

    /**
     * @notice Burns a token. An emergency feature if a token is inappropriately
     * minted (e.g. with incorrect tokenUri or tokenId) that will be disabled
     * once minting is complete (by fully renouncing MINTER roll).
     *
     * * Requirements:
     *
     * - `tokenId` must exist.
     * - the caller must have the `MINTER_ROLE`.
     */
    function burn(uint256 tokenId) external virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), "MoonPhaseToken: must have minter role to burn");
        require(_exists(tokenId), "MoonPhaseToken: burn of nonexistent token");
        // reset status and destroy the token
        _setTrophyStatus(tokenId, STATUS_IN_PROGRESS);
        _burn(tokenId);
    }

    /**
     * @notice Update the tokenURI for the given tokenId.
     *
     * * Requirements:
     *
     * - `tokenId` must exist.
     * - the caller must have the `UPDATER_ROLE`.
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external virtual {
        require(hasRole(UPDATER_ROLE, _msgSender()), "MoonPhaseToken: must have updater role to setTokenURI");
        _setTokenURI(tokenId, _tokenURI);
        emit TokenURIChanged(tokenId, _tokenURI);
    }

    /**
     * @notice Update the provenance documentation and hash for the token.
     * The documentation describes the process for calculating a provenance
     * record to verify token URI content. As token content is updated
     * (until the final update) its format may change, and correspondingly
     * the process of calculating a provenance record and the hash of
     * that record.
     *
     * * Requirements:
     *
     *  - the caller must have the `UPDATER_ROLE`.
     */
    function setProvenanceRecord(
        string memory _documentationURI,
        string memory _documentationHash,
        string memory _provenanceHash
    ) external virtual {
        require(hasRole(UPDATER_ROLE, _msgSender()), "MoonPhaseToken: must have updater role to setProvenanceRecord");
        provenanceDocumentationURI = _documentationURI;
        provenanceDocumentationHash = _documentationHash;
        provenanceHash = _provenanceHash;
        emit ProvenanceRecordChanged(provenanceDocumentationURI, provenanceDocumentationHash, provenanceHash);
    }

    /**
     * @notice Update the provenance hash for the token. The provenance record
     * is calculated and hashed according to the instructions given in
     * `provenanceDocumentationURI`.
     *
     * * Requirements:
     *
     *  - the caller must have the `UPDATER_ROLE`.
     */
    function setProvenanceHash(string memory _provenanceHash) external virtual {
        require(hasRole(UPDATER_ROLE, _msgSender()), "MoonPhaseToken: must have updater role to setProvenanceHash");
        provenanceHash = _provenanceHash;
        emit ProvenanceRecordChanged(provenanceDocumentationURI, provenanceDocumentationHash, provenanceHash);
    }

    /**
     * @notice Report the status of the physical trophy associated with the token.
     *
     * * Requirements:
     *
     * - `tokenId` must exist.
     */
    function trophyStatus(uint256 tokenId) public virtual view returns (string memory) {
        require(_exists(tokenId), "MoonPhaseToken: trophyStatus of nonexistent token");
        uint256 status = _trophyStatus[tokenId];
        if (status == STATUS_RECEIVED) {
            return "Received";
        } else if (status == STATUS_IN_TRANSIT) {
            return "In Transit";
        } else if (status == STATUS_READY_TO_SHIP) {
            return "Ready to Ship";
        } else {
            return "In Progress";
        }
    }

    /**
     * @notice Sets the status of the physical trophy associated with the token.
     *
     * * Requirements:
     *
     * - `tokenId` must exist.
     * - the caller must have the `SHIPPER_ROLE`.
     */
    function setTrophyStatus(uint256 tokenId, uint256 status) external virtual {
        require(hasRole(SHIPPER_ROLE, _msgSender()), "MoonPhaseToken: must have shipper role to setTrophyStatus");
        _setTrophyStatus(tokenId, status);
        emit TrophyStatusChanged(tokenId, trophyStatus(tokenId));
    }

    function _setTrophyStatus(uint256 tokenId, uint256 status) internal virtual {
        require(_exists(tokenId), "MoonPhaseToken: setTrophyStatus of nonexistent token");
        require(0 <= status && status <= 3, "MoonPhaseToken: setTrophyStatus for invalid status");

        _trophyStatus[tokenId] = status;
    }

    /**
     * @notice Called with the sale price to determine how much royalty is owed and to whom.
     */
    function royaltyInfo(
        uint256, /*_tokenId*/
        uint256 _salePrice
    )
        external
        view
        virtual
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = address(royaltyReceiver);
        require(receiver != address(0), "MoonPhaseToken: receiver is the zero address");
        royaltyAmount = (_salePrice * royaltyPercentBips) / 10000; // 10,000 is 100% in bips
    }

    /**
     * @dev Sets the royalty assessed for token sales using EIP-2981's `royaltyInfo`.
     * If `updateOwner`, also sets the `owner` field for `Ownable`.
     *
     * * Requirements:
     *
     * - `receiver` is not the zero-address
     * - `percentBIPS` is in [0, 10000]
     * - the caller must have the `ROYALTY_ROLE`.
     */
    function setRoyalty(address receiver, uint256 percentBips) external virtual {
        require(hasRole(ROYALTY_ROLE, _msgSender()), "MoonPhaseToken: must have royalty role to setRoyalty");
        require(receiver != address(0), "MoonPhaseToken: new receiver is the zero address");
        _setRoyalty(receiver, percentBips);
        emit RoyaltyChanged(receiver, percentBips);
    }

    function _setRoyalty(address receiver, uint256 percentBips) internal virtual {
        require(percentBips <= 10000, "MoonPhaseToken: royalty percent BIPS must be <= 10000");

        royaltyReceiver = receiver;
        royaltyPercentBips = percentBips;
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override(
        ERC721,
        ERC721URIStorage
    ) returns (string memory) {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(
        AccessControlEnumerable,
        ERC721,
        ERC721Enumerable,
        IERC165
    ) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(
        ERC721,
        ERC721Enumerable
    ) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(
        uint256 tokenId
    ) internal virtual override(
        ERC721,
        ERC721URIStorage
    ) {
        super._burn(tokenId);
    }
}
