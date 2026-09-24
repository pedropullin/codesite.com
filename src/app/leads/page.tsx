import type { Metadata } from "next";
import LeadFinder from "@/components/leads/LeadFinder";

export const metadata: Metadata = {
  title: "Leads — CODE SITE",
  robots: { index: false, follow: false },
};

export default function LeadsPage() {
  return <LeadFinder />;
}
