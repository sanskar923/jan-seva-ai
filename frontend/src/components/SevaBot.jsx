import React, { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion"; 
import http from "../api/http.js";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";

export default function SevaBot() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [chat, setChat] = useState([]);
  const scrollRef = useRef(null);

  // --- NEW: QUICK ACTIONS FOR USER-FRIENDLINESS ---
  const quickActions = [
    { label: "🛣️ Road/Sadak", value: "I want to report a road issue" },
    { label: "⚡ Light/Bijli", value: "Bijli ki samasya hai" },
    { label: "💧 Water/Pani", value: "Water leakage issue" },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, busy]);

  useEffect(() => {
    // Advanced Welcome: Detects language and offers a warm human-like greeting
    const welcomeText = i18n.language === 'hi' 
      ? "Namaste! Main SevaBot hoon. Bhopal ki bijli, sadak ya pani ki samasya mein main aapki kya madad kar sakta hoon?" 
      : "Namaste! I am SevaBot. How can I help you with Bhopal's civic issues today?";
    
    setChat([{ role: "bot", text: welcomeText }]);
  }, [i18n.language]);

  const canSend = useMemo(() => message.trim().length > 0 && !busy, [message, busy]);

  async function send(payload = null) {
    const userText = payload || message.trim();
    if (!userText || busy) return;
    
    setMessage("");
    setChat((c) => [...c, { role: "user", text: userText }]);
    setBusy(true);

    try {
      const res = await http.post("/chatbot", { message: userText });
      setChat((c) => [...c, { role: "bot", text: res.data.reply }]);
    } catch {
      setChat((c) => [...c, { role: "bot", text: t("bot.unavailable") }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[min(92vw,380px)] mb-4"
          >
            <Card className="p-0 overflow-hidden shadow-2xl border-t-4 border-t-[#f9a61a]">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <div className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    SevaBot AI
                  </div>
                  <div className="text-[10px] font-bold text-[#f9a61a] uppercase tracking-widest">
                    AI-Powered Civic Guide
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setOpen(false)} className="px-3 rounded-xl text-[10px] font-black uppercase">
                  {t("bot.close")}
                </Button>
              </div>

              <div 
                ref={scrollRef}
                className="max-h-[350px] min-h-[300px] space-y-3 overflow-auto px-4 py-4 scroll-smooth bg-white dark:bg-slate-950"
              >
                {chat.map((m, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed ${
                      m.role === "user"
                        ? "ml-12 bg-[#141b2d] text-white rounded-br-none"
                        : "mr-12 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-bl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}

                {busy && (
                  <div className="mr-12 bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl w-fit flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#f9a61a] rounded-full animate-bounce [animation-duration:0.8s]" />
                    <div className="w-1.5 h-1.5 bg-[#f9a61a] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-[#f9a61a] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                  </div>
                )}
              </div>

              {/* --- NEW: QUICK ACTION CHIPS FOR ADVANCED UX --- */}
              <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-slate-100 dark:border-slate-800 bg-slate-50/30">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => send(action.value)}
                    disabled={busy}
                    className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-400 hover:border-[#f9a61a] hover:text-[#f9a61a] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask AI anything about Bhopal..."
                    className="rounded-xl border-slate-200"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send();
                    }}
                  />
                  <Button 
                    onClick={() => send()} 
                    disabled={!canSend}
                    className="bg-[#f9a61a] hover:bg-[#e89510] text-white rounded-xl px-5 transition-transform active:scale-95"
                  >
                    <span className="font-black text-xs uppercase tracking-tighter">Send</span>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            onClick={() => setOpen(true)} 
            className="shadow-xl bg-[#141b2d] text-white p-4 rounded-full h-14 w-14 flex items-center justify-center border-2 border-[#f9a61a]"
          >
             <span className="text-lg">🤖</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}