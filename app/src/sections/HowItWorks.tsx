import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UserPlus, Link2, Sliders, LineChart } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Create Your Profile',
    description: 'Upload your resume or LinkedIn profile. Our AI extracts your skills, experience, and preferences to build a comprehensive profile.',
    image: '/step1-profile.png',
    icon: UserPlus,
  },
  {
    number: '02',
    title: 'Connect Job Portals',
    description: 'Link your accounts from LinkedIn, Indeed, Glassdoor, and 50+ other platforms securely. We support OAuth and email verification.',
    image: '/step2-connect.png',
    icon: Link2,
  },
  {
    number: '03',
    title: 'Set Your Preferences',
    description: 'Define your ideal role, salary range, location, and company size. Fine-tune matching criteria to get 50%+ relevant matches.',
    image: '/step3-preferences.png',
    icon: Sliders,
  },
  {
    number: '04',
    title: 'Auto-Apply & Track',
    description: 'Our system applies to matching jobs 24/7. Track everything from one unified dashboard with real-time notifications.',
    image: '/step4-track.png',
    icon: LineChart,
  },
];

const HowItWorks = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        '.hiw-heading',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );

      // Steps animation
      gsap.fromTo(
        '.hiw-step',
        { x: 100, rotateY: 15, opacity: 0 },
        {
          x: 0,
          rotateY: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          stagger: 0.2,
          scrollTrigger: {
            trigger: '.hiw-steps-container',
            start: 'top 70%',
          },
        }
      );

      // Connecting line animation
      gsap.fromTo(
        '.hiw-line',
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: '.hiw-steps-container',
            start: 'top 60%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-24 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="hiw-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="hiw-heading text-gray-400 text-lg max-w-2xl mx-auto">
            Four simple steps to automate your job search and land your dream role faster
          </p>
        </div>

        {/* Steps */}
        <div className="hiw-steps-container relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#7c39f6] via-[#7c39f6]/50 to-transparent transform -translate-x-1/2">
            <div className="hiw-line origin-top h-full w-full bg-gradient-to-b from-[#7c39f6] via-[#9b5bf5] to-[#7c39f6]/20" />
          </div>

          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={step.number}
                  className={`hiw-step relative grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                    isEven ? '' : 'lg:direction-rtl'
                  }`}
                >
                  {/* Content */}
                  <div className={`${isEven ? 'lg:pr-16' : 'lg:pl-16 lg:order-2'}`}>
                    <div className="glass-card rounded-2xl p-8 hover:border-[#7c39f6]/30 transition-all duration-300 group">
                      {/* Step Number */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-gradient-purple flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-5xl font-bold text-white/10">{step.number}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold mb-4 group-hover:text-gradient transition-all duration-300">
                        {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Image */}
                  <div className={`${isEven ? 'lg:pl-16' : 'lg:pr-16 lg:order-1'}`}>
                    <div className="relative group">
                      {/* Glow */}
                      <div className="absolute -inset-4 bg-gradient-purple opacity-0 group-hover:opacity-20 blur-2xl rounded-3xl transition-opacity duration-500" />
                      
                      {/* Image Container */}
                      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-transparent p-8">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="w-full h-auto max-h-64 object-contain mx-auto transform group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Step Indicator */}
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-[#7c39f6] flex items-center justify-center border-4 border-black">
                        <span className="text-xs font-bold text-white">{step.number}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
