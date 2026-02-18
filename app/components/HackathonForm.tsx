
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Check, Loader2 } from 'lucide-react';

// Design Constants
const THEME = {
  bg: 'bg-black',
  text: 'text-white',
  accent: 'text-neon-orange', 
  glow: 'shadow-[inset_0_0_100px_rgba(255,100,0,0.1)]',
};

const QUESTIONS = [
  // 1. CHOOSE YOUR TRACK
  {
    id: 'track',
    type: 'choice',
    question: "Choose Your Mission",
    subtext: "TRACK A (Solvers): Surprise Problem at 11 AM (₹40K Prize). TRACK B (Visionaries): Build your Startup Idea (₹20K Prize).",
    options: ["A: The Solvers", "B: The Visionaries"],
    required: true,
  },
  
  // 2. TEAM CONFIGURATION (Leader)
  {
    id: 'teamName',
    type: 'text',
    question: "Team Name",
    placeholder: "e.g. System Override",
    required: true,
  },
  {
    id: 'leaderName',
    type: 'text',
    question: "Team Leader Name",
    subtext: "You will be the primary point of contact.",
    placeholder: "Full Name",
    required: true,
  },
  {
    id: 'leaderEmail', // Changed from 'email' to 'leaderEmail' to match schema
    type: 'email',
    question: "Leader Email",
    placeholder: "leader@college.edu",
    required: true,
    isEmail: true,
  },
  {
    id: 'leaderPhone',
    type: 'tel',
    question: "Leader Phone",
    placeholder: "+91 00000 00000",
    required: true,
  },
  {
    id: 'leaderCollege',
    type: 'text',
    question: "Leader College / Institution",
    placeholder: "University Name",
    required: true,
  },
  {
    id: 'leaderGithub',
    type: 'url',
    question: "Leader GitHub URL",
    placeholder: "https://github.com/...",
    required: true,
  },
  {
    id: 'leaderLinkedin',
    type: 'url',
    question: "Leader LinkedIn URL",
    placeholder: "https://linkedin.com/in/...",
    required: false,
  },

  // 3. MEMBER DETAILS (2, 3, 4)
  // Member 2
  {
    id: 'member2Name',
    type: 'text',
    question: "Member 2 Name",
    placeholder: "Full Name",
    required: true,
  },
  {
    id: 'member2Github',
    type: 'url',
    question: "Member 2 GitHub",
    placeholder: "https://github.com/...",
    required: true,
  },
  // Member 3
  {
    id: 'member3Name',
    type: 'text',
    question: "Member 3 Name",
    placeholder: "Full Name",
    required: true,
  },
  {
    id: 'member3Github',
    type: 'url',
    question: "Member 3 GitHub",
    placeholder: "https://github.com/...",
    required: true,
  },
  // Member 4
  {
    id: 'member4Name',
    type: 'text',
    question: "Member 4 Name",
    placeholder: "Full Name",
    required: true,
  },
  {
    id: 'member4Github',
    type: 'url',
    question: "Member 4 GitHub",
    placeholder: "https://github.com/...",
    required: true,
  },

  // 4. TRACK SPECIFIC QUESTIONS
  // Track A: Past Experience
  {
    id: 'pastHackathonExperience',
    type: 'long-text',
    question: "Past Hackathon Experience",
    subtext: "Briefly list previous hackathons won or participated in.",
    placeholder: "Winner at XYZ Hackathon, Built ABC project...",
    required: false,
    condition: (answers: any) => answers.track === "A: The Solvers",
  },

  // Track B: Project Details
  {
    id: 'projectTitle',
    type: 'text',
    question: "Startup Idea Title",
    placeholder: "Project Name",
    required: true,
    condition: (answers: any) => answers.track === "B: The Visionaries",
  },
  {
    id: 'projectAbstract',
    type: 'long-text',
    question: "Project Abstract (200 Words)",
    subtext: "Describe the problem you are solving and your unique solution.",
    placeholder: "We are building a...",
    required: true,
    condition: (answers: any) => answers.track === "B: The Visionaries",
  },
  {
    id: 'focusArea',
    type: 'choice',
    question: "Focus Area",
    options: [
      "TrustTech (Blockchain/CyberSec)",
      "Sustainable Intelligence (Green Tech)",
      "Bio-Digital Systems (HealthTech)",
      "Next-Gen Skilling (EdTech)",
      "Rural FinTech (Inclusion)"
    ],
    required: true,
    condition: (answers: any) => answers.track === "B: The Visionaries",
  },
  {
    id: 'techStack',
    type: 'text',
    question: "Proposed Tech Stack",
    placeholder: "Next.js, Solidity, Python...",
    required: true,
    condition: (answers: any) => answers.track === "B: The Visionaries",
  },
];

