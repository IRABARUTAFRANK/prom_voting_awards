import { redirect } from "next/navigation";
import { getVoterSession } from "@/lib/auth";
import { prisma, getSettings } from "@/lib/db";
import { voterMayParticipate } from "@/lib/voter-guards";

export default async function VoteLayout({ children }: { children: React.ReactNode }) {
  const session = await getVoterSession();
  if (!session) redirect("/login");

  const [settings, voter, positions] = await Promise.all([
    getSettings(),
    prisma.voter.findUnique({ where: { id: session.voterId } }),
    prisma.position.findMany({
      where: { active: true },
      include: { finalists: true },
    }),
  ]);

  if (!voter || !voterMayParticipate(voter.status)) redirect("/dashboard");
  if (!settings.finalVoteOpen) redirect("/dashboard");
  if (voter.status === "FINAL_VOTED") redirect("/dashboard");

  const finalistsReady = positions.every((p) => p.finalists.length >= 4);
  if (!finalistsReady) redirect("/dashboard");

  return children;
}
