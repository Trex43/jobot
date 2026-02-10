import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Brain,
  MousePointerClick,
  FileText,
  ListTodo,
  Calendar,
  TrendingUp,
  Building2,
  Users,
  BarChart3,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description: 'Our algorithm analyzes 50+ data points to find your perfect job matches with 90%+ accuracy.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: MousePointerClick,
    title: 'One-Click Apply',
    description: 'Apply to hundreds of jobs with a single click. No more repetitive forms and data entry.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileText,
    title: 'Smart Resume Builder',
    description: 'AI optimizes your resume for each application automatically, tailoring it to job requirements.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: ListTodo,
    title: 'Application Tracking',
    description: 'Track all your applications in one unified dashboard. Never lose sight of opportunities.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Calendar,
    title: 'Interview Scheduler',
    description: 'Automatically schedule interviews based on your availability and preferences.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: TrendingUp,
    title: 'Salary Insights',
    description: 'Get real-time salary data and negotiation tips for every offer you receive.',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Building2,
    title: 'Company Research',
    description: 'Deep insights into company culture, reviews, and interview processes before you apply.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Users,
    title: 'Network Leverage',
    description: 'Find connections who can refer you to your target companies and increase your chances.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Detailed analytics on your job search performance and actionable areas to improve.',
    color: 'from-yellow-500 to-orange-500',
  },
];

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        '.features-heading',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );

      // Cards animation with flip effect
      gsap.fromTo(
        '.feature-card',
        { rotateX: -90, opacity: 0 },
        {
          rotateX: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          stagger: {
            each: 0.1,
            from: 'start',
          },
          scrollTrigger: {
            trigger: '.features-grid',
            start: 'top 75%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-24 relative"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[#7c39f6]/5 via-transparent to-transparent opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="features-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Powerful <span className="text-gradient">Features</span>
          </h2>
          <p className="features-heading text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to supercharge your job search and land your dream role faster
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1500">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="feature-card group preserve-3d"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="glass-card rounded-2xl p-6 h-full transition-all duration-300 hover:translate-z-30 hover:border-[#7c39f6]/30 hover:shadow-lg hover:shadow-[#7c39f6]/10 group-hover:-translate-y-2">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 transform group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 group-hover:text-gradient transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {feature.description}
                  </p>

                  {/* Hover Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c39f6]/0 to-[#7c39f6]/0 group-hover:from-[#7c39f6]/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            And many more features to help you land your dream job
          </p>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-[#7c39f6] hover:text-[#9b5bf5] font-medium transition-colors"
          >
            See all features in action
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Features;
