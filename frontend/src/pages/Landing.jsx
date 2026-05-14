import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen bg-[#fdfaf3] text-[#141b2d] flex flex-col items-center justify-center px-4 overflow-hidden font-sans">
      
      {/* Subtle background glow to match the screenshot's soft feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-[#f9a61a]/10 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        
        {/* Top Badge - Specific to Jan Seva AI */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-block px-4 py-1.5 bg-[#f9a61a]/10 border border-[#f9a61a]/20 rounded-full text-[#f9a61a] text-sm font-bold tracking-wide"
        >
          JAN SEVA AI • MULTIMODAL SMART GRIEVANCE SYSTEM
        </motion.div>

        {/* The Bold Headline from your screenshot */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[56px] md:text-[90px] lg:text-[110px] leading-[0.9] font-black tracking-tighter mb-8"
        >
          Governance, <br />
          <span className="text-[#f9a61a]">Accelerated by AI.</span>
        </motion.h1>

        {/* Sub-headline adapted for your project */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto text-lg md:text-2xl text-slate-500 font-medium leading-relaxed mb-12 px-4"
        >
          Eliminate bureaucracy with a single click. Submit grievances via text, 
          voice, or photo. Access real-time tracking and rapid resolution 
          through India's smartest public service gateway.
        </motion.p>

        {/* Bold Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link to="/login">
            <button className="group relative flex items-center gap-3 px-12 py-5 bg-[#f9a61a] text-white text-xl font-black rounded-[22px] shadow-[0_20px_40px_-10px_rgba(249,166,26,0.5)] hover:shadow-[0_25px_50px_-10px_rgba(249,166,26,0.6)] transition-all hover:-translate-y-1.5 active:translate-y-0">
              Start Discovery
              <span className="text-3xl transition-transform group-hover:translate-x-2">→</span>
            </button>
          </Link>

          <Link to="/signup">
            <button className="px-12 py-5 bg-white border-2 border-slate-100 text-[#f9a61a] text-xl font-black rounded-[22px] shadow-sm hover:bg-slate-50 transition-all hover:-translate-y-1">
              Create Account
            </button>
          </Link>
        </motion.div>

        {/* Feature Tags - Highlights your project capabilities */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 flex flex-wrap justify-center gap-8 text-slate-400 font-bold uppercase tracking-[0.2em] text-xs"
        >
          <span className="flex items-center gap-2">● AI Vision Detection</span>
          <span className="flex items-center gap-2">● Multilingual Support</span>
          <span className="flex items-center gap-2">● Automated Classification</span>
        </motion.div>

      </div>
    </div>
  );
}