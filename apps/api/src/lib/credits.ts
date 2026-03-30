import { COMMISSION_RATE } from "@openmarket/shared";
import { walletEventId } from "./id";

/**
 * Freeze credits from a wallet for an escrow transaction.
 * Deducts from balance, adds to frozen.
 */
export async function freezeCredits(
  db: D1Database,
  walletId: string,
  amount: number,
  referenceId: string,
): Promise<void> {
  const now = new Date().toISOString();

  await db.batch([
    db
      .prepare(
        `UPDATE wallets SET balance = balance - ?, frozen = frozen + ?, total_spent = total_spent + ?, updated_at = ? WHERE id = ? AND balance >= ?`,
      )
      .bind(amount, amount, amount, now, walletId, amount),
    db
      .prepare(
        `INSERT INTO wallet_events (id, wallet_id, type, amount, balance_after, reference_id, description, created_at)
         VALUES (?, ?, 'freeze', ?, (SELECT balance FROM wallets WHERE id = ?), ?, 'Credits frozen for escrow', ?)`,
      )
      .bind(walletEventId(), walletId, -amount, walletId, referenceId, now),
  ]);
}

/**
 * Release credits from escrow to the seller wallet.
 * Deducts commission and transfers the remainder.
 */
export async function releaseCredits(
  db: D1Database,
  buyerWalletId: string,
  sellerWalletId: string,
  amount: number,
  referenceId: string,
): Promise<{ commission: number; sellerPayout: number }> {
  const commission = Math.floor(amount * COMMISSION_RATE);
  const sellerPayout = amount - commission;
  const now = new Date().toISOString();

  await db.batch([
    // Unfreeze from buyer
    db
      .prepare(
        `UPDATE wallets SET frozen = frozen - ?, updated_at = ? WHERE id = ?`,
      )
      .bind(amount, now, buyerWalletId),
    // Credit seller
    db
      .prepare(
        `UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ?, updated_at = ? WHERE id = ?`,
      )
      .bind(sellerPayout, sellerPayout, now, sellerWalletId),
    // Buyer wallet event
    db
      .prepare(
        `INSERT INTO wallet_events (id, wallet_id, type, amount, balance_after, reference_id, description, created_at)
         VALUES (?, ?, 'release', ?, (SELECT balance FROM wallets WHERE id = ?), ?, 'Escrow released', ?)`,
      )
      .bind(
        walletEventId(),
        buyerWalletId,
        -amount,
        buyerWalletId,
        referenceId,
        now,
      ),
    // Seller wallet event
    db
      .prepare(
        `INSERT INTO wallet_events (id, wallet_id, type, amount, balance_after, reference_id, description, created_at)
         VALUES (?, ?, 'earn', ?, (SELECT balance FROM wallets WHERE id = ?), ?, 'Payment received', ?)`,
      )
      .bind(
        walletEventId(),
        sellerWalletId,
        sellerPayout,
        sellerWalletId,
        referenceId,
        now,
      ),
  ]);

  return { commission, sellerPayout };
}

/**
 * Refund frozen credits back to the buyer wallet.
 */
export async function refundCredits(
  db: D1Database,
  walletId: string,
  amount: number,
  referenceId: string,
): Promise<void> {
  const now = new Date().toISOString();

  await db.batch([
    db
      .prepare(
        `UPDATE wallets SET balance = balance + ?, frozen = frozen - ?, total_spent = total_spent - ?, updated_at = ? WHERE id = ?`,
      )
      .bind(amount, amount, amount, now, walletId),
    db
      .prepare(
        `INSERT INTO wallet_events (id, wallet_id, type, amount, balance_after, reference_id, description, created_at)
         VALUES (?, ?, 'refund', ?, (SELECT balance FROM wallets WHERE id = ?), ?, 'Escrow refunded', ?)`,
      )
      .bind(walletEventId(), walletId, amount, walletId, referenceId, now),
  ]);
}
