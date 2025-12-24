import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedVeiledWorlds = await deploy("VeiledWorlds", {
    from: deployer,
    log: true,
  });

  console.log(`VeiledWorlds contract: `, deployedVeiledWorlds.address);
};
export default func;
func.id = "deploy_veiledWorlds"; // id required to prevent reexecution
func.tags = ["VeiledWorlds"];
