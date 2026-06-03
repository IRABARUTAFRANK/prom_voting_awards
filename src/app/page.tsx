import Link from "next/link";
import Image from "next/image";
import { PageAutoRefresh } from "@/components/page-auto-refresh";
import { SiteHeader } from "@/components/site-header";
import { PageBanner } from "@/components/page-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Award, Shield, Users, Vote } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Register",
    text: "Enter your name and school email. Admin verifies you are Senior Six.",
  },
  {
    icon: Shield,
    title: "Admin approves",
    text: "Admin checks each registration. Once approved, your access code appears in the voter portal.",
  },
  {
    icon: Vote,
    title: "Phase 1 — Nomination form",
    text: "Log in with your code and wait for admin to open nominations. Pick classmates per award.",
  },
  {
    icon: Award,
    title: "Phase 2 — Final vote form",
    text: "When admin opens final voting, pick one of the 4 finalists per position.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <PageAutoRefresh />
      <SiteHeader />
      <main className="mx-auto flex max-w-5xl flex-1 flex-col px-4 py-8">
        <PageBanner
          variant="home"
          title="Promotion party awards"
          subtitle="Register, nominate, and vote — all on our own secure pages. No external forms."
        />

        <section className="mt-10 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button className="min-w-[180px]">Register to vote</Button>
            </Link>
            <Link href="/portal">
              <Button variant="secondary" className="min-w-[180px]">
                Voter portal
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" className="min-w-[180px]">
                I have a code
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="text-left">
              <Icon className="mb-3 h-8 w-8 text-emerald-400" />
              <h2 className="font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm text-emerald-100/55">{text}</p>
            </Card>
          ))}
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden p-0">
            <div className="relative h-40">
              <Image
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80"
                alt="Students"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-semibold text-white">Phase 1</h3>
                <p className="text-sm text-emerald-100/80">Nominate from the official roster</p>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden p-0">
            <div className="relative h-40">
              <Image
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80"
                alt="Celebration"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-semibold text-white">Phase 2</h3>
                <p className="text-sm text-emerald-100/80">Vote among the top 4 finalists</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-12">
          <Card>
            <h2 className="text-lg font-semibold text-white">Award positions &apos;26</h2>
            <ul className="mt-4 grid gap-2 text-sm text-emerald-100/75 sm:grid-cols-2">
              <li>SOCIAL BUTTERFLY — most social</li>
              <li>PRAYER WARRIOR — most spiritual</li>
              <li>GOLDEN — most kind, humble</li>
              <li>FLAWLESS — smartest</li>
              <li>SERENE — most nonchalant</li>
            </ul>
          </Card>
        </section>
      </main>
    </div>
  );
}
