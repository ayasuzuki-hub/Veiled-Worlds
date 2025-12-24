import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("task:address", "Prints the VeiledWorlds address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const veiledWorlds = await deployments.get("VeiledWorlds");

  console.log("VeiledWorlds address is " + veiledWorlds.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:join
 *   - npx hardhat --network sepolia task:join
 */
task("task:join", "Calls join() on the VeiledWorlds contract")
  .addOptionalParam("address", "Optionally specify the VeiledWorlds contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const veiledWorldsDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VeiledWorlds");
    console.log(`VeiledWorlds: ${veiledWorldsDeployment.address}`);

    const signers = await ethers.getSigners();
    const veiledWorldsContract = await ethers.getContractAt("VeiledWorlds", veiledWorldsDeployment.address);

    const tx = await veiledWorldsContract.connect(signers[0]).join();
    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-position
 *   - npx hardhat --network sepolia task:decrypt-position
 */
task("task:decrypt-position", "Decrypts the player position")
  .addOptionalParam("address", "Optionally specify the VeiledWorlds contract address")
  .addOptionalParam("player", "Optionally specify the player address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const veiledWorldsDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VeiledWorlds");
    console.log(`VeiledWorlds: ${veiledWorldsDeployment.address}`);

    const signers = await ethers.getSigners();
    const playerAddress = taskArguments.player ?? signers[0].address;

    const veiledWorldsContract = await ethers.getContractAt("VeiledWorlds", veiledWorldsDeployment.address);
    const [encryptedX, encryptedY] = await veiledWorldsContract.getPlayerPosition(playerAddress);

    const clearX = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedX,
      veiledWorldsDeployment.address,
      signers[0],
    );
    const clearY = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedY,
      veiledWorldsDeployment.address,
      signers[0],
    );

    console.log(`Encrypted position: ${encryptedX}, ${encryptedY}`);
    console.log(`Clear position    : (${clearX}, ${clearY})`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:build --x 4 --y 7
 *   - npx hardhat --network sepolia task:build --x 4 --y 7
 */
task("task:build", "Builds a structure with encrypted coordinates")
  .addOptionalParam("address", "Optionally specify the VeiledWorlds contract address")
  .addParam("x", "The x coordinate (1-10)")
  .addParam("y", "The y coordinate (1-10)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const x = parseInt(taskArguments.x);
    const y = parseInt(taskArguments.y);
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw new Error(`Arguments --x and --y must be integers`);
    }

    await fhevm.initializeCLIApi();

    const veiledWorldsDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VeiledWorlds");
    console.log(`VeiledWorlds: ${veiledWorldsDeployment.address}`);

    const signers = await ethers.getSigners();
    const veiledWorldsContract = await ethers.getContractAt("VeiledWorlds", veiledWorldsDeployment.address);

    const encryptedInput = await fhevm
      .createEncryptedInput(veiledWorldsDeployment.address, signers[0].address)
      .add8(x)
      .add8(y)
      .encrypt();

    const tx = await veiledWorldsContract
      .connect(signers[0])
      .build(encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-building
 *   - npx hardhat --network sepolia task:decrypt-building
 */
task("task:decrypt-building", "Decrypts the player building position")
  .addOptionalParam("address", "Optionally specify the VeiledWorlds contract address")
  .addOptionalParam("player", "Optionally specify the player address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const veiledWorldsDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VeiledWorlds");
    console.log(`VeiledWorlds: ${veiledWorldsDeployment.address}`);

    const signers = await ethers.getSigners();
    const playerAddress = taskArguments.player ?? signers[0].address;

    const veiledWorldsContract = await ethers.getContractAt("VeiledWorlds", veiledWorldsDeployment.address);
    const [encryptedX, encryptedY] = await veiledWorldsContract.getBuildingPosition(playerAddress);

    const clearX = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedX,
      veiledWorldsDeployment.address,
      signers[0],
    );
    const clearY = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedY,
      veiledWorldsDeployment.address,
      signers[0],
    );

    console.log(`Encrypted building: ${encryptedX}, ${encryptedY}`);
    console.log(`Clear building    : (${clearX}, ${clearY})`);
  });
