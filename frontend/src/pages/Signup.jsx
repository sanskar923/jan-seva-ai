import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../state/AuthContext.jsx";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await signup(username, password);
    if (success) navigate("/dashboard");
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-[#fdfaf3] px-4 font-sans">
      
      {/* Soft background glow to match the theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(249,166,26,0.05),_transparent_70%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[520px] bg-white border border-slate-100 rounded-[32px] p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]"
      >
        <div className="text-center mb-10">
          <h1 className="text-[42px] font-black tracking-tighter leading-tight text-[#141b2d] mb-3">
            Create your <span className="text-[#f9a61a]">profile</span>
          </h1>
          <p className="max-w-[280px] mx-auto text-slate-400 font-bold text-[11px] uppercase tracking-[0.15em] leading-relaxed">
            JWTs are issued instantly — no external auth vendor required for the demo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1 transition-colors group-focus-within:text-[#f9a61a]">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#f9a61a]/30 focus:bg-white rounded-[20px] outline-none transition-all font-bold text-[#141b2d] placeholder:text-slate-300"
              placeholder="Pick a unique username"
              required
            />
          </div>

          <div className="group">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1 transition-colors group-focus-within:text-[#f9a61a]">
              Password (min 4 chars)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#f9a61a]/30 focus:bg-white rounded-[20px] outline-none transition-all font-bold text-[#141b2d] placeholder:text-slate-300"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-[#141b2d] text-white text-lg font-black rounded-[22px] shadow-xl hover:bg-slate-800 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            Create account
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-500 font-medium">
            Already registered?{" "}
            <Link to="/login" className="text-[#f9a61a] font-black hover:underline underline-offset-4">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}