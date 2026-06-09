import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Mail,
  Menu,
  MessageSquare,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

const FEATURES = [
  {
    icon: <Users size={32} />,
    title: 'Peer Collaboration',
    description:
      'Connect with fellow Computer Science students, discuss academic challenges, and learn together.',
  },
  {
    icon: <MessageSquare size={32} />,
    title: 'Discussion Forums',
    description:
      'Participate in course-specific discussions and share solutions to programming and theoretical problems.',
  },
  {
    icon: <Upload size={32} />,
    title: 'Resource Sharing',
    description: 'Upload and access lecture notes, tutorials, past questions, and study materials.',
  },
  {
    icon: <BookOpen size={32} />,
    title: 'Assignment Support',
    description: 'Collaborate responsibly on coursework while improving understanding of course concepts.',
  },
];

const STEPS = [
  {
    icon: <UserPlus size={28} />,
    title: 'Register',
    description: 'Create your free student account with your @bowen.edu.ng email in just a few seconds.',
  },
  {
    icon: <BookOpen size={28} />,
    title: 'Enroll in Courses',
    description: 'Browse the course catalog and enroll to unlock discussions and shared resources.',
  },
  {
    icon: <Users size={28} />,
    title: 'Collaborate',
    description: 'Join forums, ask questions, share resources, and learn together with your coursemates.',
  },
];

const STATS = [
  { value: 500, suffix: '+', label: 'Students' },
  { value: 50, suffix: '+', label: 'Courses' },
  { value: 1000, suffix: '+', label: 'Shared Resources' },
  { value: 24, suffix: '/7', label: 'Accessibility' },
];

const QUICK_LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'About', id: 'about' },
  { label: 'Contact', id: 'contact' },
];

const CONTACT_EMAIL = 'support@bowen.edu.ng';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > threshold);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}

function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView] as const;
}

function useCountUp(end: number, shouldStart: boolean, duration = 1500): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let frame = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(end * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, shouldStart, duration]);

  return value;
}

function NavAnchor({ id, label, onClick }: { id: string; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        scrollToSection(id);
        onClick?.();
      }}
      className="text-gray-700 transition-colors hover:text-blue-900"
    >
      {label}
    </button>
  );
}

