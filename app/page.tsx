
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useSpring, useMotionValue, useMotionTemplate, AnimatePresence, Variants } from "framer-motion";
import { ArrowRight, Code, Globe, Rocket, Terminal, Zap, Shield, Lock, Activity, Clock, Users, ChevronRight, HelpCircle, Trophy, FastForward, Target } from "lucide-react";

// --- Theme Colors ---
const CYAN = "#00CCFF";
const ORANGE = "#FF6600";
const GREEN = "#00FF55";

// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
    } 
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const glitchVariants = {
    animate: {
      x: [0, -2, 2, -2, 2, 0],
      y: [0, 1, -1, 1, -1, 0],
      filter: [
        "none",
        "hue-rotate(90deg) opacity(0.8)",
        "hue-rotate(-90deg) opacity(0.8)",
        "none"
      ],
      transition: {
        duration: 0.2,
        repeat: Infinity,
        repeatDelay: 5
      }
    }
};

export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30 selection:text-orange-200 overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/5 z-[100]">
        <motion.div 
          className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-cyan-400 origin-left shadow-[0_0_15px_rgba(255,102,0,0.6),0_0_5px_rgba(34,211,238,0.4)] relative" 
          style={{ scaleX }} 
        >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full bg-white blur-sm opacity-50" />
        </motion.div>
      </div>

      <AnimatePresence>
        {loading && <OpeningSequence onComplete={() => setLoading(false)} />}
      </AnimatePresence>
      
      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
          <CyberBackground />
          <Navbar />
          <HeroSection />
          <HighStakesTicker />
          <AboutSection />
          <TracksSection />
          <FocusDomainsSection />
          <BountySection />
          <TimelineSection />
          <SponsorsSection />
          <FAQSection />
          <Footer />
          
          {/* Global UI Effects */}
          <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none" />
          <div className="fixed inset-0 pointer-events-none z-[60] opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        </motion.div>
      )}
    </div>
  );
}



interface HoloCardProps {
  title: string;
  subtitle: string;
  accent: string;
  icon: React.ReactElement;
  desc: string;
  tags: string[];
}

interface TechDetailProps {
  icon: React.ReactElement;
  title: string;
  desc: string;
  accent?: string;
}

// --- Countdown Timer ---
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set target to March 17, 2026, 11:00 AM
    const target = new Date("March 17, 2026 11:00:00").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-4 md:gap-6 font-mono justify-center mb-12">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-orange-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative text-2xl md:text-5xl font-black text-white bg-white/5 border border-white/10 px-3 md:px-5 py-2 w-16 md:w-28 flex items-center justify-center rounded-sm backdrop-blur-md">
              <span className="tabular-nums">{String(value).padStart(2, '0')}</span>
            </div>
          </div>
          <span className="text-[7px] md:text-[9px] text-gray-500 mt-2 tracking-[0.3em] font-black uppercase">
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
};

