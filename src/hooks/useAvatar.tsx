import useSWR from "swr";
import { ethers } from "ethers";
import { ChainConfig } from "@/config/config";

interface AvatarData {
  avatar: string | null;
  name: string | null;
}

export function useAvatar({ address }: { address: string }) {
  const { data, error, isLoading } = useSWR<AvatarData>(
    address ? `/api/avatar/${address}` : null,
    async () => {
      try {
        // Connect to Ethereum mainnet
        const provider = new ethers.JsonRpcProvider(ChainConfig.rpcUrl);

        // Get ENS name for the address (reverse lookup)
        const ensName = await provider.lookupAddress(address);

        let avatarUrl: string | null | undefined = null;
        if (ensName) {
          // Get avatar if ENS name exists
          const resolver = await provider.getResolver(ensName);
          avatarUrl = await resolver?.getAvatar();
        }

        return {
          avatar: avatarUrl || null,
          name: ensName || null,
        };
      } catch (err) {
        console.error("Error fetching ENS data:", err);
        return { avatar: null, name: null };
      }
    },
    {}
  );

  return {
    avatar: data?.avatar,
    name: data?.name,
    error,
    isLoading,
  };
}
