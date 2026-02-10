import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, CreditCard } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CTASection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cta-container',
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );

      gsap.fromTo(
        '.cta-heading span',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.05,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          },
        }
      );

      gsap.fromTo(
        '.cta-subheading',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 55%',
          },
        }
      );

      gsap.fromTo(
        '.cta-buttons',
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 50%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section ref={sectionRef} className="py-24 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="cta-container relative rounded-3xl overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7c39f6]/30 via-[#4c1d95]/20 to-black" />
          
          {/* Animated Mesh Gradient */}
          <div className="absolute inset-0 opacity-50">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7c39f6]/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#9b5bf5]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Content */}
          <div className="relative z-10 py-16 px-8 md:px-16 text-center">
            <h2 className="cta-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {'Ready to Transform Your Job Search?'.split(' ').map((word, i) => (
                <span key={i} className="inline-block mr-2">
                  {word}
                </span>
              ))}
            </h2>

            <p className="cta-subheading text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join 50,000+ professionals who found their dream jobs with JobAutoFlow. 
              Start your free trial today.
            </p>

            <div className="cta-buttons flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 px-8 py-6 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 group"
                onClick={() => scrollToSection('#pricing')}
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 rounded-full font-semibold text-lg transition-all duration-300"
                onClick={() => scrollToSection('#how-it-works')}
              >
                <Calendar className="mr-2 w-5 h-5" />
                Schedule a Demo
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#7c39f6]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
