// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Veiled Worlds
/// @notice Players join a 10x10 encrypted map and build encrypted structures.
contract VeiledWorlds is ZamaEthereumConfig {
    uint8 public constant MAP_SIZE = 10;

    struct Position {
        euint8 x;
        euint8 y;
    }

    mapping(address => bool) private _joined;
    mapping(address => Position) private _playerPositions;
    mapping(address => Position) private _buildingPositions;
    mapping(address => bool) private _hasBuilding;

    event PlayerJoined(address indexed player, euint8 x, euint8 y);
    event BuildingPlaced(address indexed player, euint8 x, euint8 y);

    /// @notice Join the map and receive a random encrypted position.
    function join() external {
        require(!_joined[msg.sender], "Player already joined");

        euint8 randomX = FHE.randEuint8(MAP_SIZE);
        euint8 randomY = FHE.randEuint8(MAP_SIZE);

        euint8 x = FHE.add(randomX, FHE.asEuint8(1));
        euint8 y = FHE.add(randomY, FHE.asEuint8(1));

        _joined[msg.sender] = true;
        _playerPositions[msg.sender] = Position({x: x, y: y});

        FHE.allowThis(x);
        FHE.allowThis(y);
        FHE.allow(x, msg.sender);
        FHE.allow(y, msg.sender);

        emit PlayerJoined(msg.sender, x, y);
    }

    /// @notice Build an encrypted structure at a player-chosen encrypted position.
    /// @param encryptedX The encrypted x coordinate input
    /// @param encryptedY The encrypted y coordinate input
    /// @param inputProof The input proof
    function build(externalEuint8 encryptedX, externalEuint8 encryptedY, bytes calldata inputProof) external {
        require(_joined[msg.sender], "Player not joined");

        euint8 rawX = FHE.fromExternal(encryptedX, inputProof);
        euint8 rawY = FHE.fromExternal(encryptedY, inputProof);

        euint8 clampedX = FHE.add(FHE.rem(rawX, MAP_SIZE), FHE.asEuint8(1));
        euint8 clampedY = FHE.add(FHE.rem(rawY, MAP_SIZE), FHE.asEuint8(1));

        _buildingPositions[msg.sender] = Position({x: clampedX, y: clampedY});
        _hasBuilding[msg.sender] = true;

        FHE.allowThis(clampedX);
        FHE.allowThis(clampedY);
        FHE.allow(clampedX, msg.sender);
        FHE.allow(clampedY, msg.sender);

        emit BuildingPlaced(msg.sender, clampedX, clampedY);
    }

    /// @notice Returns the encrypted player position for a given address.
    function getPlayerPosition(address player) external view returns (euint8, euint8) {
        require(_joined[player], "Player not joined");
        Position storage pos = _playerPositions[player];
        return (pos.x, pos.y);
    }

    /// @notice Returns the encrypted building position for a given address.
    function getBuildingPosition(address player) external view returns (euint8, euint8) {
        require(_hasBuilding[player], "No building");
        Position storage pos = _buildingPositions[player];
        return (pos.x, pos.y);
    }

    /// @notice Returns whether a player has joined.
    function hasJoined(address player) external view returns (bool) {
        return _joined[player];
    }

    /// @notice Returns whether a player has built a structure.
    function hasBuilding(address player) external view returns (bool) {
        return _hasBuilding[player];
    }
}
