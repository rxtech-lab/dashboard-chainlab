export const POLL_RESPONDENT_COOKIE_NAME = "poll-respondent";

export const getPollNonceKey = (id: number) => {
  return `poll:${id}:nonce`;
};
