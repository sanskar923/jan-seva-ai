import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // Added AnimatePresence for smooth OTP field entry
import { useAuth } from "../state/AuthContext.jsx";
import http from "../api/http.js"; // Import your http instance

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // --- NEW FEATURE STATES ---
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // --- REARRANGED HANDLER FOR TWO-STEP LOGIN ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBusy) return;

    if (!showOtpField) {
      // STEP 1: Send the Real OTP
      setIsBusy(true);
      try {
        await http.post("/send-otp", { email }); // Calls the route we rearranged in service.js
        setShowOtpField(true);
      } catch (err) {
        alert("Failed to send OTP. Please check your email and try again.");
      } finally {
        setIsBusy(false);
      }
    } else {
      // STEP 2: Verify OTP and Login
      setIsBusy(true);
      try {
        // First verify the OTP
        const res = await http.post("/verify-otp", { email, otp });
        if (res.data.success) {
          // If OTP is correct, proceed with your existing login logic
          const success = await login(username, password);
          if (success) navigate("/dashboard");
        }
      } catch (err) {
        alert("Invalid OTP code. Please try again.");
      } finally {
        setIsBusy(false);
      }
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-[#fdfaf3] px-4 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(249,166,26,0.05),_transparent_70%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[500px] bg-white border border-slate-100 rounded-[32px] p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]"
      >
        <div className="text-center mb-10">
          <h1 className="text-[42px] font-black tracking-tighter leading-tight text-[#141b2d] mb-2">
            Welcome <span className="text-[#f9a61a]">back</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
            Jan Seva AI Login
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#f9a61a]/30 focus:bg-white rounded-[20px] outline-none transition-all font-bold text-[#141b2d] placeholder:text-slate-300"
              placeholder="Enter your username"
              required
              disabled={showOtpField} // Lock after OTP is sent
            />
          </div>

          {/* --- NEW: EMAIL SECTION --- */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#f9a61a]/30 focus:bg-white rounded-[20px] outline-none transition-all font-bold text-[#141b2d] placeholder:text-slate-300"
              placeholder="verified@email.com"
              required
              disabled={showOtpField}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#f9a61a]/30 focus:bg-white rounded-[20px] outline-none transition-all font-bold text-[#141b2d] placeholder:text-slate-300"
              placeholder="••••••••"
              required
              disabled={showOtpField}
            />
          </div>

          {/* --- NEW: CONDITIONAL OTP INPUT --- */}
          <AnimatePresence>
            {showOtpField && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-black uppercase tracking-widest text-[#f9a61a] mb-2 ml-1">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-6 py-4 bg-orange-50 border-2 border-[#f9a61a]/30 focus:border-[#f9a61a] focus:bg-white rounded-[20px] outline-none transition-all font-black text-center text-2xl tracking-[10px] text-[#141b2d]"
                  placeholder="000000"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isBusy}
            className={`w-full py-5 text-white text-lg font-black rounded-[22px] transition-all hover:-translate-y-1 active:translate-y-0 ${
              isBusy ? 'bg-slate-400' : 'bg-[#f9a61a] shadow-[0_15px_30px_-5px_rgba(249,166,26,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(249,166,26,0.6)]'
            }`}
          >
            {isBusy ? "Processing..." : showOtpField ? "Verify & Login" : "Send OTP to Continue"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-500 font-medium">
            New citizen?{" "}
            <Link to="/signup" className="text-[#f9a61a] font-black hover:underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
        
        <div className="mt-8 p-4 bg-slate-50 rounded-[15px] border border-slate-100">
          <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider">
            Admin hint: Use admin / admin123 for the workspace
          </p>
        </div>
      </motion.div>
    </div>
  );
}