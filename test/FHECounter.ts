import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { VeiledWorlds, VeiledWorlds__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("VeiledWorlds")) as VeiledWorlds__factory;
  const veiledWorldsContract = (await factory.deploy()) as VeiledWorlds;
  const veiledWorldsContractAddress = await veiledWorldsContract.getAddress();

  return { veiledWorldsContract, veiledWorldsContractAddress };
}

describe("VeiledWorlds", function () {
  let signers: Signers;
  let veiledWorldsContract: VeiledWorlds;
  let veiledWorldsContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ veiledWorldsContract, veiledWorldsContractAddress } = await deployFixture());
  });

  it("assigns a random position on join", async function () {
    const tx = await veiledWorldsContract.connect(signers.alice).join();
    await tx.wait();

    const [encryptedX, encryptedY] = await veiledWorldsContract.getPlayerPosition(signers.alice.address);

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

    expect(clearX).to.be.gte(1);
    expect(clearX).to.be.lte(10);
    expect(clearY).to.be.gte(1);
    expect(clearY).to.be.lte(10);
    expect(await veiledWorldsContract.hasJoined(signers.alice.address)).to.eq(true);
  });

  it("rejects double join", async function () {
    let tx = await veiledWorldsContract.connect(signers.alice).join();
    await tx.wait();

    await expect(veiledWorldsContract.connect(signers.alice).join()).to.be.revertedWith("Player already joined");
  });

  it("builds a structure with clamped coordinates", async function () {
    let tx = await veiledWorldsContract.connect(signers.alice).join();
    await tx.wait();

    const encryptedInput = await fhevm
      .createEncryptedInput(veiledWorldsContractAddress, signers.alice.address)
      .add8(12)
      .add8(0)
      .encrypt();

    tx = await veiledWorldsContract
      .connect(signers.alice)
      .build(encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof);
    await tx.wait();

    const [encryptedX, encryptedY] = await veiledWorldsContract.getBuildingPosition(signers.alice.address);

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

    expect(clearX).to.eq(3);
    expect(clearY).to.eq(1);
    expect(await veiledWorldsContract.hasBuilding(signers.alice.address)).to.eq(true);
  });
});
