import type { VoterStatus } from "@prisma/client";

/** Only roster-verified voters approved by admin may nominate or vote. */
export function voterMayParticipate(status: VoterStatus): boolean {
  return status !== "PENDING";
}
