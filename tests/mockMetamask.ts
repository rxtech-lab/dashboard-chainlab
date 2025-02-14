import { HDNodeWallet } from "ethers";
import { createMetaMaskServer } from "./metamaskServer";

export async function setupMockMetamaskWithPrivateKey(
  privateKey: HDNodeWallet
) {
  // Start the mock MetaMask server
  const { server, address } = await createMetaMaskServer(privateKey);
  return {
    server,
    address,
  };
}
