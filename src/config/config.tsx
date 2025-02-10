import { NotebookPenIcon } from "lucide-react";

export const Config = {
  Authentication: {
    defaultNonceExpiration: 60,
  },
  App: {
    name: "ChainLab App",
    version: process.env.VERCEL_GIT_COMMIT_REF,
  },
};

export const SidebarItems = {
  nav: [
    {
      title: "Application",
      url: "/",
      items: [
        {
          title: "Attendance",
          url: "/",
          icon: <NotebookPenIcon />,
        },
      ],
    },
  ],
};

export const ChainConfig = {
  chainId: 1,
  name: "Ethereum",
  currency: "ETH",
  rpcUrl: "https://cloudflare-eth.com",
  explorerUrl: "https://etherscan.io",
};
