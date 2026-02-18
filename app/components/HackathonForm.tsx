
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

const QUESTIONS = [
  // --- SECTION 1: TRACK SELECTION ---
  {
    id: 'track',
    type: 'choice',
    question: "Choose Competition Track",
    subtext: "Select the track you wish to compete in.",
    options: [
      "IdeaSprint: Build MVP in 24 Hours",
      "BuildStorm: Solve Problem Statement in 24 Hours"
    ],
    required: true,
  },
  
  // --- MISSION BRIEFING --
  {
      id: 'buildBrief',
      type: 'info',
      question: "MISSION BRIEFING",
      subtext: "Review your objective before proceeding.",
      text: "PROBLEM STATEMENT:\n\nDisaster Response Coordination\n\nObjective: Build a real-time, offline-first system to connect flood victims with local rescue teams.",
      condition: (answers: any) => answers.track === "BuildStorm: Solve Problem Statement in 24 Hours",
  },

  // --- SECTION 3: TEAM DETAILS ---
  {
    id: 'teamName',
    type: 'text',
    question: "Team Name",
    placeholder: "e.g. Innovation Squad",
    required: true,
  },
  {
    id: 'teamSize',
    type: 'choice',
    question: "Team Size",
    options: ["Solo (1)", "2 Members", "3 Members", "4 Members"],
    required: true,
  },

  // --- SECTION 4: TEAM LEADER DETAILS ---
  {
    id: 'leaderName',
    type: 'text',
    question: "Team Leader Full Name",
    placeholder: "Your Full Name",
    required: true,
  },
  {
    id: 'leaderEmail',
    type: 'email',
    question: "Team Leader Email ID",
    placeholder: "leader@example.com",
    required: true,
    isEmail: true,
  },
  {
    id: 'leaderMobile',
    type: 'tel',
    question: "Team Leader Mobile Number",
    placeholder: "9876543210", 
    required: true,
  },
  {
    id: 'leaderCollege',
    type: 'text',
    question: "College / University Name",
    placeholder: "University Name",
    required: true,
  },
  {
    id: 'leaderDegree',
    type: 'text',
    question: "Degree / Course",
    placeholder: "e.g. B.Tech CSE",
    required: true,
  },
  
  // --- SECTION 5: TEAM MEMBER DETAILS ---
  // Member 2
  {
    id: 'member2Name',
    type: 'text',
    question: "Member 2 Full Name",
    placeholder: "Full Name",
    required: true,
    condition: (answers: any) => ["2 Members", "3 Members", "4 Members"].includes(answers.teamSize),
  },
  {
    id: 'member2Email',
    type: 'email',
    question: "Member 2 Email",
    placeholder: "Email Address",
    required: true,
    condition: (answers: any) => ["2 Members", "3 Members", "4 Members"].includes(answers.teamSize),
  },
  {
    id: 'member2CollegeSame',
    type: 'checkbox',
    question: "Member 2 College",
    options: ["Same as Leader"],
    required: false,
    condition: (answers: any) => ["2 Members", "3 Members", "4 Members"].includes(answers.teamSize),
  },
  {
    id: 'member2College',
    type: 'text',
    question: "Member 2 College Name",
    placeholder: "College Name",
    required: true,
    condition: (answers: any) => {
        const isMember = ["2 Members", "3 Members", "4 Members"].includes(answers.teamSize);
        const isSame = answers.member2CollegeSame && answers.member2CollegeSame.includes("Same as Leader");
        return isMember && !isSame;
    },
  },
  {
    id: 'member2Degree',
    type: 'text',
    question: "Member 2 Degree/Course",
    placeholder: "e.g. BTech CSE",
    required: true,
    condition: (answers: any) => ["2 Members", "3 Members", "4 Members"].includes(answers.teamSize),
  },

  // Member 3
  {
    id: 'member3Name',
    type: 'text',
    question: "Member 3 Full Name",
    placeholder: "Full Name",
    required: true,
    condition: (answers: any) => ["3 Members", "4 Members"].includes(answers.teamSize),
  },
  {
    id: 'member3Email',
    type: 'email',
    question: "Member 3 Email",
    placeholder: "Email Address",
    required: true,
    condition: (answers: any) => ["3 Members", "4 Members"].includes(answers.teamSize),
  },
  {
    id: 'member3CollegeSame',
    type: 'checkbox',
    question: "Member 3 College",
    options: ["Same as Leader"],
    required: false,
    condition: (answers: any) => ["3 Members", "4 Members"].includes(answers.teamSize),
  },
  {
    id: 'member3College',
    type: 'text',
    question: "Member 3 College Name",
    placeholder: "College Name",
    required: true,
    condition: (answers: any) => {
        const isMember = ["3 Members", "4 Members"].includes(answers.teamSize);
        const isSame = answers.member3CollegeSame && answers.member3CollegeSame.includes("Same as Leader");
        return isMember && !isSame;
    },
  },
  {
    id: 'member3Degree',
    type: 'text',
    question: "Member 3 Degree/Course",
    placeholder: "e.g. BTech CSE",
    required: true,
    condition: (answers: any) => ["3 Members", "4 Members"].includes(answers.teamSize),
  },

  // Member 4
  {
    id: 'member4Name',
    type: 'text',
    question: "Member 4 Full Name",
    placeholder: "Full Name",
    required: true,
    condition: (answers: any) => ["4 Members"].includes(answers.teamSize),
  },
  {
    id: 'member4Email',
    type: 'email',
    question: "Member 4 Email",
    placeholder: "Email Address",
    required: true,
    condition: (answers: any) => ["4 Members"].includes(answers.teamSize),
  },
  {
    id: 'member4CollegeSame',
    type: 'checkbox',
    question: "Member 4 College",
    options: ["Same as Leader"],
    required: false,
    condition: (answers: any) => ["4 Members"].includes(answers.teamSize),
  },
  {
    id: 'member4College',
    type: 'text',
    question: "Member 4 College Name",
    placeholder: "College Name",
    required: true,
    condition: (answers: any) => {
        const isMember = ["4 Members"].includes(answers.teamSize);
        const isSame = answers.member4CollegeSame && answers.member4CollegeSame.includes("Same as Leader");
        return isMember && !isSame;
    },
  },
  {
    id: 'member4Degree',
    type: 'text',
    question: "Member 4 Degree/Course",
    placeholder: "e.g. BTech CSE",
    required: true,
    condition: (answers: any) => ["4 Members"].includes(answers.teamSize),
  },

  // --- SECTION 6: SUBMISSION DETAILS (TRACK 1) ---
  {
    id: 'ideaTitle',
    type: 'text',
    question: "Idea Title",
    placeholder: "Title of your idea",
    required: true,
    condition: (answers: any) => answers.track === "IdeaSprint: Build MVP in 24 Hours",
  },
  {
    id: 'problemStatement',
    type: 'long-text',
    question: "Problem Statement",
    subtext: "Describe the problem clearly in 4–6 lines.",
    placeholder: "The problem we are solving is...",
    required: true,
    condition: (answers: any) => answers.track === "IdeaSprint: Build MVP in 24 Hours",
  },
  {
    id: 'proposedSolution',
    type: 'long-text',
    question: "Proposed Solution",
    subtext: "Explain your idea and approach.",
    placeholder: "Our solution is...",
    required: true,
    condition: (answers: any) => answers.track === "IdeaSprint: Build MVP in 24 Hours",
    noPaste: true,
    guidance: "Suggested Format:\n\n1. The Gap: What is missing today?\n2. The Solution: Your core value proposition.\n3. Implementation: How will you build it?\n4. Feasibility: Why is this possible now?",
  },
  {
    id: 'targetUsers',
    type: 'long-text',
    question: "Target Users / Beneficiaries",
    placeholder: "e.g. Students, Hospitals, Small Businesses",
    required: true,
    condition: (answers: any) => answers.track === "IdeaSprint: Build MVP in 24 Hours",
  },
  {
    id: 'expectedImpact',
    type: 'long-text',
    question: "Expected Impact",
    placeholder: "Social or economic impact...",
    required: true,
    condition: (answers: any) => answers.track === "IdeaSprint: Build MVP in 24 Hours",
  },
  {
    id: 'techStack',
    type: 'text',
    question: "Technology Stack (Recommended)",
    placeholder: "e.g. React, Python, AI/ML, Blockchain",
    required: false,
    condition: (answers: any) => answers.track === "IdeaSprint: Build MVP in 24 Hours",
  },
  {
    id: 'docLink',
    type: 'url',
    question: "Supporting Documents (Link)",
    subtext: "Upload Idea Deck (PDF), Prototype, or Research to Drive/Dropbox and paste public link here. (Max 10 slides)",
    placeholder: "https://drive.google.com/...",
    required: true,
    condition: (answers: any) => answers.track === "IdeaSprint: Build MVP in 24 Hours",
  },
  {
    id: 'ideaRules',
    type: 'checkbox',
    question: "IdeaSprint Rules Acceptance",
    subtext: "You must accept ALL rules to proceed.",
    options: [
      "I confirm that this idea is original and not copied.",
      "I agree that plagiarism will lead to disqualification.",
      "I agree that submission must be in PDF format (max 10 slides).",
      "I agree that pitch video must be max 3 minutes.",
      "I agree organizers may use idea name for promotion.",
      "I understand judges decision is final.",
      "I agree to maintain respectful communication."
    ],
    required: true,
    condition: (answers: any) => answers.track === "IdeaSprint: Build MVP in 24 Hours",
  },
  {
      id: 'ideaAdditionalNotes',
      type: 'long-text',
      question: "Additional Notes / Message",
      placeholder: "Any special requirements...",
      required: false,
      condition: (answers: any) => answers.track === "IdeaSprint: Build MVP in 24 Hours",
  },


  // --- SECTION 6: SUBMISSION DETAILS (TRACK 2) ---
  {
    id: 'problemDesc',
    type: 'long-text',
    question: "Problem Statement Description",
    subtext: "Describe how you plan to solve the given problem (without copy-paste).",
    placeholder: "Our approach...",
    required: true,
    condition: (answers: any) => answers.track === "BuildStorm: Solve Problem Statement in 24 Hours",
    noPaste: true,
    guidance: "PROBLEM STATEMENT:\nDisaster Response Coordination - Build a real-time, offline-first system to connect flood victims with local rescue teams.\n\nSuggested Response Pattern:\n\n1. Analysis: Breakdown of the specific problem statement.\n2. Technical Approach: Architecture & Stack choice.\n3. Innovation: What makes your fix unique?\n4. Execution Plan: 24-hour timeline strategy.",
  },
  {
    id: 'githubLink',
    type: 'url',
    question: "GitHub Team Repo Link",
    placeholder: "https://github.com/...",
    required: false,
    condition: (answers: any) => answers.track === "BuildStorm: Solve Problem Statement in 24 Hours",
  },
  {
    id: 'buildRules',
    type: 'checkbox',
    question: "BuildStorm Rules Acceptance",
    subtext: "You must accept ALL rules to proceed.",
    options: [
      "I agree MVP must be built during 24-hour hackathon.",
      "I agree reused pre-built projects lead to disqualification.",
      "I agree to submit GitHub repo link with full source code.",
      "I agree to submit deployed demo link before deadline.",
      "I agree plagiarism leads to disqualification.",
      "I agree to follow code of conduct.",
      "I agree organizers decision is final."
    ],
    required: true,
    condition: (answers: any) => answers.track === "BuildStorm: Solve Problem Statement in 24 Hours",
  },
    {
      id: 'buildAdditionalNotes',
      type: 'long-text',
      question: "Additional Notes / Special Requirements",
      placeholder: "Any special requirements...",
      required: false,
      condition: (answers: any) => answers.track === "BuildStorm: Solve Problem Statement in 24 Hours",
  },

  // --- COMMON FINAL SECTION ---
  {
    id: 'consent',
    type: 'checkbox',
    question: "Consent & Declaration",
    subtext: "You must accept all to submit.",
    options: [
      "I confirm all details submitted are correct.",
      "I agree to receive updates via Email/WhatsApp.",
      "I understand participation is subject to verification."
    ],
    required: true,
  },
  {
    id: 'hearAbout',
    type: 'choice',
    question: "How did you hear about INDIANEXT?",
    options: ["Instagram", "College Group", "Friend", "LinkedIn", "Website", "Other"],
    required: true,
  }
];

