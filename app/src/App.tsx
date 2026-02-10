import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import LogoCloud from './sections/LogoCloud';
import HowItWorks from './sections/HowItWorks';
import Features from './sections/Features';
import Testimonials from './sections/Testimonials';
import Pricing from './sections/Pricing';
import FAQ from './sections/FAQ';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';
import ParticleBackground from './components/ParticleBackground';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize scroll-triggered animations
    const ctx = gsap.context(() => {
      // Refresh ScrollTrigger after all content loads
      ScrollTrigger.refresh();
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef} className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <main className="relative z-10">
        <Hero />
        <LogoCloud />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
