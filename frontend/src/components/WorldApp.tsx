import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Contract } from 'ethers';
import { isAddress } from 'viem';

import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { Header } from './Header';
import '../styles/WorldApp.css';

type Position = {
  x: number;
  y: number;
};

const GRID_SIZE = 10;

export function WorldApp() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESS);
  const [hasJoined, setHasJoined] = useState(false);
  const [hasBuilding, setHasBuilding] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<Position | null>(null);
  const [buildingPosition, setBuildingPosition] = useState<Position | null>(null);
  const [joinPending, setJoinPending] = useState(false);
  const [buildPending, setBuildPending] = useState(false);
  const [revealPending, setRevealPending] = useState(false);
  const [revealBuildingPending, setRevealBuildingPending] = useState(false);
  const [buildX, setBuildX] = useState('1');
  const [buildY, setBuildY] = useState('1');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const activeAddress = useMemo(
    () => (isAddress(contractAddress) ? contractAddress : ''),
    [contractAddress],
  );

  const refreshStatus = useCallback(async () => {
    if (!publicClient || !address || !activeAddress) {
      setHasJoined(false);
      setHasBuilding(false);
      return;
    }

    try {
      const joined = await publicClient.readContract({
        address: activeAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'hasJoined',
        args: [address],
      });

      const joinedValue = Boolean(joined);
      setHasJoined(joinedValue);

      if (joinedValue) {
        const built = await publicClient.readContract({
          address: activeAddress as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'hasBuilding',
          args: [address],
        });
        setHasBuilding(Boolean(built));
      } else {
        setHasBuilding(false);
      }
    } catch (err) {
      console.error('Failed to read status:', err);
      setHasJoined(false);
      setHasBuilding(false);
    }
  }, [publicClient, address, activeAddress]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const decryptHandle = useCallback(
    async (handle: `0x${string}`) => {
      if (!instance || !signerPromise || !address || !activeAddress) {
        throw new Error('Missing encryption setup');
      }

      const signer = await signerPromise;
      const keypair = instance.generateKeypair();
      const contractAddresses = [activeAddress];
      const handleContractPairs = [
        {
          handle,
          contractAddress: activeAddress,
        },
      ];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays,
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays,
      );

      const value = result[handle];
      if (typeof value === 'bigint') {
        return Number(value);
      }

      return Number(value);
    },
    [instance, signerPromise, address, activeAddress],
  );

  const handleJoin = async () => {
    setError('');
    setNotice('');

    if (!isConnected || !signerPromise || !activeAddress) {
      setError('Connect your wallet and set a valid contract address.');
      return;
    }

    setJoinPending(true);
    try {
      const signer = await signerPromise;
      const contract = new Contract(activeAddress, CONTRACT_ABI, signer);
      const tx = await contract.join();
      await tx.wait();
      setNotice('Joined the map. Your coordinates are encrypted.');
      setPlayerPosition(null);
      await refreshStatus();
    } catch (err) {
      console.error('Join failed:', err);
      setError('Join failed. Check the transaction and try again.');
    } finally {
      setJoinPending(false);
    }
  };

  const handleRevealPosition = async () => {
    setError('');
    setNotice('');

    if (!publicClient || !address || !activeAddress) {
      setError('Connect your wallet and set a valid contract address.');
      return;
    }

    setRevealPending(true);
    try {
      const [encryptedX, encryptedY] = (await publicClient.readContract({
        address: activeAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'getPlayerPosition',
        args: [address],
      })) as [`0x${string}`, `0x${string}`];

      const clearX = await decryptHandle(encryptedX);
      const clearY = await decryptHandle(encryptedY);
      setPlayerPosition({ x: clearX, y: clearY });
      setNotice(`Position revealed: (${clearX}, ${clearY}).`);
    } catch (err) {
      console.error('Reveal failed:', err);
      setError('Could not decrypt position. Make sure you have joined.');
    } finally {
      setRevealPending(false);
    }
  };

  const handleBuild = async () => {
    setError('');
    setNotice('');

    if (!instance || !isConnected || !signerPromise || !address || !activeAddress) {
      setError('Connect your wallet, wait for encryption, and set a valid contract address.');
      return;
    }

    const parsedX = Number(buildX);
    const parsedY = Number(buildY);
    if (!Number.isInteger(parsedX) || !Number.isInteger(parsedY)) {
      setError('Building coordinates must be whole numbers.');
      return;
    }

    setBuildPending(true);
    try {
      const input = instance.createEncryptedInput(activeAddress, address);
      input.add8(parsedX);
      input.add8(parsedY);
      const encryptedInput = await input.encrypt();

      const signer = await signerPromise;
      const contract = new Contract(activeAddress, CONTRACT_ABI, signer);
      const tx = await contract.build(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof,
      );
      await tx.wait();
      setNotice('Structure anchored. Reveal to see the exact location.');
      setBuildingPosition(null);
      await refreshStatus();
    } catch (err) {
      console.error('Build failed:', err);
      setError('Build failed. Check the transaction and try again.');
    } finally {
      setBuildPending(false);
    }
  };

  const handleRevealBuilding = async () => {
    setError('');
    setNotice('');

    if (!publicClient || !address || !activeAddress) {
      setError('Connect your wallet and set a valid contract address.');
      return;
    }

    setRevealBuildingPending(true);
    try {
      const [encryptedX, encryptedY] = (await publicClient.readContract({
        address: activeAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'getBuildingPosition',
        args: [address],
      })) as [`0x${string}`, `0x${string}`];

      const clearX = await decryptHandle(encryptedX);
      const clearY = await decryptHandle(encryptedY);
      setBuildingPosition({ x: clearX, y: clearY });
      setNotice(`Building revealed: (${clearX}, ${clearY}).`);
    } catch (err) {
      console.error('Building reveal failed:', err);
      setError('Could not decrypt building. Make sure you have built.');
    } finally {
      setRevealBuildingPending(false);
    }
  };

  const coordinateLabel = useMemo(() => {
    if (!playerPosition) {
      return 'Unknown';
    }
    return `(${playerPosition.x}, ${playerPosition.y})`;
  }, [playerPosition]);

  const buildingLabel = useMemo(() => {
    if (!buildingPosition) {
      return 'Unknown';
    }
    return `(${buildingPosition.x}, ${buildingPosition.y})`;
  }, [buildingPosition]);

  const gridCells = useMemo(() => {
    const cells = [];
    for (let y = GRID_SIZE; y >= 1; y -= 1) {
      for (let x = 1; x <= GRID_SIZE; x += 1) {
        const isPlayer = playerPosition?.x === x && playerPosition?.y === y;
        const isBuilding = buildingPosition?.x === x && buildingPosition?.y === y;
        const cellLabel = isPlayer && isBuilding ? 'PB' : isPlayer ? 'P' : isBuilding ? 'B' : '';

        cells.push(
          <div
            key={`cell-${x}-${y}`}
            className={`map-cell${isPlayer ? ' map-cell-player' : ''}${
              isBuilding ? ' map-cell-building' : ''
            }`}
          >
            <span className="map-cell-label">{cellLabel}</span>
          </div>,
        );
      }
    }
    return cells;
  }, [playerPosition, buildingPosition]);

  return (
    <div className="world-app">
      <Header />
      <main className="world-main">
        <section className="world-hero">
          <div className="world-hero-card">
            <div className="hero-copy">
              <p className="hero-eyebrow">Encrypted exploration</p>
              <h2>Claim a hidden coordinate on a 10x10 grid.</h2>
              <p>
                Join the map to receive a Zama-random position, then build a structure with encrypted
                coordinates you control.
              </p>
            </div>
            <div className="hero-status">
              <div className="status-item">
                <span className="status-label">Position</span>
                <span className="status-value">{coordinateLabel}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Building</span>
                <span className="status-value">{buildingLabel}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Encryption</span>
                <span className="status-value">
                  {zamaLoading ? 'Loading' : zamaError ? 'Error' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="world-layout">
          <div className="world-panel">
            <div className="panel-card">
              <h3>Access</h3>
              <p className="panel-description">
                Set the deployed contract address and connect your wallet to sync the encrypted world.
              </p>
              <label className="input-label">Contract address</label>
              <input
                className="text-input"
                value={contractAddress}
                onChange={(event) => setContractAddress(event.target.value.trim())}
                placeholder="0x..."
              />
              <div className="panel-meta">
                <span className={activeAddress ? 'meta-ok' : 'meta-warn'}>
                  {activeAddress ? 'Address valid' : 'Invalid address'}
                </span>
                <span>{isConnected ? 'Wallet connected' : 'Wallet disconnected'}</span>
              </div>
            </div>

            <div className="panel-card">
              <h3>Join the map</h3>
              <p className="panel-description">
                Each player is assigned a random coordinate using FHE randomness. Reveal only when
                ready.
              </p>
              <div className="panel-actions">
                <button
                  className="primary-button"
                  onClick={handleJoin}
                  disabled={joinPending || !activeAddress || hasJoined}
                >
                  {joinPending ? 'Joining...' : hasJoined ? 'Rejoin disabled' : 'Join now'}
                </button>
                <button
                  className="ghost-button"
                  onClick={handleRevealPosition}
                  disabled={revealPending || !hasJoined}
                >
                  {revealPending ? 'Decrypting...' : 'Reveal position'}
                </button>
              </div>
              <div className="panel-meta">
                <span>{hasJoined ? 'Joined' : 'Not joined'}</span>
              </div>
            </div>

            <div className="panel-card">
              <h3>Build a structure</h3>
              <p className="panel-description">
                Choose coordinates between 1 and 10. Values are encrypted client-side before sending.
              </p>
              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">X</label>
                  <input
                    className="text-input"
                    value={buildX}
                    onChange={(event) => setBuildX(event.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Y</label>
                  <input
                    className="text-input"
                    value={buildY}
                    onChange={(event) => setBuildY(event.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="panel-actions">
                <button
                  className="primary-button"
                  onClick={handleBuild}
                  disabled={buildPending || !hasJoined}
                >
                  {buildPending ? 'Encrypting...' : hasBuilding ? 'Rebuild' : 'Build'}
                </button>
                <button
                  className="ghost-button"
                  onClick={handleRevealBuilding}
                  disabled={revealBuildingPending || !hasBuilding}
                >
                  {revealBuildingPending ? 'Decrypting...' : 'Reveal building'}
                </button>
              </div>
              <div className="panel-meta">
                <span>{hasBuilding ? 'Building placed' : 'No building yet'}</span>
              </div>
            </div>

            {(notice || error) && (
              <div className={`panel-alert ${error ? 'panel-alert-error' : 'panel-alert-note'}`}>
                {error || notice}
              </div>
            )}
          </div>

          <div className="world-map">
            <div className="map-header">
              <h3>Encrypted grid</h3>
              <p className="panel-description">Reveal your coordinates to light up the map.</p>
              <div className="map-legend">
                <div className="legend-item">
                  <span className="legend-dot legend-player" />
                  <span>Player</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-building" />
                  <span>Building</span>
                </div>
              </div>
            </div>
            <div className="map-grid">{gridCells}</div>
            <div className="map-footer">
              <span>Grid size: {GRID_SIZE} x {GRID_SIZE}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
