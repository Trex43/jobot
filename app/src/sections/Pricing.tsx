import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Check, Sparkles, Zap, Building } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Sparkles,
    features: [
      'Profile creation',
      '5 auto-applies/month',
      'Basic AI matching',
      'Email support',
      '1 job portal connection',
      'Basic analytics',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'Best for active job seekers',
    monthlyPrice: 29,
    yearlyPrice: 23,
    icon: Zap,
    features: [
      'Unlimited auto-applies',
      'Advanced AI matching (50%+ accuracy)',
      'Smart resume optimization',
      'All 50+ job portals',
      'Priority support',
      'Advanced analytics',
      'Interview scheduler',
      'Salary insights',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For teams and agencies',
    monthlyPrice: 99,
    yearlyPrice: 79,
    icon: Building,
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      'Team collaboration',
      'API access',
      'White-label options',
      'SSO & advanced security',
      'Custom training',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.pricing-heading',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );

      gsap.fromTo(
        '.pricing-toggle',
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: 'elastic.out(1, 0.5)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          },
        }
      );

      gsap.fromTo(
        '.pricing-card',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: '.pricing-cards',
            start: 'top 75%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-[#7c39f6]/5 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="pricing-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h2>
          <p className="pricing-heading text-gray-400 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your job search goals. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Toggle */}
        <div className="pricing-toggle flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!isYearly ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-[#7c39f6]"
          />
          <span className={`text-sm ${isYearly ? 'text-white' : 'text-gray-500'}`}>
            Yearly
            <span className="ml-2 text-xs text-[#7c39f6]">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-cards grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={`pricing-card relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-purple px-4 py-1 rounded-full text-sm font-medium text-white">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card */}
                <div
                  className={`h-full rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                    plan.popular
                      ? 'bg-gradient-to-b from-[#7c39f6]/20 to-transparent border-2 border-[#7c39f6]/50 glow-purple'
                      : 'glass-card border-white/10 hover:border-[#7c39f6]/30'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.popular ? 'bg-gradient-purple' : 'bg-white/10'
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    {isYearly && price > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Billed annually (${price * 12}/year)
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#7c39f6] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={`w-full py-6 rounded-xl font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-purple hover:opacity-90 text-white hover:shadow-lg hover:shadow-[#7c39f6]/30'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm mb-4">Trusted by professionals worldwide</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {['Secure Payment', '24/7 Support', 'Cancel Anytime', '14-Day Trial'].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-gray-400">
                <Check className="w-4 h-4 text-[#7c39f6]" />
                <span className="text-sm">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
