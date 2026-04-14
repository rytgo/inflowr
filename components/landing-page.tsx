"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import { Button } from "@/components/ui/button";

type LandingPageProps = {
  isAuthenticated: boolean;
  userEmail: string | null;
};

type WorkflowStep = {
  title: string;
  description: string;
  metric: string;
};

const workflowSteps: WorkflowStep[] = [
  {
    title: "Add influencer",
    description: "Capture platform, profile, and operating notes in one record.",
    metric: "1 source of truth"
  },
  {
    title: "Launch campaign",
    description: "Set value, timeline, and campaign context without clutter.",
    metric: "30s setup"
  },
  {
    title: "Track deliverables",
    description: "Watch pending, posted, and overdue deliverables in real time.",
    metric: "Status auto-derived"
  },
  {
    title: "Log payment",
    description: "Record payments and see remaining balance update instantly.",
    metric: "Balance auto-calculated"
  }
];

const featureCards = [
  {
    title: "Operational Dashboard",
    description: "Filter campaign risk by status, due dates, and outstanding value in one view."
  },
  {
    title: "Read-First Workspace",
    description: "Data is presented clearly first, with explicit edit moments when needed."
  },
  {
    title: "Deliverable Discipline",
    description: "Deadlines, posting state, and live links stay aligned with campaign context."
  },
  {
    title: "Payment Visibility",
    description: "Paid vs remaining stays consistent across dashboard and campaign detail pages."
  },
  {
    title: "Calendar Awareness",
    description: "Understand upcoming and overdue workload before things slip."
  },
  {
    title: "Private by Design",
    description: "One user account maps to one private campaign workspace."
  }
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs uppercase tracking-[0.12em] text-text-faint">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm text-text-muted sm:text-base">{description}</p>
    </div>
  );
}