// Subcomponents

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-950 text-white relative overflow-hidden font-mono">
     {/* Grid Background */}
     <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

     <div className="z-10 text-center">
        <div className="inline-block border border-orange-500/50 bg-orange-500/10 px-3 py-1 mb-6 text-orange-400 text-xs tracking-[0.2em] uppercase">
            // Classified Access
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2 leading-none uppercase">
          India<span className="text-orange-500">Next</span>
        </h1>
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-12 tracking-widest uppercase">
           <span>IdeaSprint</span>
           <div className="w-1 h-1 bg-slate-500 rounded-full" />
           <span>BuildStorm</span>
        </div>
        
        <button 
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-10 py-3 font-bold text-white transition-all duration-200 bg-orange-600 font-mono tracking-widest border border-orange-500 hover:bg-orange-500 focus:outline-none ring-offset-2 focus:ring-2"
        >
           [ OPEN_DOSSIER ]
        </button>
     </div>
  </div>
);

const ThankYouScreen = ({ track }: { track: string }) => (
   <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-950 font-mono text-white p-4">
      <div className="w-full max-w-2xl border-2 border-green-500/50 bg-green-500/5 p-8 relative">
         <div className="absolute top-0 right-0 p-2 text-xs text-green-500 border-l border-b border-green-500/50">STATUS: APPROVED</div>
         <div className="text-green-400 text-6xl mb-6">
             <Check size={64} strokeWidth={1.5} />
         </div>
         <h1 className="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-tight">Transmission Received</h1>
         <p className="text-lg text-green-400/80 mb-8 leading-relaxed">
           Subject registered for protocol: <strong className="text-white">{track}</strong>.<br/>
           Directives have been forwarded to the designated communication channel (Email).
         </p>
         <a href="/" className="inline-block px-6 py-2 border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition-colors uppercase text-sm tracking-wider">
             [ Return to HQ ]
         </a>
      </div>
   </div>
);

