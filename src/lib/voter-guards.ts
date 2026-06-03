import type { VoterStatus } from "@prisma/client";

/** Approved voters (not pending or removed) may nominate or vote. */
export function voterMayParticipate(status: VoterStatus): boolean {
  return status !== "PENDING";
}

export function voterIsRemoved(removedAt: Date | null | undefined): boolean {
  return removedAt != null;
}