// --- Opening Sequence ---
const OpeningSequence = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [text, setText] = useState("INITIALIZING SYSTEM...");
    
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2.5;
            });
        }, 25);

        const texts = [
            "ESTABLISHING SECURE CONNECTION...",
            "VERIFYING CREDENTIALS...",
            "BYPASSING FIREWALL...",
            "DECRYPTING MISSION FILES...",
            "ACCESS GRANTED."
        ];
        
        let textIdx = 0;
        const textInterval = setInterval(() => {
            if (textIdx < texts.length) {
                setText(texts[textIdx]);
                textIdx++;
            }
        }, 700);

        setTimeout(onComplete, 4000);

        return () => {
            clearInterval(interval);
            clearInterval(textInterval);
        };
    }, [onComplete]);

    return (
        <motion.div 
            exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
            transition={{ duration: 1, ease: "circIn" }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-mono overflow-hidden"
        >
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-64 md:w-96 relative"
             >
                 <div className="flex justify-between text-[10px] text-green-500 mb-2 font-bold tracking-tighter">
                     <span>PROTOCOL_X_LOADER</span>
                     <span>{Math.round(progress)}%</span>
                 </div>
                 <div className="h-[2px] w-full bg-gray-900 rounded-full overflow-hidden">
                     <motion.div 
                        className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 shadow-[0_0_15px_rgba(255,102,0,0.5)]"
                        style={{ width: `${progress}%` }}
                     />
                 </div>
                 <p className="mt-6 text-center text-cyan-400 text-[10px] animate-pulse tracking-[0.3em] font-bold uppercase">{text}</p>
             </motion.div>
             
             {/* Glitch Background Elements */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/10 animate-glitch" />
        </motion.div>
    );
};

// --- Components ---

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
         <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ duration: 0.6, ease: "anticipate" }}
            className="relative w-10 h-10 flex items-center justify-center"
         >
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 via-cyan-400 to-green-500 rounded-lg opacity-30 blur-md group-hover:opacity-60 transition-opacity" />
            <div className="relative w-full h-full border border-white/20 bg-black/60 rounded-lg flex items-center justify-center backdrop-blur-sm overflow-hidden p-1">
               <Image src="/logo-new.png" alt="IndiaNext Logo" width={32} height={32} className="object-contain" />
            </div>
         </motion.div>
         <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter leading-none">INDIA<span className="text-orange-500">NEXT</span></span>
            <span className="text-[0.55rem] text-gray-500 tracking-[0.4em] font-mono font-bold">DEPLOYMENT_2026</span>
         </div>
      </Link>
      <div className="hidden md:flex items-center gap-10 text-[10px] font-bold text-gray-400 font-mono tracking-widest">
        {[
            { label: './ABOUT', href: '#about' },
            { label: './TRACKS', href: '#tracks' },
            { label: './BOUNTY', href: '#bounty' }
        ].map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-white transition-colors relative group">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-orange-500 transition-all group-hover:w-full" />
            </Link>
        ))}
        
        <Link 
          href="/register" 
          className="group relative px-6 py-2.5 overflow-hidden rounded-sm bg-orange-500 text-black font-black hover:text-white transition-all active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]"
        >
          <div className="absolute inset-0 w-full h-full bg-[#020202] translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <span className="relative z-10 flex items-center gap-2 text-[10px] tracking-widest uppercase italic">
            REGISTER <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>
    </div>
  </nav>
);

const HeroSection = () => {
  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-20 px-4 group overflow-hidden">
       {/* Background Light Effects */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,204,255,0.05),transparent_60%)]" />
       
       <motion.div 
         initial="hidden"
         animate="visible"
         variants={staggerContainer}
         className="text-center relative z-20 max-w-7xl mx-auto"
       >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-3 px-5 py-2 border border-orange-500/20 bg-orange-500/5 rounded-full mb-10 backdrop-blur-sm">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
             <span className="font-mono text-[9px] text-orange-400 tracking-[0.5em] font-black uppercase">Operation: Future Proof India</span>
          </motion.div>

          {/* Main Title with Glitch */}
          <motion.div variants={fadeInUp} className="relative mb-6">
              <motion.h1 
                variants={glitchVariants}
                animate="animate"
                className="text-8xl md:text-[16rem] font-black leading-[0.75] tracking-tighter relative z-10 uppercase scale-y-110 italic"
              >
                 <span className="block text-transparent bg-clip-text bg-gradient-to-br from-orange-500 via-white to-green-500 drop-shadow-[0_0_40px_rgba(255,100,0,0.4)]">
                    India<br/>Next
                 </span>
              </motion.h1>
              <div className="absolute inset-0 text-white/5 blur-3xl -z-10 animate-pulse select-none" aria-hidden="true">India Next</div>
          </motion.div>
          
          <motion.h2 
            variants={fadeInUp}
            className="text-2xl md:text-6xl font-black text-cyan-400 tracking-tighter mb-8 uppercase opacity-90 leading-none"
          >
              <span className="text-white">OUTTHINK</span> THE ALGORITHM
          </motion.h2>

          <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 mb-12">
              <div className="flex items-center gap-4 text-gray-400 font-mono text-xs md:text-sm tracking-[0.2em] font-bold">
                 <Target size={16} className="text-orange-500" />
                 <span>17.03.2026</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                 <span>MUMBAI_HQ</span>
              </div>
              <p className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">K.E.S. Shroff College of Arts & Commerce</p>
          </motion.div>

          {/* Countdown Timer */}
          <motion.div variants={fadeInUp}>
             <CountdownTimer />
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/register" className="relative group overflow-hidden active:scale-95 transition-all duration-200 block">
                 <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-green-500 rounded-sm blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
                 <button className="relative px-14 py-7 bg-[#050505] border border-white/10 rounded-sm leading-none flex items-center justify-center gap-6 group-hover:bg-zinc-900 transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 italic" />
                    <span className="flex flex-col items-start text-left">
                         <span className="text-[0.6rem] text-gray-500 font-mono tracking-widest mb-1 italic uppercase font-bold">ACCESS_PROTOCOLS_V2</span>
                         <span className="text-3xl text-white font-black tracking-tight group-hover:text-orange-500 transition-colors uppercase">Register Now</span>
                    </span>
                    <ChevronRight size={32} className="text-orange-500 group-hover:translate-x-2 transition-transform" />
                 </button>
              </Link>
          </motion.div>
       </motion.div>
       
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 0.3 }}
         transition={{ delay: 2, duration: 1 }}
         className="absolute bottom-10 left-10 hidden lg:block"
       >
          <div className="flex flex-col gap-2 font-mono text-[8px] text-cyan-700 uppercase font-black tracking-widest">
             <div className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-700" /> LATENCY: 24MS</div>
             <div className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-700" /> PACKET_STATUS: NOMINAL</div>
             <div className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-700" /> ENCRYPTION: SHA-256</div>
          </div>
       </motion.div>
    </section>
  );
};

