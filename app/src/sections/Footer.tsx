import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, Twitter, Linkedin, Facebook, Instagram, Send, Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const footerLinks = {
  Product: ['Features', 'Pricing', 'Integrations', 'API', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Press', 'Partners'],
  Resources: ['Documentation', 'Help Center', 'Community', 'Templates', 'Guides'],
  Legal: ['Privacy', 'Terms', 'Security', 'Cookies', 'Compliance'],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer-logo',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          ease: 'smooth',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
          },
        }
      );

      gsap.fromTo(
        '.footer-newsletter',
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 85%',
          },
        }
      );

      gsap.fromTo(
        '.footer-column',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 80%',
          },
        }
      );

      gsap.fromTo(
        '.footer-social',
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: 'elastic.out(1, 0.5)',
          stagger: 0.05,
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 75%',
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <footer ref={footerRef} className="bg-[#0a0a0a] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 mb-16">
          {/* Logo & Newsletter */}
          <div className="lg:max-w-md">
            <a href="#" className="footer-logo flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">JobAutoFlow</span>
            </a>

            <p className="text-gray-400 mb-6">
              Automate your job search and land your dream role faster. Join 50,000+ professionals who trust JobAutoFlow.
            </p>

            {/* Newsletter */}
            <div className="footer-newsletter">
              <p className="text-sm text-gray-400 mb-3">Stay updated with job search tips</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-4"
                    disabled={isSubscribed}
                  />
                </div>
                <Button
                  type="submit"
                  className={`transition-all duration-300 ${
                    isSubscribed
                      ? 'bg-green-500 hover:bg-green-500'
                      : 'bg-gradient-purple hover:opacity-90'
                  }`}
                  disabled={isSubscribed}
                >
                  {isSubscribed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="footer-column">
                <h4 className="font-semibold text-white mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-[#7c39f6] transition-colors duration-200 text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-gray-500 text-sm">
              © 2024 JobAutoFlow. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="footer-social w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#7c39f6] hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
