export const CONTRACT_ADDRESS = '0x93c58EE47c4778A7977C0dF55723b5A408FABc88';

export const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'euint8',
        name: 'x',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'euint8',
        name: 'y',
        type: 'bytes32',
      },
    ],
    name: 'PlayerJoined',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'euint8',
        name: 'x',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'euint8',
        name: 'y',
        type: 'bytes32',
      },
    ],
    name: 'BuildingPlaced',
    type: 'event',
  },
  {
    inputs: [],
    name: 'MAP_SIZE',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'externalEuint8',
        name: 'encryptedX',
        type: 'bytes32',
      },
      {
        internalType: 'externalEuint8',
        name: 'encryptedY',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: 'inputProof',
        type: 'bytes',
      },
    ],
    name: 'build',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
    ],
    name: 'getBuildingPosition',
    outputs: [
      {
        internalType: 'euint8',
        name: '',
        type: 'bytes32',
      },
      {
        internalType: 'euint8',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
    ],
    name: 'getPlayerPosition',
    outputs: [
      {
        internalType: 'euint8',
        name: '',
        type: 'bytes32',
      },
      {
        internalType: 'euint8',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
    ],
    name: 'hasBuilding',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
    ],
    name: 'hasJoined',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'join',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
