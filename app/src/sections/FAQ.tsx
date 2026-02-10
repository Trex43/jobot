import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use bank-level 256-bit encryption to protect your data. Your credentials are stored securely using industry-standard hashing, and we never share your personal information with third parties. We\'re SOC 2 Type II certified and GDPR compliant.',
  },
  {
    question: 'Which job platforms are supported?',
    answer: 'We support 50+ major job platforms including LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, CareerBuilder, Dice, SimplyHired, and many more. We\'re constantly adding new integrations based on user feedback.',
  },
  {
    question: 'Can I customize which jobs to apply for?',
    answer: 'Yes! You have full control over your job search. Set filters for job title, salary range, location, company size, industry, remote/hybrid options, and more. You can also review and approve each application before it\'s sent.',
  },
  {
    question: 'What happens after I apply?',
    answer: 'You\'ll receive real-time notifications for every application submitted. Track your application status, interview requests, and responses all in one dashboard. We also provide follow-up reminders and interview preparation resources.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! We offer a 14-day free trial of our Professional plan with no credit card required. You can also use our Free plan indefinitely with limited features.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. There are no long-term contracts or cancellation fees. You can cancel your subscription at any time from your account settings, and you\'ll continue to have access until the end of your billing period.',
  },
  {
    question: 'How accurate is the AI matching?',
    answer: 'Our AI matching algorithm achieves 90%+ accuracy by analyzing 50+ data points including your skills, experience, preferences, and job requirements. The system learns from your feedback to improve recommendations over time.',
  },
  {
    question: 'Do companies know I used automation?',
    answer: 'No. Each application is personalized and submitted as if you applied manually. We customize your resume and cover letter for each position, ensuring your applications appear natural and tailored.',
  },
];

const FAQ = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.faq-heading',
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
        '.faq-item',
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: '.faq-accordion',
            start: 'top 75%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="faq" ref={sectionRef} className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Sticky Header */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-32">
              <h2 className="faq-heading text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked <span className="text-gradient">Questions</span>
              </h2>
              <p className="faq-heading text-gray-400 mb-8">
                Everything you need to know about JobAutoFlow. Can't find what you're looking for? Contact our support team.
              </p>
              
              <div className="glass-card rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-2">Still have questions?</p>
                <a
                  href="mailto:support@jobautoflow.com"
                  className="text-[#7c39f6] hover:text-[#9b5bf5] font-medium transition-colors"
                >
                  Contact Support →
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Accordion */}
          <div className="lg:col-span-2">
            <Accordion type="single" collapsible className="faq-accordion space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="faq-item glass-card rounded-xl border-0 px-6 data-[state=open]:border-[#7c39f6]/30 transition-all duration-300"
                >
                  <AccordionTrigger className="text-left text-lg font-medium hover:no-underline py-5 group">
                    <span className="group-hover:text-gradient transition-all duration-300">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