export function LandingPage({ isAuthenticated, userEmail }: LandingPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((previous) => (previous + 1) % workflowSteps.length);
    }, 2600);

    return () => clearInterval(timer);
  }, []);

  const ctaHref = isAuthenticated ? "/dashboard" : "/signup";
  const ctaLabel = isAuthenticated ? "Open dashboard" : "Start free";

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -50]);

  const floatingStat = useMemo(
    () => [
      { label: "Overdue", value: "2" },
      { label: "Due this week", value: "7" },
      { label: "Outstanding", value: "$14,200" }
    ],
    []
  );

  return (
    <div className="min-h-screen text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-subtle/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-accent/30 bg-accent-soft text-accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">Inflowr</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-text-muted md:flex">
            <a href="#product" className="hover:text-text-primary">Product</a>
            <a href="#workflow" className="hover:text-text-primary">Workflow</a>
            <a href="#features" className="hover:text-text-primary">Features</a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <span className="hidden text-xs text-text-faint sm:inline">{userEmail ?? "Signed in"}</span>
            ) : null}
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              <Button variant="ghost" size="sm">{isAuthenticated ? "Dashboard" : "Log in"}</Button>
            </Link>
            <Link href={ctaHref}>
              <Button variant="secondary" size="sm">{ctaLabel}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border-subtle">
          <motion.div style={{ y: heroY }} className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="max-w-xl"
            >
              <p className="text-xs uppercase tracking-[0.12em] text-text-faint">Private Campaign Operations</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Run influencer campaigns without spreadsheet chaos.
              </h1>
              <p className="mt-5 text-base text-text-muted sm:text-lg">
                Inflowr gives solo campaign operators one calm command center for influencers, deliverables, payments, and deadlines.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={ctaHref}>
                  <Button size="lg" variant="secondary">{ctaLabel}</Button>
                </Link>
                <a href="#workflow">
                  <Button size="lg" variant="ghost">View workflow</Button>
                </a>
              </div>
              <p className="mt-4 text-xs text-text-faint">No team setup. No org complexity. One account, one private workspace.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
              className="relative"
            >
              <div className="surface-panel relative rounded-lg p-4 sm:p-5">
                <div className="rounded-md border border-border-subtle bg-panel-soft/70 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-text-secondary">Campaign pipeline</p>
                    <span className="rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] text-accent">Live</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Maya / Summer UGC", status: "Active", due: "May 15" },
                      { name: "Jordan / Product Seeding", status: "Overdue", due: "May 07" },
                      { name: "Elena / TikTok Sprint", status: "Active", due: "May 19" }
                    ].map((row, index) => (
                      <motion.div
                        key={row.name}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.16 + index * 0.08 }}
                        className="flex items-center justify-between rounded-sm border border-border-subtle bg-panel px-3 py-2"
                      >
                        <p className="text-xs text-text-secondary">{row.name}</p>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`rounded-full px-2 py-0.5 ${row.status === "Overdue" ? "bg-[var(--status-overdue-soft)] text-[var(--status-overdue)]" : "bg-[var(--status-active-soft)] text-[var(--status-active)]"}`}>
                            {row.status}
                          </span>
                          <span className="text-text-faint">{row.due}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {floatingStat.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.35 + index * 0.08 }}
                      className="rounded-sm border border-border-subtle bg-panel-soft px-2 py-2"
                    >
                      <p className="text-[10px] uppercase tracking-[0.08em] text-text-faint">{item.label}</p>
                      <p className="mt-1 text-xs font-semibold text-text-primary">{item.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section id="product" className="border-b border-border-subtle py-14 sm:py-18">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Why Inflowr"
              title="Built for focused, high-signal campaign operations"
              description="Everything you need to keep campaigns moving, with less noise and fewer missed deadlines."
            />

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "One account = one private workspace",
                "Automatic status: Active / Overdue / Completed",
                "Automatic remaining balance tracking",
                "Deadline visibility in one calendar view"
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="surface-panel rounded-md px-4 py-4"
                >
                  <p className="text-sm text-text-secondary">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b border-border-subtle py-14 sm:py-18">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Workflow"
              title="A complete campaign loop in one operating surface"
              description="This section animates through your daily flow so visitors understand the product quickly."
            />

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="surface-panel rounded-lg p-5 sm:p-6">
                <div className="space-y-3">
                  {workflowSteps.map((step, index) => {
                    const isActive = index === activeStep;
                    return (
                      <button
                        key={step.title}
                        type="button"
                        onClick={() => setActiveStep(index)}
                        className={`w-full rounded-sm border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-accent/35 bg-accent-soft"
                            : "border-border-subtle bg-panel-soft hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-text-primary">{index + 1}. {step.title}</p>
                          <span className="text-xs text-text-faint">{step.metric}</span>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">{step.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                className="surface-panel rounded-lg p-5 sm:p-6"
              >
                <div className="rounded-md border border-border-subtle bg-panel-soft/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-faint">Live workflow state</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-text-primary">{workflowSteps[activeStep].title}</h3>
                  <p className="mt-2 text-sm text-text-muted">{workflowSteps[activeStep].description}</p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-sm border border-border-subtle bg-panel px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-text-faint">Current status</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {activeStep === 2 ? "2 overdue deliverables" : activeStep === 3 ? "$4,200 remaining" : "On track"}
                      </p>
                    </div>
                    <div className="rounded-sm border border-border-subtle bg-panel px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-text-faint">Next action</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {activeStep === 0
                          ? "Create campaign"
                          : activeStep === 1
                            ? "Add deliverables"
                            : activeStep === 2
                              ? "Mark as posted"
                              : "Log payment"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-border-subtle py-14 sm:py-18">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Features"
              title="High clarity, low drag"
              description="Designed for solo operators who need reliable campaign execution more than dashboard theatrics."
            />

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className="surface-panel rounded-md p-4"
                >
                  <h3 className="text-sm font-semibold text-text-primary">{card.title}</h3>
                  <p className="mt-2 text-sm text-text-muted">{card.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[980px] px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="surface-panel rounded-lg p-7 sm:p-10"
            >
              <p className="text-xs uppercase tracking-[0.12em] text-text-faint">Get started</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                Replace your campaign spreadsheet stack.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted sm:text-base">
                Inflowr helps you stay ahead of deadlines, balances, and campaign health without operational clutter.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href={ctaHref}>
                  <Button size="lg" variant="secondary">{ctaLabel}</Button>
                </Link>
                <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                  <Button size="lg" variant="ghost">{isAuthenticated ? "Go to app" : "Log in"}</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle py-6">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-4 text-xs text-text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Inflowr · Private influencer campaign workspace</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-text-secondary">Log in</Link>
            <Link href="/signup" className="hover:text-text-secondary">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
