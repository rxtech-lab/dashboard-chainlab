import { NotebookPenIcon } from "lucide-react";

export const Config = {
  Authentication: {
    defaultNonceExpiration: 60,
    defaultCookieExpiration: 60 * 60 * 24 * 30, // 30 days
  },
  App: {
    name: "ChainLab App",
    version: process.env.VERCEL_GIT_COMMIT_REF,
    pageLimit: 10,
  },
  Attendance: {
    nonceExpiration: 30,
    dataAutoRefreshInterval: 1000 * 10,
    cookieExpiration: 60 * 60,
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

/**
 * Get the message to sign in as an admin
 * @param nonce - The nonce to sign
 * @returns The message to sign
 */
export function getAdminSignInMessage(nonce: string) {
  return `By signing this message, you are authorizing access to the attendance management system.\n\nNonce: ${nonce}`;
}

/**
 * Get the message to sign in as an attendant
 */
export function getAttendantSignInMessage(
  user: { firstName: string; lastName: string; userId: string },
  nonce: string
) {
  return `I, ${user.firstName} ${user.lastName} (ID: ${user.userId}), hereby confirm my attendance by signing this message.\n\nBy signing this message, I understand that this action cannot be undone and will be permanently recorded.\n\nNonce: ${nonce}`;
}
