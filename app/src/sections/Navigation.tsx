import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Briefcase, Menu, X } from 'lucide-react';
import gsap from 'gsap';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(
      '.nav-logo',
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.1 }
    );

    gsap.fromTo(
      '.nav-link',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'expo.out', stagger: 0.1, delay: 0.2 }
    );

    gsap.fromTo(
      '.nav-cta',
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)', delay: 0.5 }
    );
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
      style={{ height: isScrolled ? '60px' : '80px' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <a
            href="#"
            className="nav-logo flex items-center gap-2 group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">JobAutoFlow</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="nav-link text-sm text-gray-300 hover:text-white transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-[#7c39f6] transition-all duration-300 group-hover:w-full group-hover:left-0" />
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              className="nav-cta bg-gradient-purple hover:opacity-90 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#7c39f6]/30"
              onClick={() => scrollToSection('#pricing')}
            >
              Get Started Free
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 py-4">
          <div className="flex flex-col items-center gap-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="text-gray-300 hover:text-white transition-colors duration-200 py-2"
              >
                {link.label}
              </button>
            ))}
            <Button
              className="bg-gradient-purple hover:opacity-90 text-white px-6 py-2 rounded-full font-medium mt-2"
              onClick={() => scrollToSection('#pricing')}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