function Navbar() {
  const scrolled = useScrolled();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav
      className={`sticky top-0 z-50 border-b bg-white transition-shadow duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="text-blue-900" size={34} />
          <div>
            <h1 className="text-lg font-bold text-blue-900">Bowen P2P Learning</h1>
            <p className="text-xs text-gray-500">Computer Science Department</p>
          </div>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavAnchor key={link.id} id={link.id} label={link.label} />
          ))}

          <Link
            to="/login"
            className="rounded-lg border border-blue-900 px-5 py-2 text-blue-900 transition-colors hover:bg-blue-900 hover:text-white"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-blue-900 px-5 py-2 text-white transition-colors hover:bg-blue-800"
          >
            Register
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          className="rounded-md p-2 text-blue-900 hover:bg-blue-900/10 md:hidden"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <NavAnchor key={link.id} id={link.id} label={link.label} onClick={() => setIsMenuOpen(false)} />
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg border border-blue-900 px-5 py-2 text-center text-blue-900 transition-colors hover:bg-blue-900 hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg bg-blue-900 px-5 py-2 text-center text-white transition-colors hover:bg-blue-800"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="bg-gradient-to-r from-blue-950 to-blue-800 text-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="rounded-full bg-blue-700 px-4 py-2 text-sm">
              Bowen University • Computer Science Department
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-tight">
              Learn Better Through Peer-to-Peer Collaboration
            </h1>

            <p className="mt-6 text-lg text-gray-200">
              A dedicated digital learning environment where Computer Science students can share resources,
              discuss academic topics, collaborate on learning, and support one another&apos;s growth.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-900 transition-colors hover:bg-gray-100"
              >
                Get Started
                <ArrowRight size={18} />
              </Link>

              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="rounded-lg border border-white px-6 py-3 transition-colors hover:bg-white hover:text-blue-900"
              >
                Learn More
              </button>
            </div>
          </div>

          <div
            className={`transition-all duration-700 ease-out ${
              isVisible ? 'translate-y-0 rotate-0 opacity-100' : 'translate-y-10 rotate-2 opacity-0'
            }`}
          >
            <div className="rounded-2xl bg-white p-6 shadow-2xl">
              <div className="rounded-xl bg-gray-100 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">CSC 401 Discussion Forum</h3>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">Active</span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg bg-white p-3">
                    <p className="font-medium text-gray-800">Compiler Construction</p>
                    <p className="text-sm text-gray-500">Discussion on parsing techniques and syntax trees.</p>
                  </div>

                  <div className="rounded-lg bg-white p-3">
                    <p className="font-medium text-gray-800">Shared Resource</p>
                    <p className="text-sm text-gray-500">Lecture notes uploaded for Data Communication.</p>
                  </div>

                  <div className="rounded-lg bg-white p-3">
                    <p className="font-medium text-gray-800">Assignment Support</p>
                    <p className="text-sm text-gray-500">Students discussing algorithm optimization concepts.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, suffix, label, shouldStart }: { value: number; suffix: string; label: string; shouldStart: boolean }) {
  const animated = useCountUp(value, shouldStart);

  return (
    <div>
      <h2 className="text-4xl font-bold text-blue-900">
        {animated}
        {suffix}
      </h2>
      <p className="mt-2 text-gray-600">{label}</p>
    </div>
  );
}

function StatsSection() {
  const [ref, isInView] = useInView<HTMLDivElement>(0.3);

  return (
    <section className="bg-white py-14">
      <div ref={ref} className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {STATS.map((stat) => (
            <StatItem key={stat.label} {...stat} shouldStart={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-bold text-blue-900">How It Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Getting started on the platform takes just three simple steps.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative rounded-xl bg-white p-8 text-center shadow-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-900/10 text-blue-900">
                {step.icon}
              </div>
              <span className="mt-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-900 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-3 text-xl font-bold text-gray-800">{step.title}</h3>
              <p className="mt-3 text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-bold text-blue-900">Platform Features</h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Designed to improve collaboration, engagement, and knowledge sharing among Computer Science
            students.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl bg-white p-8 shadow-md transition-shadow hover:shadow-xl">
              <div className="mb-4 text-blue-900">{feature.icon}</div>
              <h3 className="mb-3 text-xl font-bold text-gray-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="bg-blue-900 py-20 text-white">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="mb-6 text-4xl font-bold">Why This Platform Matters</h2>
        <p className="text-lg leading-relaxed text-gray-200">
          Traditional e-learning systems primarily focus on content delivery. This Peer-to-Peer Learning
          System encourages active student participation, collaboration, and knowledge exchange. It creates a
          supportive digital learning community where students learn not only from lecturers but also from
          one another.
        </p>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="bg-gray-100 py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-4xl font-bold text-blue-900">Join the Learning Community</h2>
        <p className="mt-4 text-gray-600">
          Access discussions, collaborate with peers, share resources, and improve your academic performance.
        </p>
        <Link
          to="/register"
          className="mt-8 inline-block rounded-lg bg-blue-900 px-8 py-4 font-semibold text-white transition-colors hover:bg-blue-800"
        >
          Create Student Account
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="bg-blue-950 py-12 text-gray-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Bowen P2P Learning</h3>
          <p className="mt-2 text-sm">
            Department of Computer Science, Bowen University, Iwo, Osun State, Nigeria.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.id}>
                <button type="button" onClick={() => scrollToSection(link.id)} className="transition-colors hover:text-white">
                  {link.label}
                </button>
              </li>
            ))}
            <li>
              <Link to="/login" className="transition-colors hover:text-white">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="transition-colors hover:text-white">
                Register
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h4>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-3 flex items-center gap-2 text-sm transition-colors hover:text-white"
          >
            <Mail size={16} />
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-gray-700 px-6 pt-6 text-center text-sm text-gray-500">
        © 2026 Bowen University. All Rights Reserved.
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Hero />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <AboutSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