const HighStakesTicker = () => {
    return (
        <div className="relative z-20 py-16 bg-[#030303] border-y border-white/5 overflow-hidden">
             <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                 {[
                    { label: 'BOUNTY_POOL', value: '₹1 Lakh+', color: 'text-white' },
                    { label: 'RUN_TIME', value: '24H', color: 'text-orange-500' },
                    { label: 'SELECTED_TEAMS', value: '100', color: 'text-green-500' },
                    { label: 'ENTRY_FEE', value: 'FREE', color: 'text-cyan-400' }
                 ].map((stat, i) => (
                     <motion.div 
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        className="relative group px-6 border-l border-white/5 first:border-l-0"
                    >
                        <p className="text-gray-600 font-mono text-[9px] mb-3 tracking-[0.2em] font-black">{stat.label}</p>
                        <p className={`text-4xl md:text-6xl font-black ${stat.color} tracking-tighter font-mono group-hover:scale-105 transition-transform cursor-default`}>
                            {stat.value}
                        </p>
                    </motion.div>
                 ))}
             </div>
        </div>
    )
}

const AboutSection = () => (
    <section id="about" className="py-40 px-6 relative z-10 bg-black overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/5 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto">
             <div className="grid lg:grid-cols-2 gap-24 items-center">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                 >
                     <div className="inline-block px-4 py-1.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-[10px] tracking-[0.4em] font-black mb-8 uppercase italic">./MISSION_BRIEFING</div>
                     <h2 className="text-6xl md:text-[5.5rem] font-black mb-10 tracking-tighter uppercase leading-[0.85]">
                        The Code That <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-blue-600 shadow-glow">Survives Tomorrow</span>
                     </h2>
                     <p className="text-gray-400 leading-relaxed text-2xl mb-10 font-bold tracking-tight">
                        We aren&apos;t just hacking for a day; we are building for the decade. <span className="text-orange-500">IndiaNext</span> is a National-Level Innovation Challenge empowering 400+ developers to build solutions for Bharat 2.0.
                     </p>
                     <div className="p-8 border-l-4 border-orange-600 bg-white/5 rounded-sm backdrop-blur-sm">
                        <p className="text-white text-sm font-mono tracking-widest uppercase italic font-black">
                           MISSION HOST: K.E.S. SHROFF COLLEGE (AUTONOMOUS)
                        </p>
                        <p className="text-gray-500 text-[10px] font-mono mt-2 tracking-widest uppercase">NAAC &apos;A&apos; GRADE | QS I-GAUGE GOLD RATING | MUMBAI, MH</p>
                     </div>
                 </motion.div>
                 
                 <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="grid sm:grid-cols-2 gap-6"
                 >
                     <TechDetail icon={<Trophy />} title="₹1 LAKH+" desc="PRIZE REWARD" accent={ORANGE} />
                     <TechDetail icon={<Clock />} title="24 HOURS" desc="NON-STOP DEV" accent={GREEN} />
                     <TechDetail icon={<Users />} title="100 TEAMS" desc="ELITE SQUAD" accent={CYAN} />
                     <TechDetail icon={<Zap />} title="FREE" desc="SYSTEM ENTRY" accent="#FFF" />
                 </motion.div>
             </div>
        </div>
    </section>
);