const InputRenderer = ({ question, value, onChange, onCheckbox }: any) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
       if (inputRef.current) inputRef.current.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [question]);

  if (question.type === 'choice') {
    return (
      <div className="flex flex-col gap-2 max-w-lg w-full">
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

  if (question.type === 'checkbox') {
    const selected = value || [];
    return (
      <div className="flex flex-col gap-2 max-w-xl w-full">
        {question.options.map((opt: string, idx: number) => (
           <button
             key={idx}
             onClick={() => onCheckbox(opt)}
             className={`text-left px-4 py-3 border text-sm md:text-base font-mono transition-all flex items-start gap-4 w-full
                ${selected.includes(opt) 
                    ? 'bg-orange-500/10 border-orange-500 text-white' 
                    : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}
             `}
           >
             <div className={`mt-0.5 w-5 h-5 flex items-center justify-center shrink-0 border
                ${selected.includes(opt) ? 'bg-orange-500 border-orange-500 text-black' : 'border-slate-600'}
             `}>
               {selected.includes(opt) && <Check size={14} strokeWidth={3} />}
             </div>
             <span className="leading-snug">{opt}</span>
           </button>
        ))}
      </div>
    );
  }

  if (question.type === 'long-text') {
    return (
      <div className="flex flex-col md:flex-row gap-6 w-full">
         <textarea
            ref={inputRef as any}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onPaste={(e) => {
                if (question.noPaste) {
                    e.preventDefault();
                    // Optional: Toast or simple alert
                    alert("Pasting is disabled for this section. Please type your response.");
                }
            }}
            placeholder={question.placeholder ? question.placeholder.toUpperCase() : ''}
            className="flex-1 bg-slate-900/50 border border-slate-700 p-4 text-xl font-mono text-white placeholder-slate-700 focus:outline-none focus:border-orange-500 transition-all resize-none h-48 md:h-64 tracking-tight leading-relaxed"
         />
         
         {/* Guidance Panel */}
         {question.guidance && (
             <div className="md:w-64 shrink-0 bg-slate-900 border border-slate-800 p-4 rounded text-sm text-slate-400 font-mono hidden md:block">
                 <div className="text-orange-500 font-bold mb-2 uppercase tracking-wider text-xs border-b border-orange-500/20 pb-1">
                     RESPONSE PATTERN
                 </div>
                 <div className="whitespace-pre-wrap leading-relaxed text-xs">
                     {question.guidance}
                 </div>
                 {question.noPaste && (
                     <div className="mt-4 text-xs text-red-500 border border-red-900/50 bg-red-900/10 p-2 text-center uppercase tracking-widest font-bold">
                         [ NO PASTE ALLOWED ]
                     </div>
                 )}
             </div>
         )}
      </div>
    );
  }

  if (question.type === 'tel') {
    return (
      <div className="flex items-center gap-4 border-b-2 border-slate-700 py-2 focus-within:border-orange-500 transition-all">
         <div className="flex items-center gap-2 select-none opacity-80">
            <span className="text-xl">🇮🇳</span>
            <span className="text-xl md:text-2xl text-slate-400 font-mono">+91</span>
         </div>
         <input
            ref={inputRef as any}
            type="tel"
            value={value || ''}
            maxLength={10}
            onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                onChange(val);
            }}
            placeholder="9876543210"
            className="w-full bg-transparent focus:outline-none text-xl md:text-3xl text-orange-400 font-mono tracking-[0.2em] placeholder-slate-800"
         />
      </div>
    );
  }

  if (question.type === 'info') {
      return (
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 p-6 rounded relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/50" />
              <div className="flex items-center gap-2 text-orange-400 font-bold mb-4 uppercase tracking-widest text-xs">
                  <span className="w-2 h-2 bg-orange-500 animate-pulse rounded-full" />
                  Classified Intelligence
              </div>
              <div className="text-xl md:text-2xl font-mono text-white leading-relaxed whitespace-pre-wrap">
                  {question.text}
              </div>
          </div>
      );
  }

  return (
    <input
      ref={inputRef as any}
      type={question.type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder ? question.placeholder.toUpperCase() : ''}
      className={`w-full bg-transparent border-b-2 border-slate-700 text-xl md:text-2xl py-2 focus:outline-none focus:border-orange-500 transition-colors placeholder-slate-800 font-mono text-orange-400 tracking-wide
      `}
    />
  );
};

