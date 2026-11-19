import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Terminal from "@/components/Terminal";
import Work from "@/components/Work";
import Process from "@/components/Process";
import Contact from "@/components/Contact";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Motion from "@/components/Motion";

export const metadata: Metadata = { robots: { index: false } };

export default function Home() {
  return (
    <div className="site-dark bg-bg text-ink">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Terminal />
        <Work />
        <Process />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <Motion />
    </div>
  );
}
