import { ethers, HDNodeWallet } from "ethers";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";

interface MetaMaskRequest {
  method: string;
  params?: any[];
}

export async function createMetaMaskServer(wallet: HDNodeWallet) {
  const fastify = Fastify({ logger: false });

  // Register CORS plugin
  await fastify.register(fastifyCors, {
    origin: true, // Allow all origins in test environment
    methods: ["POST"], // Only allow POST requests
  });

  // Handle MetaMask JSON-RPC requests
  fastify.post("/", async (request, reply) => {
    const { method, params = [] } = request.body as MetaMaskRequest;
    let response;
    try {
      switch (method) {
        case "eth_accounts":
        case "eth_requestAccounts":
          response = [wallet.address];
          break;

        case "eth_chainId":
          response = "0x1"; // Mainnet by default
          break;

        case "personal_sign":
          const [message, address] = params;
          response = await wallet.signMessage(ethers.getBytes(message));
          break;

        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      return { data: response };
    } catch (error: any) {
      reply.status(400);
      return { error: error.message };
    }
  });

  const address = await fastify.listen({ port: 4000, host: "0.0.0.0" });
  console.log(`MetaMask server listening at ${address}`);
  return { server: fastify, address };
}