const TracksSection = () => {
    return (
        <section id="tracks" className="py-40 relative z-10 bg-[#020202]">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-24 text-center"
                >
                    <h2 className="text-6xl md:text-9xl font-black mb-6 uppercase tracking-tighter italic">Choose Your Battlefield</h2>
                    <div className="flex items-center justify-center gap-4 text-orange-500 font-mono text-[10px] tracking-[0.5em] font-black uppercase">
                        <div className="w-12 h-px bg-orange-500/30" />
                        SELECT_MISSION_TYPE
                        <div className="w-12 h-px bg-orange-500/30" />
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16">
                    <HoloCard 
                        title="TRACK A: THE SOLVERS"
                        subtitle="SURPRISE_CHALLENGE (70 SLOTS)"
                        accent={ORANGE}
                        icon={<Terminal />}
                        desc="A secret Problem Statement revealed at H-Hour (11:00 AM). High stakes, low sleep, pure logic."
                        tags={["Algorithm Wizards", "Execution Specialists"]}
                    />
                    <HoloCard 
                        title="TRACK B: THE VISIONARIES"
                        subtitle="OPEN_INNOVATION (30 SLOTS)"
                        accent={GREEN}
                        icon={<Rocket />}
                        desc="Bring your startup vision to life. No slides, no talk—just code the MVP that changes everything."
                        tags={["Aspiring Founders", "Product Engineers"]}
                    />
                </div>
            </div>
        </section>
    )
}

