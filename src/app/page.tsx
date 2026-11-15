import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Terminal from "@/components/Terminal";
import Work from "@/components/Work";
import Process from "@/components/Process";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ScrollFX from "@/components/ScrollFX";

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
        <Contact />
      </main>
      <Footer />
      <ScrollFX />
    </div>
  );
}
