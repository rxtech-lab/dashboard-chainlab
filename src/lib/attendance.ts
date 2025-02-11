export const ATTENDANT_COOKIE_NAME = "attendance-attendant";

export const getAttendanceNonceKey = (id: number) => {
  return `attendance:${id}:nonce`;
};