const FocusDomainsSection = () => (
    <section className="py-40 relative z-10 bg-black border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-5xl md:text-[8rem] font-black mb-20 uppercase tracking-tighter italic leading-none opacity-90">Focus Domains</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                {[
                    { title: "TrustTech", desc: "Digital Sovereignty", icon: <Shield /> },
                    { title: "Sustain AI", desc: "Climate Optimization", icon: <Zap /> },
                    { title: "BioDigital", desc: "Next-Gen Wellness", icon: <Activity /> },
                    { title: "FutureWork", desc: "Next-Gen Skilling", icon: <Code /> },
                    { title: "RuralFin", desc: "Digital Inclusion", icon: <Globe /> }
                ].map((domain, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        className="p-10 border border-white/10 bg-[#050505] rounded-sm hover:border-cyan-500 transition-all text-left relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            {React.cloneElement(domain.icon, { size: 100 })}
                        </div>
                        <div className="mb-8 text-cyan-400 scale-125 origin-left">{domain.icon}</div>
                        <h4 className="font-black text-2xl mb-3 text-white uppercase tracking-tighter leading-tight">{domain.title}</h4>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] font-bold">{domain.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const BountySection = () => (
    <section id="bounty" className="py-40 relative z-10 bg-black">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-32 relative">
                <motion.h2 
                    initial={{ opacity: 0, scale: 1.5 }}
                    whileInView={{ opacity: 0.05, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="text-[15rem] font-black leading-none tracking-tighter uppercase absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full select-none pointer-events-none italic"
                >
                    BOUNTY
                </motion.h2>
                <h2 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter relative z-10 leading-none">The Bounty</h2>
                <div className="inline-block px-6 py-2 bg-orange-600 text-white font-mono text-sm tracking-[0.3em] mt-8 uppercase font-black italic">
                   TOTAL POOL: ₹1,00,000+
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 mb-20">
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="p-12 border-2 border-orange-500/20 bg-orange-500/5 rounded-sm relative group overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 font-mono text-[8rem] font-black select-none group-hover:opacity-20 transition-opacity italic">01</div>
                    <h3 className="text-4xl font-black mb-12 flex items-center gap-5 italic">
                        <Terminal size={40} className="text-orange-500" />
                        THE SOLVERS
                    </h3>
                    <div className="space-y-8">
                        {[
                            { label: "COMMANDER (1ST)", prize: "₹40,000", color: "text-orange-500" },
                            { label: "LIEUTENANT (2ND)", prize: "₹20,000", color: "text-white" },
                            { label: "SPECIALIST (3RD)", prize: "₹10,000", color: "text-white" }
                        ].map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-6 border border-white/10 bg-black group-hover:border-orange-500/30 transition-colors">
                                <span className="font-mono text-xs text-gray-500 tracking-[0.3em] font-black">{p.label}</span>
                                <span className={`text-3xl md:text-4xl font-black ${p.color} font-mono tracking-tighter`}>{p.prize}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="p-12 border-2 border-green-500/20 bg-green-500/5 rounded-sm relative group overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 font-mono text-[8rem] font-black select-none group-hover:opacity-20 transition-opacity italic">02</div>
                    <h3 className="text-4xl font-black mb-12 flex items-center gap-5 italic">
                        <Rocket size={40} className="text-green-500" />
                        THE VISIONARIES
                    </h3>
                    <div className="space-y-8">
                        {[
                            { label: "ARCHITECT (1ST)", prize: "₹20,000", color: "text-green-500" },
                            { label: "STRATEGIST (2ND)", prize: "₹10,000", color: "text-white" }
                        ].map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-6 border border-white/10 bg-black group-hover:border-green-500/30 transition-colors">
                                <span className="font-mono text-xs text-gray-500 tracking-[0.3em] font-black">{p.label}</span>
                                <span className={`text-3xl md:text-4xl font-black ${p.color} font-mono tracking-tighter`}>{p.prize}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {["Incubation Support", "Internship Referrals", "Cloud Credits", "Elite SWAG"].map((perk, i) => (
                    <motion.div 
                        key={i} 
                        whileHover={{ y: -5 }}
                        className="px-8 py-6 border border-white/10 bg-[#050505] rounded-sm text-center group"
                    >
                        <span className="text-xs font-mono text-gray-600 tracking-[0.4em] uppercase font-black group-hover:text-cyan-400 transition-colors italic">{perk}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const TimelineSection = () => {
    const sectionRef = React.useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start center", "end center"]
    });

    const [realTimePercent, setRealTimePercent] = useState(0);

    const timelineEvents = [
        { id: 1, event: "Registrations Live", timestamp: new Date("2026-02-25T09:00:00"), date: "FEB 25, 2026", day: "WEDNESDAY", time: "09:00 AM", desc: "ENLISTMENT PROTOCOL INITIATED", icon: <FastForward /> },
        { id: 2, event: "Registration End", timestamp: new Date("2026-03-05T23:59:00"), date: "MAR 05, 2026", day: "THURSDAY", time: "11:59 PM", desc: "SYSTEM LOCKDOWN", icon: <Lock /> },
        { id: 3, event: "Selected Teams Announcement", timestamp: new Date("2026-03-08T18:00:00"), date: "MAR 08, 2026", day: "SUNDAY", time: "06:00 PM", desc: "SQUAD DISCOVERY PHASE", icon: <Users /> },
        { id: 4, event: "Hackathon Check-in", timestamp: new Date("2026-03-17T08:00:00"), date: "MAR 17, 2026", day: "TUESDAY", time: "08:00 AM", desc: "BASE CAMP ARRIVAL", icon: <Globe /> },
        { id: 5, event: "Mission H-Hour", timestamp: new Date("2026-03-17T11:30:00"), date: "MAR 17, 2026", day: "TUESDAY", time: "11:30 AM", desc: "BUILD SEQUENCE START", icon: <Rocket /> },
        { id: 6, event: "Supply Drop I", timestamp: new Date("2026-03-17T13:30:00"), date: "MAR 17, 2026", day: "TUESDAY", time: "01:30 PM", desc: "LUNCH RATIONS", icon: <Activity /> },
        { id: 7, event: "Tactical Sync I", timestamp: new Date("2026-03-17T15:30:00"), date: "MAR 17, 2026", day: "TUESDAY", time: "03:30 PM", desc: "MENTOR STRATEGY ROUND", icon: <Target /> },
        { id: 8, event: "Supply Drop II", timestamp: new Date("2026-03-17T20:30:00"), date: "MAR 17, 2026", day: "TUESDAY", time: "08:30 PM", desc: "DINNER RATIONS", icon: <Activity /> },
        { id: 9, event: "Mission End", timestamp: new Date("2026-03-18T11:30:00"), date: "MAR 18, 2026", day: "WEDNESDAY", time: "11:30 AM", desc: "PROTOCOL SUBMISSION", icon: <Shield /> },
        { id: 10, event: "Victory Protocol", timestamp: new Date("2026-03-18T16:30:00"), date: "MAR 18, 2026", day: "WEDNESDAY", time: "04:30 PM", desc: "AWARD ENFORCEMENT", icon: <Trophy /> }
    ];

    useEffect(() => {
        const calculateProgress = () => {
            const now = new Date(); 
            const start = timelineEvents[0].timestamp;
            const end = timelineEvents[timelineEvents.length - 1].timestamp;
            
            if (now < start) setRealTimePercent(0);
            else if (now > end) setRealTimePercent(100);
            else {
                const total = end.getTime() - start.getTime();
                const current = now.getTime() - start.getTime();
                setRealTimePercent((current / total) * 100);
            }
        };

        calculateProgress();
        const interval = setInterval(calculateProgress, 60000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const _scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    return (
        <section id="timeline" ref={sectionRef} className="py-60 relative z-10 bg-[#020202] overflow-hidden">
            <div className="max-w-5xl mx-auto px-6 relative">
                <div className="mb-32 flex flex-col items-center">
                    <p className="text-orange-500 font-mono text-[10px] tracking-[1em] mb-4 uppercase font-black italic">{"// MISSION_CHRONOLOGY"}</p>
                    <h2 className="text-6xl md:text-9xl font-black text-center uppercase tracking-tighter italic leading-none">The Roadmap</h2>
                </div>

                <div className="relative">
                    {/* Background Line (Ghost) */}
                    <div className="absolute left-10 md:left-1/2 top-0 bottom-0 w-[2px] bg-white/5 -translate-x-1/2 hidden md:block" />
                    
                    {/* Live Progress Bar (Based on Real Time) */}
                    <div className="absolute left-10 md:left-1/2 top-0 bottom-0 w-[2px] bg-white/10 -translate-x-1/2 z-10 hidden md:block">
                        <div 
                            className="absolute top-0 w-full bg-gradient-to-b from-orange-500 via-orange-500/50 to-orange-500/0 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(255,102,0,0.3)]"
                            style={{ height: `${realTimePercent}%` }}
                        />
                    </div>

                    {/* Real-time "NOW" Pointer */}
                    {realTimePercent > 0 && realTimePercent < 100 && (
                        <div 
                            className="absolute left-10 md:left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center transition-all duration-1000 ease-linear"
                            style={{ top: `${realTimePercent}%` }}
                        >
                            <div className="w-10 h-10 border border-orange-500 rounded-full animate-ping absolute -left-[19px]" />
                            <div className="ml-8 bg-orange-500 text-black px-2 py-0.5 text-[8px] font-black font-mono skew-x-[-12deg] shadow-[4px_4px_0_rgba(255,255,255,0.1)]">
                                MISSION_IN_PROGRESS
                            </div>
                        </div>
                    )}

                    {/* Mobile Line */}
                    <div className="absolute left-[39px] top-0 bottom-0 w-px bg-white/5 md:hidden" />

                    <div className="space-y-24 relative">
                        {timelineEvents.map((item, i) => {
                            const isPast = new Date() > item.timestamp;
                            const _isNext = !isPast && (i === 0 || new Date() > timelineEvents[i-1].timestamp);

                            return (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    className={`relative flex items-center gap-12 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} ${isPast ? 'opacity-40' : 'opacity-100'}`}
                                >
                                    {/* Center Point */}
                                    <div className={`absolute left-10 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#020202] border-2 ${isPast ? 'border-gray-800' : 'border-orange-500'} z-30 flex items-center justify-center`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isPast ? 'bg-gray-800' : 'bg-orange-500 animate-pulse'}`} />
                                    </div>

                                    {/* Content Side */}
                                    <div className="flex-1 pl-20 md:pl-0">
                                        <div className={`flex flex-col ${i % 2 === 0 ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}>
                                            <div className="flex items-center gap-4 mb-3">
                                                {i % 2 !== 0 && (
                                                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${isPast ? 'border-white/5 text-gray-800' : 'border-orange-500/50 text-orange-500'} bg-white/[0.02]`}>
                                                        {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<{size: number}>, { size: 18 })}
                                                    </div>
                                                )}
                                                <div className="space-y-0.5">
                                                    <span className={`block font-mono text-[9px] font-black tracking-widest uppercase ${isPast ? 'text-gray-600' : 'text-orange-500'}`}>
                                                        {item.day} • {item.date} • {item.time}
                                                    </span>
                                                    <h3 className={`text-3xl font-black uppercase tracking-tighter italic ${isPast ? 'text-gray-500' : 'text-white'}`}>{item.event}</h3>
                                                </div>
                                                {i % 2 === 0 && (
                                                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${isPast ? 'border-white/5 text-gray-800' : 'border-orange-500/50 text-orange-500'} bg-white/[0.02]`}>
                                                        {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<{size: number}>, { size: 18 })}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-gray-600 font-mono text-[9px] uppercase tracking-[0.3em] font-bold max-w-xs">{item.desc}</p>
                                        </div>
                                    </div>

                                    {/* Time Side */}
                                    <div className="hidden md:flex flex-1 flex-col justify-center">
                                        <div className={`p-4 ${i % 2 === 0 ? 'text-left pl-12' : 'text-right pr-12'}`}>
                                            <span className={`text-5xl font-black font-mono italic transition-colors uppercase select-none ${isPast ? 'text-white/5' : 'text-white/20 opacity-100 group-hover:text-white/40'}`}>
                                                {item.time}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="md:hidden absolute top-[-24px] left-[60px]">
                                         <span className={`text-[11px] font-mono font-black tracking-widest ${isPast ? 'text-gray-700' : 'text-orange-500/80'}`}>{item.time}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

const SponsorsSection = () => (
    <section className="py-40 relative z-10 bg-[#020202] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-gray-700 font-mono text-[9px] tracking-[1em] mb-20 uppercase font-black italic select-none animate-pulse">{"// STRATEGIC_BACKING_INITIATIVE"}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { name: "Your Brand Here", status: "PENDING_ACQUISITION" },
                    { name: "Sponsor Alpha", status: "LINK_ACTIVE" },
                    { name: "Partner Bravo", status: "LINK_ACTIVE" },
                    { name: "Node Delta", status: "LINK_ACTIVE" }
                ].map((brand, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -5, borderColor: "rgba(255,102,0,0.5)", backgroundColor: "rgba(255,102,0,0.05)" }}
                        className="h-40 border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center p-8 grayscale hover:grayscale-0 transition-all cursor-crosshair group relative overflow-hidden rounded-sm"
                    >
                         <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 group-hover:border-orange-500 transition-colors" />
                         <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 group-hover:border-orange-500 transition-colors" />
                         
                         <span className="text-gray-500 font-mono text-[11px] tracking-widest font-black uppercase group-hover:text-white transition-colors mb-2">
                            {brand.name}
                         </span>
                         <span className="text-[7px] font-mono text-gray-700 tracking-[0.4em] font-bold uppercase group-hover:text-orange-500 opacity-50 group-hover:opacity-100 transition-all">
                            {brand.status}
                         </span>
                         
                         <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/0 via-transparent to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-orange-500/5 transition-all" />
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const FAQSection = () => (
    <section className="py-40 relative z-10 bg-black">
        <div className="max-w-5xl mx-auto px-6 text-left">
            <div className="mb-24">
                <h2 className="text-7xl md:text-[8rem] font-black uppercase tracking-tighter italic leading-none mb-4">Protocols</h2>
                <p className="text-cyan-500 font-mono text-[10px] tracking-[0.5em] uppercase font-black">SYSTEM_QUERY_HANDLING</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                {[
                    { q: "Registration Fees?", a: "Negative. IndiaNext is mission-critical and free for all elite teams selected." },
                    { q: "Team Structure?", a: "Strictly 4 operatives per squad. Inter-college alliances are authorized." },
                    { q: "Pre-built Code?", a: "Unauthorized. All systems must be engineered on-site. Timestamp audit in effect." },
                    { q: "Equipment Loadout?", a: "Bring your own hardware (Laptops, Chargers). Power grids and Wi-Fi uplink provided." }
                ].map((faq, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="p-10 border border-white/10 bg-[#030303] hover:border-cyan-500/50 transition-all group"
                    >
                        <div className="flex items-start gap-6 mb-6">
                            <HelpCircle className="text-cyan-500 shrink-0 mt-1" size={24} />
                            <h4 className="text-2xl font-black uppercase tracking-tight italic group-hover:text-white transition-colors">{faq.q}</h4>
                        </div>
                        <p className="text-gray-500 leading-relaxed pl-12 text-sm font-bold tracking-tight">
                           {faq.a}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer className="py-32 border-t border-white/10 bg-black relative z-10">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-16 items-start mb-24 text-left">
                <div className="col-span-1 md:col-span-2">
                    <h4 className="font-black text-4xl mb-8 uppercase tracking-tighter italic">K.E.S. Shroff College</h4>
                    <p className="text-gray-500 font-mono text-[10px] leading-relaxed uppercase tracking-[0.2em] font-black">
                        Autonomous | NAAC &apos;A&apos; Grade (3.58 CGPA)<br/>
                        QS I-Gauge Gold | Best College Award (University of Mumbai)<br/>
                        Mumbai, MH 400067, IN
                    </p>
                </div>
                <div>
                   <h4 className="text-gray-700 font-mono text-[10px] uppercase tracking-[0.5em] mb-8 font-black">DIRECTORIES</h4>
                   <div className="flex flex-col gap-5 text-[10px] font-black tracking-widest uppercase">
                        <Link href="#" className="text-gray-500 hover:text-orange-500 transition-colors italic">./RULEBOOK_v1.0</Link>
                        <Link href="#" className="text-gray-500 hover:text-orange-500 transition-colors italic">./CONDUCT_PROTOCOL</Link>
                        <Link href="#" className="text-gray-500 hover:text-orange-500 transition-colors italic">./SPONSOR_DECK</Link>
                   </div>
                </div>
                <div>
                   <h4 className="text-gray-700 font-mono text-[10px] uppercase tracking-[0.5em] mb-8 font-black">COMMS_LINK</h4>
                   <div className="flex flex-col gap-4 text-xs font-black">
                        <a href="mailto:hackathon@kessc.edu.in" className="text-cyan-400 hover:text-white transition-colors underline decoration-cyan-400/30">HACKATHON@KESSC.EDU.IN</a>
                        <p className="text-white tracking-widest italic">+91 75068 54879</p>
                        <p className="text-gray-600 mt-4 text-[10px] border border-white/5 py-1 px-3 inline-block">@KES_SHROFF_COLLEGE</p>
                   </div>
                </div>
            </div>
            <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 relative rounded-sm border border-white/20 overflow-hidden grayscale group hover:grayscale-0 transition-all">
                        <Image src="/Logo.jpg" alt="Logo" width={48} height={48} className="object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-2xl tracking-tighter uppercase leading-none">IndiaNext</span>
                        <span className="text-[10px] font-mono text-gray-700 font-bold uppercase tracking-widest">Global_Protocol_v2.0.26</span>
                    </div>
                </div>
                <p className="text-gray-800 text-[8px] font-mono tracking-[0.8em] font-black uppercase text-center">&copy; 2026 INDIANEXT // DECRYPTED_MISSION_DATA_SECURE</p>
            </div>
        </div>
    </footer>
);

// --- Subcomponents ---

const HoloCard = ({ title, subtitle, accent, icon, desc, tags }: HoloCardProps) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
    };

    return (
        <motion.div 
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="group relative min-h-[500px] bg-[#050505] border border-white/5 p-12 overflow-hidden backdrop-blur-sm text-left transition-colors hover:border-white/10"
        >
            <motion.div 
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500"
                style={{
                  background: useMotionTemplate`
                    radial-gradient(
                      800px circle at ${x}px ${y}px,
                      ${accent}20,
                      transparent 80%
                    )
                  `,
                }}
            />
            
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/10" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/10" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="w-24 h-24 mb-12 flex items-center justify-center border border-white/10 bg-white/5 rounded-sm relative group-hover:scale-110 transition-transform">
                     {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<{ size?: number; style?: React.CSSProperties }>, { size: 48, style: { color: accent } })}
                     <div className="absolute inset-0 bg-white/5 animate-pulse" />
                </div>

                <div className="mb-4 font-mono text-[10px] font-black tracking-[0.5em]" style={{ color: accent }}>{subtitle}</div>
                <h3 className="text-5xl md:text-6xl font-black mb-10 text-white uppercase tracking-tighter leading-[0.8] italic">{title}</h3>
                
                <p className="text-gray-500 text-xl mb-12 leading-tight flex-grow font-bold tracking-tight">{desc}</p>
                
                <div className="flex flex-col gap-6 mt-auto">
                    <div className="flex flex-wrap gap-3">
                        {tags.map((t: string) => (
                            <span key={t} className="px-4 py-1.5 border border-white/5 text-[9px] font-mono text-gray-600 uppercase tracking-widest bg-black font-black italic">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

const TechDetail = ({ icon, title, desc, accent = CYAN }: TechDetailProps) => (
    <motion.div 
        variants={fadeInUp}
        whileHover={{ x: 10 }}
        className="flex items-start gap-6 p-8 border border-white/5 bg-white/5 transition-all group rounded-sm text-left relative overflow-hidden"
    >
        <div className="absolute top-0 left-0 w-1 h-0 bg-orange-500 group-hover:h-full transition-all duration-300" style={{ backgroundColor: accent }} />
        <div className="transition-all group-hover:translate-x-1 group-hover:scale-110" style={{ color: accent }}>{icon}</div>
        <div>
            <h4 className="font-black text-3xl mb-1 uppercase tracking-tighter text-white italic">{title}</h4>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] font-black">{desc}</p>
        </div>
    </motion.div>
);

const CyberBackground = () => (
    <div className="fixed inset-0 z-0 bg-[#050505] perspective-1000 overflow-hidden">
        {/* Deep Space Base */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0d0d1a_0%,#000000_100%)]" />
        
        {/* Dynamic Nebulas */}
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-orange-600 rounded-full blur-[200px] mix-blend-screen" 
        />
        <motion.div 
            animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.05, 0.08, 0.05]
            }}
            transition={{ duration: 15, repeat: Infinity, delay: 2 }}
            className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-green-600 rounded-full blur-[200px] mix-blend-screen" 
        />

        {/* Moving Grid Floor */}
        <div 
            className="absolute bottom-[-10%] left-[-50%] right-[-50%] h-[80vh] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [transform:rotateX(75deg)] origin-bottom animate-grid-flow opacity-30"
        />
        
        {/* Subtle Horizontal Scanline */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20" />
    </div>
);
