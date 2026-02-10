import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    id: 1,
    name: 'Sarah M.',
    role: 'Software Engineer',
    company: 'Google',
    avatar: '/avatar1.jpg',
    quote: 'Landed 3 interviews in the first week! The AI matching is incredibly accurate - it found roles I would never have discovered on my own.',
    rating: 5,
  },
  {
    id: 2,
    name: 'James K.',
    role: 'Product Manager',
    company: 'Meta',
    avatar: '/avatar2.jpg',
    quote: 'Saved me 20+ hours of manual applications. I just set my preferences and the platform did the rest. Got hired within a month!',
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily R.',
    role: 'UX Designer',
    company: 'Airbnb',
    avatar: '/avatar3.jpg',
    quote: 'The AI matching is incredibly accurate. It understood my skills and preferences perfectly, finding roles that were truly relevant.',
    rating: 5,
  },
  {
    id: 4,
    name: 'Michael T.',
    role: 'Data Scientist',
    company: 'Netflix',
    avatar: '/avatar4.jpg',
    quote: 'Got my dream job at a Fortune 500 company. The auto-apply feature meant I never missed an opportunity, even while sleeping!',
    rating: 5,
  },
  {
    id: 5,
    name: 'Lisa Chen',
    role: 'Marketing Director',
    company: 'Spotify',
    avatar: '/avatar5.jpg',
    quote: 'Worth every penny. Best investment in my career. The time saved alone paid for the subscription multiple times over.',
    rating: 5,
  },
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.testimonials-heading',
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
        '.testimonials-carousel',
        { rotateX: 20, opacity: 0 },
        {
          rotateX: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const getCardStyle = (index: number) => {
    const diff = index - activeIndex;
    const normalizedDiff = ((diff + testimonials.length) % testimonials.length);
    
    if (normalizedDiff === 0) {
      return {
        transform: 'translateX(0) scale(1) rotateY(0deg)',
        opacity: 1,
        zIndex: 3,
      };
    } else if (normalizedDiff === 1 || normalizedDiff === -testimonials.length + 1) {
      return {
        transform: 'translateX(60%) scale(0.85) rotateY(-25deg)',
        opacity: 0.5,
        zIndex: 2,
      };
    } else if (normalizedDiff === testimonials.length - 1 || normalizedDiff === -1) {
      return {
        transform: 'translateX(-60%) scale(0.85) rotateY(25deg)',
        opacity: 0.5,
        zIndex: 2,
      };
    } else {
      return {
        transform: 'translateX(0) scale(0.7) rotateY(0deg)',
        opacity: 0,
        zIndex: 1,
      };
    }
  };

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-[#7c39f6]/5 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="testimonials-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            What Our <span className="text-gradient">Users Say</span>
          </h2>
          <p className="testimonials-heading text-gray-400 text-lg max-w-2xl mx-auto">
            Join thousands of job seekers who found their dream jobs with JobAutoFlow
          </p>
        </div>

        {/* 3D Carousel */}
        <div
          ref={carouselRef}
          className="testimonials-carousel relative h-[400px] perspective-2000"
        >
          <div className="relative w-full h-full preserve-3d">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="absolute inset-0 flex items-center justify-center transition-all duration-600 ease-out"
                style={{
                  ...getCardStyle(index),
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div className="w-full max-w-2xl glass-card rounded-3xl p-8 md:p-10">
                  {/* Quote Icon */}
                  <Quote className="w-10 h-10 text-[#7c39f6] mb-6 opacity-50" />

                  {/* Quote Text */}
                  <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#7c39f6]"
                      />
                      <div>
                        <p className="font-semibold text-white">{testimonial.name}</p>
                        <p className="text-sm text-gray-400">
                          {testimonial.role} at {testimonial.company}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full border-white/20 hover:bg-white/10 hover:border-[#7c39f6]"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full border-white/20 hover:bg-white/10 hover:border-[#7c39f6]"
            onClick={goToNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'bg-[#7c39f6] w-8'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
