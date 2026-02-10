import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, Users } from 'lucide-react';
import gsap from 'gsap';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Tag animation
      gsap.fromTo(
        '.hero-tag',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.2 }
      );

      // Headline word-by-word animation
      gsap.fromTo(
        '.hero-headline-word',
        { 
          opacity: 0, 
          y: 40,
          clipPath: 'inset(100% 0 0 0)'
        },
        { 
          opacity: 1, 
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 0.7, 
          ease: 'expo.out', 
          stagger: 0.1,
          delay: 0.4
        }
      );

      // Subheadline animation
      gsap.fromTo(
        '.hero-subheadline',
        { opacity: 0, filter: 'blur(10px)' },
        { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'smooth', delay: 1.1 }
      );

      // CTA buttons animation
      gsap.fromTo(
        '.hero-cta-primary',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)', delay: 1.3 }
      );

      gsap.fromTo(
        '.hero-cta-secondary',
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'expo.out', delay: 1.4 }
      );

      // Social proof animation
      gsap.fromTo(
        '.hero-social-proof',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', delay: 1.5 }
      );

      // Dashboard 3D reveal
      gsap.fromTo(
        dashboardRef.current,
        { 
          rotateX: 25, 
          rotateY: -15, 
          z: -200, 
          opacity: 0,
          transformPerspective: 1000
        },
        { 
          rotateX: 0, 
          rotateY: 0, 
          z: 0, 
          opacity: 1,
          duration: 1.2, 
          ease: 'expo.out', 
          delay: 1
        }
      );

      // Dashboard floating animation
      gsap.to(dashboardRef.current, {
        y: -10,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden"
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-[#7c39f6]/10 via-transparent to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="relative z-10 text-center lg:text-left">
            {/* Tag */}
            <div className="hero-tag inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-[#7c39f6]" />
              <span className="text-sm text-gray-300">AI-Powered Job Search</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="hero-headline-word inline-block">Apply</span>{' '}
              <span className="hero-headline-word inline-block">to</span>{' '}
              <span className="hero-headline-word inline-block text-gradient">100+</span>{' '}
              <span className="hero-headline-word inline-block">Jobs</span>
              <br />
              <span className="hero-headline-word inline-block">While</span>{' '}
              <span className="hero-headline-word inline-block">You</span>{' '}
              <span className="hero-headline-word inline-block">Sleep</span>
            </h1>

            {/* Subheadline */}
            <p className="hero-subheadline text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0">
              Our intelligent platform scans thousands of opportunities, matches them to your profile with 50%+ accuracy, and auto-applies with personalized resumes across all major job portals.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button
                size="lg"
                className="hero-cta-primary bg-gradient-purple hover:opacity-90 text-white px-8 py-6 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#7c39f6]/40 group animate-pulse-glow"
                onClick={() => scrollToSection('#pricing')}
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="hero-cta-secondary border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-full font-semibold text-lg transition-all duration-300"
                onClick={() => scrollToSection('#how-it-works')}
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="hero-social-proof flex items-center gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-black overflow-hidden"
                  >
                    <img
                      src={`/avatar${i}.jpg`}
                      alt={`User ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#7c39f6]" />
                <span className="text-sm text-gray-400">
                  Trusted by <span className="text-white font-semibold">50,000+</span> job seekers
                </span>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard */}
          <div className="relative lg:pl-8 perspective-1000">
            <div
              ref={dashboardRef}
              className="relative preserve-3d"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-purple opacity-20 blur-3xl rounded-3xl" />
              
              {/* Dashboard Image */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="/hero-dashboard.jpg"
                  alt="JobAutoFlow Dashboard"
                  className="w-full h-auto"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 -left-6 glass-card rounded-xl p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-lg">128</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Jobs Applied</p>
                    <p className="text-green-400 text-xs">+8% this week</p>
                  </div>
                </div>
              </div>

              {/* Floating Match Card */}
              <div className="absolute -top-4 -right-4 glass-card rounded-xl p-4 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#7c39f6]/20 flex items-center justify-center">
                    <span className="text-[#7c39f6] font-bold text-lg">90%</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Match Score</p>
                    <p className="text-[#7c39f6] text-xs">Software Engineer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
};

export default Hero;
