# Veiled Worlds

Veiled Worlds is a privacy-first on-chain world where players spawn and build inside a 10x10 grid without exposing their
exact coordinates. It uses Zama FHEVM to encrypt positions and building locations on-chain, while still enabling game
logic and user interactions.

## Project Summary

This project demonstrates how fully homomorphic encryption can power a simple but meaningful game loop:
players join, receive a random position on-chain, and build structures at encrypted coordinates. The player can decrypt
their own data to see their position and building locations, while the chain only sees encrypted values.

## Problems Solved

- Protects player location privacy in an on-chain game.
- Enables fair, on-chain randomness without leaking coordinates.
- Demonstrates how to read and write encrypted game state with a real frontend.
- Avoids off-chain trust and mock data; all game state is on-chain.

## Key Advantages

- Confidentiality by default: coordinates and building positions are always encrypted on-chain.
- Deterministic gameplay logic with FHE, no off-chain servers.
- Simple 10x10 grid keeps the cryptographic flow easy to verify.
- Clear separation between encrypted writes (ethers) and reads (viem).

## Gameplay Overview

1. Join the game.
2. A random (x, y) location is generated on-chain using Zama randomness.
3. Click "Decrypt" to reveal your position locally.
4. Build a structure at an encrypted coordinate.
5. Click "Decrypt" to reveal where your building is.

## Data and Privacy Model

- All player positions and building coordinates are stored as encrypted values.
- Decryption happens client-side for the owning player only.
- The blockchain never sees plaintext coordinates.
- View functions avoid using msg.sender; user addresses are provided explicitly where needed.

## Technology Stack

- Smart contracts: Hardhat + Zama FHEVM
- Frontend: React + Vite
- Wallet/UI: RainbowKit
- Reads: viem
- Writes: ethers
- Package manager: npm

## Smart Contracts

Core behaviors implemented in contracts:

- 10x10 map (x and y range 1-10).
- On-chain random spawn using Zama randomness.
- Encrypted storage for player position and building position.
- Decryption flows exposed for the frontend.

## Frontend

The frontend is built on the existing `/frontend` app and must remain consistent with these rules:

- No Tailwind.
- No localhost network.
- No localStorage usage.
- No environment variables.
- No JSON files in the frontend.
- Contract writes use ethers; reads use viem.
- ABI is copied from `deployments/sepolia` and kept in the frontend.

## Repository Structure

```
contracts/    Smart contract sources
deploy/       Deployment scripts
deployments/  Network deployments and ABIs (source of frontend ABI)
docs/         Zama references and integration notes
frontend/     React app
tasks/        Hardhat tasks
test/         Hardhat tests
```

## Setup

### Prerequisites

- Node.js 20+
- npm
- A Sepolia RPC provider (INFURA_API_KEY or equivalent)
- A funded deployer account (PRIVATE_KEY)

### Install

```bash
npm install
```

### Compile and Test

```bash
npm run compile
npm run test
```

### Deploy Locally

```bash
npx hardhat node
npx hardhat deploy --network localhost
```

### Deploy to Sepolia

Ensure `.env` contains `INFURA_API_KEY` and `PRIVATE_KEY`, then:

```bash
npx hardhat deploy --network sepolia
```

## Usage Flow (End-to-End)

1. Deploy contracts to Sepolia.
2. Copy the generated ABI from `deployments/sepolia` into the frontend.
3. Open the frontend, connect a wallet, and join the game.
4. Decrypt to reveal your location.
5. Build and decrypt to reveal the building location.

## Testing Strategy

- Contract unit tests cover encrypted state transitions.
- Tasks validate deployment flow.
- Sepolia tests verify end-to-end randomness and decryption.

## Limitations

- The grid is intentionally small for clarity; scaling would require careful gas and UX work.
- FHE operations are more expensive than plaintext logic.
- Privacy is per-player; sharing decrypted data is a user choice.

## Future Roadmap

- Expand the map size and add region-based mechanics.
- Add multiple building types and encrypted resource costs.
- Introduce encrypted proximity events (discoveries, encounters).
- Improve UX for decryption steps and transaction feedback.
- Add more comprehensive tests and formal verification.

## License

BSD-3-Clause-Clear. See `LICENSE`.
