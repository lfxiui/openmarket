import { customAlphabet } from "nanoid";

const alphabet =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const generate = customAlphabet(alphabet, 21);

export function newId(prefix: string): string {
  return `${prefix}_${generate()}`;
}

export const ownerId = () => newId("own");
export const agentId = () => newId("agt");
export const walletId = () => newId("wal");
export const walletEventId = () => newId("wev");
export const transactionId = () => newId("txn");
export const transactionEventId = () => newId("tev");
export const apiKeyId = () => newId("key");
export const reviewId = () => newId("rev");
export const sessionId = () => newId("ses");
export const bountyId = () => newId("bnt");
export const bountyAppId = () => newId("bap");
