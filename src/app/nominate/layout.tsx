import { redirect } from "next/navigation";
import { getVoterSession } from "@/lib/auth";
import { prisma, getSettings } from "@/lib/db";
import { voterMayParticipate } from "@/lib/voter-guards";

export default async function NominateLayout({ children }: { children: React.ReactNode }) {
  const session = await getVoterSession();
  if (!session) redirect("/login");

  const [settings, voter] = await Promise.all([
    getSettings(),
    prisma.voter.findUnique({ where: { id: session.voterId } }),
  ]);

  if (!voter || !voterMayParticipate(voter.status)) redirect("/dashboard");
  if (!settings.nominationOpen) redirect("/dashboard");
  if (voter.status === "NOMINATION_SUBMITTED" || voter.status === "FINAL_VOTED") {
    redirect("/dashboard");
  }

  return children;
}