export default function HackathonForm() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [direction, setDirection] = useState(0);

  // OTP State
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const totalSteps = QUESTIONS.length;
  // Dynamic progress calculation logic could be better but linear is fine for now
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentQuestion = QUESTIONS[currentStep];

  const handleStart = () => setStarted(true);

  const getNextValidStep = (current: number, dir: number, currentAnswers: any) => {
    let nextStep = current + dir;
    while (nextStep >= 0 && nextStep < totalSteps) {
       const q = QUESTIONS[nextStep];
       if (q.condition && !q.condition(currentAnswers)) {
         nextStep += dir;
       } else {
         return nextStep;
       }
    }
    return nextStep;
  };

  const handleNext = async () => {
    // Special handling for email step
    if (currentQuestion.id === 'leaderEmail' && !emailVerified) {
        if (!answers.leaderEmail || !answers.leaderEmail.includes('@')) {
            setErrorMsg("Please enter a valid email.");
            return;
        }
        await sendOtp();
        return;
    }

    const nextStep = getNextValidStep(currentStep, 1, answers);
    
    if (nextStep < totalSteps) {
      setDirection(1);
      setCurrentStep(nextStep);
      setErrorMsg(""); // clear errors
    } else {
      await submitForm();
    }
  };

  const submitForm = async () => {
      setLoading(true);
      
      // DEMO MODE BYPASS
      if (answers.leaderEmail === "demo@indianext.in") {
          setTimeout(() => {
              setIsCompleted(true);
              setLoading(false);
          }, 1500); // Fake delay
          return;
      }

      // Map Friendly Track Name to API value
      const trackCode = answers.track.startsWith("A") ? "A" : "B";
      
      const payload = {
          ...answers,
          track: trackCode,
      };

      try {
          const res = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Submission failed');
          
          setIsCompleted(true);
      } catch (err: any) {
          setErrorMsg(err.message);
      } finally {
          setLoading(false);
      }
  };

  const sendOtp = async () => {
      setLoading(true);
      setErrorMsg("");

      // DEMO MODE BYPASS
      if (answers.leaderEmail === "demo@indianext.in") {
          setTimeout(() => {
              setShowOtpInput(true);
              setLoading(false);
              alert("DEMO OTP: 123456"); // Alert for user convenience
          }, 1000);
          return;
      }

      try {
          const res = await fetch('/api/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: answers.leaderEmail }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          
          setShowOtpInput(true);
      } catch (err: any) {
          setErrorMsg(err.message);
      } finally {
          setLoading(false);
      }
  };

  const verifyOtp = async () => {
      setLoading(true);
      setErrorMsg("");

      // DEMO MODE BYPASS
      if (answers.leaderEmail === "demo@indianext.in") {
          if (otpValue === "123456") {
              setTimeout(() => {
                  setEmailVerified(true);
                  setShowOtpInput(false);
                  const nextStep = getNextValidStep(currentStep, 1, answers);
                  setDirection(1);
                  setCurrentStep(nextStep);
                  setLoading(false);
              }, 1000);
              return;
          } else {
              setErrorMsg("Invalid Demo OTP (Try 123456)");
              setLoading(false);
              return;
          }
      }

      try {
          const res = await fetch('/api/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: answers.leaderEmail, otp: otpValue }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setEmailVerified(true);
          setShowOtpInput(false);
          // Auto advance after verification
          setTimeout(() => {
             const nextStep = getNextValidStep(currentStep, 1, answers);
             setDirection(1);
             setCurrentStep(nextStep);
          }, 500);

      } catch (err: any) {
          setErrorMsg(err.message);
      } finally {
          setLoading(false);
      }
  };

  const handlePrev = () => {
    if (showOtpInput) {
        setShowOtpInput(false);
        return;
    }
    const prevStep = getNextValidStep(currentStep, -1, answers);
    if (prevStep >= 0) {
      setDirection(-1);
      setCurrentStep(prevStep);
      setErrorMsg("");
    }
  };

  const handleAnswer = (value: any) => {
    setAnswers((prev: any) => ({ ...prev, [QUESTIONS[currentStep].id]: value }));
    setErrorMsg("");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && started && !isCompleted && !loading) {
        if (showOtpInput) {
             if (otpValue.length === 6) verifyOtp();
             return;
        }
        
        if (currentQuestion.type !== 'long-text' || e.metaKey || e.ctrlKey) { 
           e.preventDefault();
           if (currentQuestion.required && !answers[currentQuestion.id]) return;
           handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, isCompleted, currentStep, answers, currentQuestion, showOtpInput, otpValue, loading]);


  if (!started) return <WelcomeScreen onStart={handleStart} />;
  if (isCompleted) return <ThankYouScreen />;

  return (
    <div className={`min-h-screen w-full flex flex-col ${THEME.bg} ${THEME.text} ${THEME.glow} relative overflow-hidden font-sans`}>
      {/* Header */}
      <header className="absolute top-8 left-8 z-10 flex items-center gap-2">
           <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full"></div>
           </div>
           <span className="font-semibold text-lg tracking-tight">IndiaNext</span>
      </header>

      {/* Progress */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
        <motion.div 
          className="h-full bg-neon-orange"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-16 md:px-32 max-w-4xl mx-auto w-full">
         <AnimatePresence mode="wait" custom={direction}>
           {!showOtpInput ? (
               <motion.div
                 key={currentStep}
                 custom={direction}
                 initial={{ opacity: 0, y: direction > 0 ? 50 : -50 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: direction > 0 ? -50 : 50 }}
                 transition={{ duration: 0.3 }}
                 className="w-full"
               >
                 <div className="mb-6 flex items-center gap-3 text-neon-orange">
                   <span className="text-sm font-medium">Step {currentStep + 1}</span>
                 </div>

                 <h2 className="text-2xl md:text-4xl font-light mb-4 leading-tight">
                   {currentQuestion.question} <span className="text-red-500 text-lg align-top">{currentQuestion.required && '*'}</span>
                 </h2>
                 
                 {currentQuestion.subtext && (
                   <p className="text-gray-400 text-lg mb-8 font-light max-w-2xl">{currentQuestion.subtext}</p>
                 )}

                 <div className="mt-8">
                   <InputRenderer 
                     question={currentQuestion} 
                     value={answers[currentQuestion.id] || ''} 
                     onChange={handleAnswer} 
                   />
                 </div>
                 
                 {errorMsg && <p className="text-red-400 mt-4">{errorMsg}</p>}

                 <div className="mt-8 flex items-center gap-4">
                    <button 
                       onClick={handleNext}
                       disabled={loading || (currentQuestion.required && !answers[currentQuestion.id])}
                       className="px-6 py-2 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <>OK <Check size={18} /></>}
                    </button>
                    <span className="text-xs text-gray-500 hidden sm:inline ml-2">press <strong className="text-gray-300">Enter ↵</strong></span>
                 </div>
               </motion.div>
           ) : (
               <motion.div
                 key="otp"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="w-full"
               >
                  <h2 className="text-2xl md:text-4xl font-light mb-4 leading-tight">Enter Verification Code</h2>
                  <p className="text-gray-400 text-lg mb-8 font-light">We sent a 6-digit code to {answers.leaderEmail}</p>
                  
                  <input
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, ''); 
                        if (val.length <= 6) setOtpValue(val);
                    }}
                    className="w-full bg-transparent border-b border-gray-600 text-4xl pb-4 focus:outline-none focus:border-white transition-colors font-mono tracking-widest text-center"
                    placeholder="000000"
                    autoFocus
                  />
                  
                  {errorMsg && <p className="text-red-400 mt-4 text-center">{errorMsg}</p>}

                  <div className="mt-8 flex justify-center gap-4">
                     <button
                        onClick={verifyOtp}
                        disabled={otpValue.length !== 6 || loading}
                        className="px-8 py-3 rounded-full bg-neon-blue text-black font-bold text-xl hover:bg-white hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,102,255,0.4)]"
                     >
                        {loading ? <Loader2 className="animate-spin" /> : "Verify Code"}
                     </button>
                  </div>
                  <div className="mt-4 text-center">
                      <button onClick={() => setShowOtpInput(false)} className="text-gray-500 hover:text-white text-sm">Wrong email?</button>
                  </div>
               </motion.div>
           )}
         </AnimatePresence>
      </main>

      {/* Nav Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-20">
         <button 
           onClick={handlePrev} 
           disabled={currentStep === 0 && !showOtpInput}
           className={`p-2 rounded bg-gray-900 hover:bg-gray-800 transition-colors ${currentStep === 0 && !showOtpInput ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
         >
           <ChevronUp size={24} />
         </button>
         <button 
           onClick={handleNext}
           disabled={currentQuestion.required && !answers[currentQuestion.id]}
           className={`p-2 rounded bg-neon-blue hover:bg-white hover:text-black transition-all text-black mt-1 opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto`}
         >
           <ChevronDown size={24} />
         </button>
      </div>
    </div>
  );
}

// Subcomponents matching original styles

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => (
  <div className={`min-h-screen w-full flex flex-col justify-center items-center ${THEME.bg} ${THEME.text} ${THEME.glow} relative text-center px-4`}>
     <div className="max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">IndiaNext <br /> 2026</h1>
        <p className="text-xl md:text-2xl text-gray-400 font-light mb-10">
          Join the Future Proof India Mission. <br/> 
          <span className="text-neon-orange">Choose Your Track.</span>
        </p>
        <button 
          onClick={onStart}
          className="px-8 py-3 rounded-full bg-white text-black font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          Begin Registration
        </button>
        <p className="mt-4 text-sm text-gray-500">🕒 Takes ~5 minutes</p>
     </div>
  </div>
);

const ThankYouScreen = () => (
   <div className={`min-h-screen w-full flex flex-col justify-center items-center ${THEME.bg} ${THEME.text} ${THEME.glow} relative text-center px-4`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl"
      >
         <h1 className="text-4xl md:text-5xl font-medium mb-6 text-green-500">Registration Complete.</h1>
         <p className="text-xl text-gray-400 font-light mb-4">Your application has been logged into the mainframe.</p>
         <p className="text-md text-gray-500 font-mono">Shortlist Announcement: 8th March 2026</p>
         <a href="/" className="mt-8 inline-block text-neon-blue hover:text-white underline transition-colors">Back to Mission Control</a>
      </motion.div>
   </div>
);

const InputRenderer = ({ question, value, onChange }: any) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
       if (inputRef.current) inputRef.current.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [question]);

  if (question.type === 'choice') {
    return (
      <div className="flex flex-col gap-3 max-w-lg">
        {question.options.map((opt: string, idx: number) => (
          <OptionButton 
            key={opt} 
            idx={idx} 
            opt={opt} 
            selected={value === opt} 
            onSelect={() => onChange(opt)} 
          />
        ))}
      </div>
    );
  }

  if (question.type === 'long-text') {
    return (
      <textarea
        ref={inputRef as any}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        className="w-full bg-transparent border-b border-gray-600 text-2xl md:text-3xl pb-2 focus:outline-none focus:border-white transition-colors placeholder-gray-600 resize-none h-40 font-light"
      />
    );
  }

  return (
    <input
      ref={inputRef as any}
      type={question.type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      className={`w-full bg-transparent border-b border-gray-600 text-2xl md:text-4xl pb-4 focus:outline-none focus:border-white transition-colors placeholder-gray-600 font-light
          ${question.type === 'tel' || question.type === 'number' ? 'font-mono' : ''}
      `}
    />
  );
};

const OptionButton = ({ opt, selected, onSelect }: any) => {
   // Use a random key or mapped key for better UX? A/B is fine.
   // Simplified logic for this specific form:
   let keyKey = "";
   if (opt.startsWith("A")) keyKey = "A";
   else if (opt.startsWith("B")) keyKey = "B";
   else keyKey = opt.charAt(0);
   
   return (
      <button
        onClick={onSelect}
        className={`text-left px-4 py-4 rounded border text-xl transition-all flex items-center gap-3 w-full
           ${selected ? 'bg-neon-orange/20 border-neon-orange text-white' : 'border-gray-700 hover:bg-gray-800 text-gray-300'}
        `}
      >
        <div className={`w-8 h-8 border rounded flex items-center justify-center text-sm font-bold transition-colors shrink-0
           ${selected ? 'bg-neon-orange border-neon-orange text-white' : 'border-gray-600 text-gray-500'}
        `}>
          {keyKey}
        </div>
        <span>{opt}</span>
        {selected && <Check size={20} className="ml-auto text-neon-orange shrink-0" />}
      </button>
   );
};
