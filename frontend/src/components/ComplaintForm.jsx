import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import http from "../api/http.js";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Textarea from "../ui/Textarea.jsx";
import Input from "../ui/Input.jsx";
import { useToast } from "../state/ToastContext.jsx";
import { speechRecognitionLang } from "../lib/speechLocale.js";

function getSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR ? new SR() : null;
}

export default function ComplaintForm({ onSubmitted, initialLocation }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  
  // Existing States
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const recRef = useRef(null);

  // NEW: Live Vision & Geolocation States
  const videoRef = useRef(null);
  const [isLive, setIsLive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(initialLocation);

  // NEW: Citizen Profile States
  const [fullname, setFullname] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employmentType, setEmploymentType] = useState("Private Sector");

  // Logic: Updated to rely solely on isLive for Image reports
  const canSubmitText = useMemo(() => 
    text.trim().length > 0 && fullname.trim().length > 0 && !busy, 
    [text, fullname, busy]
  );
  
  const canSubmitImage = useMemo(() => 
    isLive && fullname.trim().length > 0 && !busy, 
    [isLive, fullname, busy]
  );

  const speechSupported = useMemo(() => Boolean(getSpeechRecognition()), []);

  // LIVE GEOLOCATION: Continuous tracking
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation({
          address: `📍 Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)} (Bhopal)`,
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        });
      },
      (err) => console.error("Location tracking error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // LIVE VISION: Toggle Camera
  const toggleLiveVision = async () => {
    if (isLive) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      setIsLive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" }, 
          audio: false 
        });
        videoRef.current.srcObject = stream;
        setIsLive(true);
      } catch (err) {
        toast.error("Camera access denied");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recRef.current) {
        try { recRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  async function submitText() {
    if (!canSubmitText) return;
    setBusy(true);
    try {
      await http.post("/complaints/text", { 
        text, 
        fullname, 
        occupation, 
        employmentType,
        location: currentLocation?.address || "Bhopal, MP"
      });
      setText("");
      setFullname("");
      setOccupation("");
      toast.success(t("complaint.textSuccess"));
      onSubmitted?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || t("complaint.textError"));
    } finally {
      setBusy(false);
    }
  }

  async function submitImage() {
    if (!canSubmitImage) return;
    setBusy(true);
    try {
      const fd = new FormData();
      
      // Captured strictly from Live Vision
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg"));
      fd.append("image", blob, "live_capture.jpg");

      fd.append("fullname", fullname);
      fd.append("occupation", occupation);
      fd.append("employmentType", employmentType);
      fd.append("location", currentLocation?.address || "Bhopal, MP");
      fd.append("caption", caption || "Image Report");
      
      await http.post("/complaints/image", fd, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });

      if (isLive) toggleLiveVision();
      setCaption("");
      setFullname("");
      setOccupation("");
      setImageAnalysis(null);
      toast.success(t("complaint.imageSuccess"));
      onSubmitted?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || t("complaint.imageError"));
    } finally {
      setBusy(false);
    }
  }

  function startVoice() {
    const rec = getSpeechRecognition();
    if (!rec) {
      toast.info(t("complaint.voiceBrowserUnsupported"));
      return;
    }
    recRef.current = rec;
    rec.lang = speechRecognitionLang(i18n.language);
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    setListening(true);

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += `${transcript} `;
        else interim += transcript;
      }
      setText(`${finalText}${interim}`.trim());
    };
    rec.onerror = () => {
      setListening(false);
      toast.error(t("complaint.voiceFailed"));
    };
    rec.onend = () => { setListening(false); };
    try { rec.start(); } catch { setListening(false); }
  }

  function stopVoice() {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }

  return (
    <Card glass className="p-8 border-t-4 border-t-[#f9a61a]">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t("complaint.title")}
          </div>
          <div className="text-[10px] text-[#f9a61a] font-black uppercase tracking-[0.2em]">
            Governance, Accelerated by AI
          </div>
        </div>
        <div className="flex items-center gap-2">
          {speechSupported && (
            <Button 
              variant={listening ? "danger" : "secondary"} 
              onClick={listening ? stopVoice : startVoice}
              className="rounded-xl px-4 py-2 text-xs font-bold"
            >
              {listening ? "🛑 Stop Listening" : "🎤 Voice Input"}
            </Button>
          )}
        </div>
      </div>

      {/* --- LIVE LOCATION OVERLAY --- */}
      <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800">
        <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
          {currentLocation?.address || "Detecting live position..."}
        </span>
      </div>

      {/* --- STEP 1: CITIZEN IDENTIFICATION --- */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[24px] mb-8 border border-slate-100 dark:border-slate-800">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
          Step 1: Citizen Identification
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            placeholder="Type your name to enable submission"
          />
          <Input
            label="Occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="e.g. Farmer, Teacher"
          />
          <div className="md:col-span-2">
            <label className="block mb-1 text-[10px] font-black uppercase text-slate-500">
              Employment Category
            </label>
            <select 
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold dark:border-slate-800 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-[#f9a61a]/20 transition-all"
            >
              <option value="Farmer">Farmer (Kisan)</option>
              <option value="Govt Job">Government Employee</option>
              <option value="Private Sector">Private Sector</option>
              <option value="Student">Student</option>
              <option value="Self-Employed">Self-Employed / Business</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- STEP 2: REPORT DETAILS --- */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Step 2: Text / Voice Report
          </h4>
          <Textarea
            label={t("complaint.textLabel")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe the issue in Bhopal..."
            className="h-40"
          />
          <Button 
            onClick={submitText} 
            disabled={!canSubmitText} 
            className={`w-full py-4 font-black uppercase tracking-widest transition-all ${
              canSubmitText ? 'bg-[#141b2d] text-white shadow-lg shadow-slate-900/20 hover:-translate-y-1' : 'bg-slate-300 cursor-not-allowed opacity-50'
            }`}
          >
            {busy ? "Processing..." : t("complaint.submitText")}
          </Button>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Step 2: AI Vision Report
          </h4>
          
          <div className="relative overflow-hidden rounded-[24px] bg-black aspect-video mb-2">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover ${isLive ? 'opacity-100' : 'opacity-0'}`} 
            />
            {!isLive && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-bold">
                Camera Standby
              </div>
            )}
          </div>

          <Button 
            onClick={toggleLiveVision} 
            variant="secondary"
            className="w-full text-[10px] font-black uppercase"
          >
            {isLive ? "🛑 Stop Live Vision" : "🎥 Start Live AI Vision"}
          </Button>

          <Input
            label="Image Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What are we looking at?"
          />

          <AnimatePresence>
            {analyzingImage && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                AI Vision Analyzing...
              </motion.div>
            )}
          </AnimatePresence>

          {imageAnalysis && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-700 uppercase">AI Detected: {imageAnalysis.category}</span>
              <span className="bg-emerald-700 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                {Math.round(imageAnalysis.confidence * 100)}% Match
              </span>
            </div>
          )}

          <Button 
            onClick={submitImage} 
            disabled={!canSubmitImage} 
            className={`w-full py-4 font-black uppercase tracking-widest transition-all ${
              canSubmitImage ? 'bg-[#f9a61a] text-white shadow-lg shadow-orange-500/20 hover:-translate-y-1' : 'bg-slate-300 cursor-not-allowed opacity-50'
            }`}
          >
            {busy ? "Uploading..." : t("complaint.submitImage")}
          </Button>
        </div>
      </div>
    </Card>
  );
}