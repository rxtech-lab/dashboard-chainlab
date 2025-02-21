import { ethers, HDNodeWallet, Wallet } from "ethers";
import Fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";

interface MetaMaskRequest {
  method: string;
  params?: any[];
}

export interface CreateMetaMaskControllerResponse {
  controller: Controller;
  server: FastifyInstance;
}

export interface Controller {
  setWallet: (wallet: HDNodeWallet) => void;
  currentWallet: Wallet | null;
}

class MetaMaskController implements Controller {
  constructor() {}
  private _currentWallet: Wallet | null = null;

  setWallet(wallet: HDNodeWallet) {
    this._currentWallet = new ethers.Wallet(wallet.privateKey);
  }

  get currentWallet() {
    return this._currentWallet;
  }
}

/**
 * Creates a MetaMask server controller that simulates MetaMask behavior
 * @returns {Promise<Controller>} Controller object with server instance and methods to manage wallet
 */
export async function createMetaMaskController(): Promise<CreateMetaMaskControllerResponse> {
  const fastify = Fastify({ logger: false });
  const controller = new MetaMaskController();

  // Register CORS plugin
  await fastify.register(fastifyCors, {
    origin: true, // Allow all origins in test environment
    methods: ["POST"], // Only allow POST requests
  });

  // Handle MetaMask JSON-RPC requests
  fastify.post("/", async (request, reply) => {
    const { method, params = [] } = request.body as MetaMaskRequest;

    if (!controller.currentWallet) {
      reply.status(400);
      return { error: "No wallet configured" };
    }

    let response;
    try {
      switch (method) {
        case "eth_accounts":
        case "eth_requestAccounts":
          response = [controller.currentWallet.address];
          break;

        case "eth_chainId":
          response = "0x1"; // Mainnet by default
          break;

        case "personal_sign":
          const [message, address] = params;
          if (controller.currentWallet.address !== address) {
            console.log(
              "Invalid address",
              controller.currentWallet.address,
              address
            );
          }
          response = await controller.currentWallet.signMessage(
            ethers.getBytes(message)
          );
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

  return {
    controller,
    server: fastify,
  };
}