const OptionButton = ({ opt, selected, onSelect }: any) => {
   return (
      <button
        onClick={onSelect}
        className={`text-left px-4 py-3 border flex items-center gap-4 w-full transition-all
           ${selected 
             ? 'bg-orange-500 border-orange-500 text-black' 
             : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}
        `}
      >
        <div className={`w-4 h-4 border flex items-center justify-center shrink-0
           ${selected ? 'border-black bg-black' : 'border-slate-600'}
        `}>
          {selected && <div className="w-2 h-2 bg-orange-500" />}
        </div>
        <span className="font-mono text-sm uppercase tracking-wider">{opt}</span>
      </button>
   );
};

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

  // ✅ NEW: Generate idempotency key once per form session
  const [idempotencyKey] = useState(() => {
    // Use crypto.randomUUID() if available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  });

  const totalSteps = QUESTIONS.length;
  // Progress is separate from "Folder" but we can integrate it.

  const currentQuestion = QUESTIONS[currentStep];

  const handleStart = () => setStarted(true);

  // Logic Helpers
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

  const sendOtp = React.useCallback(async () => {
      setLoading(true);
      setErrorMsg("");
      if (answers.leaderEmail === "demo@indianext.in") {
          setTimeout(() => { setShowOtpInput(true); setLoading(false); alert("CODE: 123456"); }, 1000);
          return;
      }
      try {
          const res = await fetch('/api/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: answers.leaderEmail,
                purpose: 'REGISTRATION' // ✅ NEW: Include purpose
              }),
          });
          const response = await res.json();
          
          // ✅ NEW: Handle structured response
          if (!response.success) {
            setErrorMsg(response.message);
            setLoading(false);
            return;
          }
          
          // ✅ NEW: Show debug OTP in development
          if (response.debugOtp) {
            console.log('Debug OTP:', response.debugOtp);
            alert(`Development Mode - OTP: ${response.debugOtp}`);
          }
          
          setShowOtpInput(true);
      } catch (err: any) {
          setErrorMsg(err.message || 'Network error. Please try again.');
      } finally {
          setLoading(false);
      }
  }, [answers.leaderEmail]);

  const submitForm = React.useCallback(async () => {
      setLoading(true);

      // DEMO MODE BYPASS
      if (answers.leaderEmail === "demo@indianext.in") {
          setTimeout(() => { setIsCompleted(true); setLoading(false); }, 1500); 
          return;
      }
      
      try {
          // Flatten College Logic
          const finalAnswers = { ...answers };
          if (finalAnswers.member2CollegeSame && finalAnswers.member2CollegeSame.includes("Same as Leader")) finalAnswers.member2College = finalAnswers.leaderCollege;
          if (finalAnswers.member3CollegeSame && finalAnswers.member3CollegeSame.includes("Same as Leader")) finalAnswers.member3College = finalAnswers.leaderCollege;
          if (finalAnswers.member4CollegeSame && finalAnswers.member4CollegeSame.includes("Same as Leader")) finalAnswers.member4College = finalAnswers.leaderCollege;

          if (finalAnswers.track === "IdeaSprint: Build MVP in 24 Hours") finalAnswers.additionalNotes = finalAnswers.ideaAdditionalNotes;
          if (finalAnswers.track === "BuildStorm: Solve Problem Statement in 24 Hours") finalAnswers.additionalNotes = finalAnswers.buildAdditionalNotes;

          // ✅ NEW: Get session token
          const sessionToken = localStorage.getItem('session_token');

          const res = await fetch('/api/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // ✅ NEW: Include authorization header
                ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
              },
              body: JSON.stringify({
                // ✅ NEW: Include idempotency key
                idempotencyKey,
                ...finalAnswers,
              }),
          });
          
          const response = await res.json();
          
          // ✅ NEW: Handle structured response
          if (!response.success) {
            setErrorMsg(response.message);
            setLoading(false);
            return;
          }
          
          // ✅ NEW: Log success data
          console.log('Registration successful:', response.data);
          setIsCompleted(true);
      } catch (err: any) {
          setErrorMsg(err.message || 'Network error. Please try again.');
      } finally {
          setLoading(false);
      }
  }, [answers, idempotencyKey, setIsCompleted]);

  const handleNext = React.useCallback(async () => {
    // --- VALIDATIONS ---
    const q = currentQuestion;
    const ans = answers[q.id];

    // 1. Required Field Check
    if (q.required) {
        if (!ans) {
            setErrorMsg("Field Required.");
            return;
        }
        if (Array.isArray(ans) && ans.length === 0) {
            setErrorMsg("Field Required.");
            return;
        }
    }

    // 2. Checkbox: Accept ALL
    if (q.type === 'checkbox' && q.required) {
        if (q.options && Array.isArray(ans) && ans.length !== q.options.length) {
            setErrorMsg("Must accept all conditions.");
            return;
        }
    }

    // 3. Phone Validation regex
    if (q.type === 'tel') {
        if (!/^[0-9]{10}$/.test(ans)) {
            setErrorMsg("Invalid Format: 10 Digits Required.");
            return;
        }
    }

    // 4. Email format check
    if (q.type === 'email' || q.id.includes('Email')) {
        if (!ans.includes('@') || !ans.includes('.')) {
             setErrorMsg("Invalid Email Format.");
             return;
        }
    }

    // OTP Logic
    if (currentQuestion.id === 'leaderEmail' && !emailVerified) {
        await sendOtp();
        return;
    }

    const nextStep = getNextValidStep(currentStep, 1, answers);
    
    if (nextStep < totalSteps) {
      setDirection(1);
      setCurrentStep(nextStep);
      setErrorMsg(""); 
    } else {
      await submitForm();
    }
  }, [currentQuestion, answers, emailVerified, currentStep, totalSteps, sendOtp, submitForm]);

  const verifyOtp = React.useCallback(async () => {
      setLoading(true);
      setErrorMsg("");
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
           } else { setErrorMsg("INVALID CODE"); setLoading(false); return; }
      }
      try {
          const res = await fetch('/api/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: answers.leaderEmail, 
                otp: otpValue,
                purpose: 'REGISTRATION' // ✅ NEW: Include purpose
              }),
          });
          
          const response = await res.json();
          
          // ✅ NEW: Handle structured response
          if (!response.success) {
            setErrorMsg(response.message);
            setLoading(false);
            return;
          }
          
          // ✅ NEW: Store session token
          if (response.data?.session) {
            localStorage.setItem('session_token', response.data.session.token);
            localStorage.setItem('session_expires', response.data.session.expiresAt);
            localStorage.setItem('user_email', response.data.user.email);
            console.log('Session token stored:', response.data.session.token.substring(0, 10) + '...');
          }
          
          setEmailVerified(true);
          setShowOtpInput(false);
          setTimeout(() => {
             const nextStep = getNextValidStep(currentStep, 1, answers);
             setDirection(1);
             setCurrentStep(nextStep);
          }, 500);
      } catch (err: any) {
          setErrorMsg(err.message || 'Network error. Please try again.');
      } finally {
          setLoading(false);
      }
  }, [answers.leaderEmail, otpValue, currentStep, answers]);

  const handlePrev = () => {
    if (showOtpInput) { setShowOtpInput(false); return; }
    const prevStep = getNextValidStep(currentStep, -1, answers);
    if (prevStep >= 0) { setDirection(-1); setCurrentStep(prevStep); setErrorMsg(""); }
  };
  const handleAnswer = (value: any) => { setAnswers((prev: any) => ({ ...prev, [QUESTIONS[currentStep].id]: value })); setErrorMsg(""); };
  const handleCheckbox = (option: string) => {
     const currentVals = answers[currentQuestion.id] || [];
     let newVals;
     if (currentVals.includes(option)) newVals = currentVals.filter((v: string) => v !== option);
     else newVals = [...currentVals, option];
     handleAnswer(newVals);
  };

  // Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && started && !isCompleted && !loading) {
        if (showOtpInput) { if (otpValue.length === 6) verifyOtp(); return; }
        if (currentQuestion.type !== 'long-text' && currentQuestion.type !== 'checkbox' && !e.metaKey && !e.ctrlKey) { 
           e.preventDefault();
           if (currentQuestion.required && !answers[currentQuestion.id]) return;
           handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, isCompleted, currentStep, answers, currentQuestion, showOtpInput, otpValue, loading, handleNext, verifyOtp]);


  if (!started) return <WelcomeScreen onStart={handleStart} />;
  if (isCompleted) return <ThankYouScreen track={answers.track} />;

  // FOLDER THEME UI
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-900 text-slate-100 font-mono p-4">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Main Folder Container */}
      <div className="w-full max-w-6xl relative z-10 flex flex-col">
          
          {/* Tabs */}
          <div className="flex pl-8">
              <div className="bg-slate-800 text-orange-500 text-xs font-bold px-6 py-2 rounded-t-lg border-t border-l border-r border-slate-700 tracking-widest uppercase flex items-center gap-2">
                 <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                 Registration Protocol
              </div>
              <div className="bg-slate-900/50 text-slate-600 text-xs font-bold px-6 py-2 rounded-t-lg border-t border-r border-slate-800 tracking-widest uppercase ml-[-1px] z-[-1]">
                 Classified // V.2.0
              </div>
          </div>

          {/* Folder Body */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-b-lg rounded-tr-lg p-1 shadow-2xl relative min-h-[500px] md:min-h-[600px] flex flex-col">
              {/* Inner 'Paper' or Interface */}
              <div className="bg-slate-900 flex-1 rounded border border-slate-700/50 p-6 md:p-12 relative overflow-hidden flex flex-col">
                 
                 {/* Decor elements */}
                 <div className="absolute top-4 right-4 text-[10px] text-slate-600 font-mono tracking-widest">
                     DOC_ID: {Math.floor(Date.now() / 1000)}
                 </div>
                 <div className="absolute bottom-4 left-4 text-[10px] text-slate-600 font-mono tracking-widest">
                      SECURE CONNECTION ESTABLISHED
                 </div>

                 <AnimatePresence mode="wait" custom={direction}>
                    {!showOtpInput ? (
                       <motion.div
                         key={currentStep}
                         custom={direction}
                         initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                         transition={{ duration: 0.2 }}
                         className="flex-1 flex flex-col justify-center"
                       >
                           <div className="flex items-center gap-2 mb-6">
                               <span className="text-orange-500 font-bold text-sm bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                   STEP {currentStep + 1} / {totalSteps}
                               </span>
                               {currentQuestion.required && <span className="text-red-500 text-xs uppercase tracking-wider">* Mandatory</span>}
                           </div>

                           <h2 className="text-2xl md:text-4xl font-bold mb-2 uppercase tracking-tight text-slate-100">
                               {currentQuestion.question}
                           </h2>
                           
                           {currentQuestion.subtext && (
                               <p className="text-slate-400 text-sm md:text-base mb-8 border-l-2 border-slate-700 pl-4 py-1 italic">
                                   {currentQuestion.subtext}
                               </p>
                           )}

                           <div className="mt-4 mb-8">
                               <InputRenderer 
                                    question={currentQuestion} 
                                    value={answers[currentQuestion.id]} 
                                    onChange={handleAnswer} 
                                    onCheckbox={handleCheckbox}
                               />
                           </div>
                           
                           {errorMsg && (
                               <div className="bg-red-900/20 border-l-2 border-red-500 text-red-400 p-3 mb-6 text-sm font-bold flex items-center gap-2">
                                   <span>[ERROR]</span> {errorMsg}
                               </div>
                           )}

                           <div className="mt-auto flex items-center gap-4">
                               <button 
                                  onClick={handleNext}
                                  className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold uppercase tracking-widest px-8 py-3 clip-path-polygon disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  disabled={loading}
                               >
                                  {loading ? "PROCESSING..." : "CONFIRM DATA >>"}
                               </button>
                               {currentStep > 0 && (
                                   <button onClick={handlePrev} className="text-slate-500 hover:text-slate-300 text-sm uppercase tracking-wider">
                                       [ BACK ]
                                   </button>
                               )}
                           </div>
                       </motion.div>
                    ) : (
                       <motion.div
                          key="otp"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex-1 flex flex-col justify-center items-center text-center"
                       >
                           <div className="w-16 h-16 border-2 border-orange-500 rounded-full flex items-center justify-center mb-6 animate-pulse text-orange-500">
                               <div className="w-2 h-2 bg-orange-500 rounded-full" />
                           </div>
                           <h2 className="text-2xl font-bold uppercase tracking-widest mb-2">Identity Verification</h2>
                           <p className="text-slate-400 text-sm mb-8">TRANSMITTED KEY TO: {answers.leaderEmail}</p>

                           <input
                            type="text"
                            maxLength={6}
                            value={otpValue}
                            onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g,''); if(v.length<=6) setOtpValue(v); }}
                            className="bg-slate-950 border-b-2 border-orange-500 w-48 text-center text-3xl tracking-[0.5em] font-mono text-white p-2 focus:outline-none mb-6"
                            placeholder="______"
                           />
                           
                           {errorMsg && <p className="text-red-500 text-xs font-bold mb-4">{errorMsg}</p>}

                           <button 
                                onClick={verifyOtp} 
                                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-2 text-sm uppercase tracking-widest disabled:opacity-50"
                                disabled={otpValue.length !== 6 || loading}
                           >
                               {loading ? "VERIFYING..." : "AUTHENTICATE"}
                           </button>
                       </motion.div>
                    )}
                 </AnimatePresence>

              </div>
          </div>
      </div>
    </div>
  );
}
