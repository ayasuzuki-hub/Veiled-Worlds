import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { VeiledWorlds } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("VeiledWorldsSepolia", function () {
  let signers: Signers;
  let veiledWorldsContract: VeiledWorlds;
  let veiledWorldsContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const veiledWorldsDeployment = await deployments.get("VeiledWorlds");
      veiledWorldsContractAddress = veiledWorldsDeployment.address;
      veiledWorldsContract = await ethers.getContractAt("VeiledWorlds", veiledWorldsDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("joins and decrypts position", async function () {
    steps = 8;

    this.timeout(4 * 40000);

    progress(`Call VeiledWorlds.join()...`);
    let tx = await veiledWorldsContract.connect(signers.alice).join();
    await tx.wait();

    progress(`Call VeiledWorlds.getPlayerPosition()...`);
    const [encryptedX, encryptedY] = await veiledWorldsContract.getPlayerPosition(signers.alice.address);
    expect(encryptedX).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting position...`);
    const clearX = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedX,
      veiledWorldsContractAddress,
      signers.alice,
    );
    const clearY = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedY,
      veiledWorldsContractAddress,
      signers.alice,
    );
    progress(`Clear position: (${clearX}, ${clearY})`);

    expect(clearX).to.be.gte(1);
    expect(clearX).to.be.lte(10);
    expect(clearY).to.be.gte(1);
    expect(clearY).to.be.lte(10);
  });
});
