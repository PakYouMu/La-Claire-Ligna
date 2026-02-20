"use client";

import { useMotion } from "@/components/context/motion-context";
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";
import {
  ShieldCheck, Users, Target, Sparkles,
  Mail, Globe, HeartHandshake, Lock
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutClient() {
  const { reduceMotion } = useMotion();

  return (
    <div className="w-full max-w-[90rem] mx-auto p-responsive space-y-4 overflow-y-auto mt-16 md:mt-0">
      {/* Hero Text - Responsive margins and font sizes */}
      <div className="text-center md:text-left animate-in fade-in slide-in-from-bottom-4 duration-700 about-hero-text">
        <p className="text-muted-foreground max-w-2xl about-card-body">
          The Clear Line. Bringing clarity to chaotic financial tracking.
        </p>
      </div>

      {/* Bento Grid */}
      <MagicBento
        disableAnimations={reduceMotion}
        className="grid-cols-1 md:grid-cols-4 grid-rows-auto gap-responsive"
      >

        {/* 1. THE STORY */}
        <BentoCard
          title="The Story"
          icon={<Sparkles className="h-4 w-4" />}
          className="col-span-1 md:col-span-2 md:row-span-2 about-card-story"
        >
          <div className="flex flex-col h-full justify-start px-2 space-y-6 about-card-padding-top">
            <h3 className="font-bold text-foreground about-card-heading">
              A Fusion of Influences
            </h3>

            <div className="space-y-4 text-muted-foreground leading-relaxed about-card-body">
              <p>
                The name <strong>La Clair Ligña</strong> is a fusion of influences; a nod to French elegance and the Filipino word <em>"Linya"</em> (Line). It represents a clear, direct path through financial management.
              </p>
              <p>
                It started with a common frustration: running a side-business using pen, paper, and cluttered spreadsheets. As the list of borrowers grew, the system broke. Data became untraceable, and updates were a chore.
              </p>
              <p>
                I built this because I needed it. Now, I am sharing it with everyone who needs a professional tool without the enterprise complexity.
              </p>
            </div>
          </div>
        </BentoCard>

        {/* 2. THE MISSION */}
        <BentoCard
          title="The Mission"
          icon={<Target className="h-4 w-4" />}
          className="col-span-1 md:col-span-2 md:row-span-1 about-card-standard"
        >
          <div className="flex flex-col h-full justify-center px-2">
            <h3 className="font-bold text-foreground about-card-heading">
              Beyond the Spreadsheet
            </h3>
            <p className="text-muted-foreground leading-relaxed about-card-body">
              Most loan software is either too expensive (B2B) or requires you to build it yourself (DIY Excel). I want to fill the gap.
            </p>
            <p className="text-muted-foreground about-card-body about-card-spacing">
              My goal is to provide <strong>consumer-grade software for the masses</strong>; accessible, open, and free from the clutter of manual tracking.
            </p>
          </div>
        </BentoCard>

        {/* 3. CORE VALUES */}
        <BentoCard
          title="Core Values"
          icon={<HeartHandshake className="h-4 w-4" />}
          className="col-span-1 md:col-span-1 md:row-span-1 about-card-standard"
        >
          <div className="flex flex-col justify-center px-2">
            <h3 className="font-bold text-foreground about-card-heading">
              Our Pillars
            </h3>
            <p className="text-muted-foreground leading-relaxed about-card-body">
              We advocate for <strong>Adaptability</strong> in access, <strong>Integrity</strong> in data handling, and <strong>Efficiency</strong> in your workflow.
            </p>
          </div>
        </BentoCard>

        {/* 4. PRIVACY FIRST */}
        <BentoCard
          title="Privacy First"
          icon={<Lock className="h-4 w-4" />}
          className="col-span-1 md:col-span-1 md:row-span-1 about-card-standard"
        >
          <div className="flex flex-col h-full justify-center px-2">
            <h3 className="font-bold text-foreground about-card-heading">
              Your Data; Only for You
            </h3>
            <p className="text-muted-foreground leading-relaxed about-card-body">
              We use strict database rules to ensure that your ledger is completely invisible to others. No data sharing, no prying eyes.
            </p>
          </div>
        </BentoCard>

        {/* 5. BUILT FOR EVERYONE */}
        <BentoCard
          title="Built for Everyone"
          icon={<Globe className="h-4 w-4" />}
          className="col-span-1 md:col-span-2 md:row-span-1 about-card-standard"
        >
          <div className="flex flex-col h-full justify-center px-2">
            <h3 className="font-bold text-foreground about-card-heading">
              Open & Accessible
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-2xl about-card-body">
              Whether you are managing side-hustle loans or tracking emergency funds, this tool is designed to be free and available to all. I believe better tools lead to better financial habits.
            </p>
          </div>
        </BentoCard>

        {/* 6. GET IN TOUCH */}
        <BentoCard
          title="Get In Touch"
          icon={<Mail className="h-4 w-4" />}
          className="col-span-1 md:col-span-2 md:row-span-1 about-card-contact"
        >
          <div className="flex flex-col h-full justify-between px-2 about-contact-padding">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground about-contact-heading">
                  Contact the Developer
                </h3>
                <p className="text-muted-foreground leading-relaxed about-card-body">
                  Support available on Sundays (GMT+8).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 self-start md:self-center about-button-spacing">
                <Button variant="outline" size="lg" asChild>
                  <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>Email Me</a>
                </Button>
                <Button size="lg" asChild>
                  <Link href="/loan-tracking">Check Loan</Link>
                </Button>
              </div>
            </div>
          </div>
        </BentoCard>

      </MagicBento>
    </div>
  );
}