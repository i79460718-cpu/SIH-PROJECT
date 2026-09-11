import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const languages = [
  ["en-IN", "English (India)"], ["hi-IN", "Hindi / हिन्दी"], ["bn-IN", "Bengali / বাংলা"],
  ["ta-IN", "Tamil / தமிழ்"], ["te-IN", "Telugu / తెలుగు"], ["mr-IN", "Marathi / मराठी"],
  ["gu-IN", "Gujarati / ગુજરાતી"], ["kn-IN", "Kannada / ಕನ್ನಡ"], ["ml-IN", "Malayalam / മലയാളം"],
  ["pa-IN", "Punjabi / ਪੰਜਾਬੀ"], ["ur-IN", "Urdu / اردو"],
];
interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null; onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } }) => void) | null;
  start(): void; stop(): void; abort(): void;
}
export function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { lang } = useLanguage();
  const [language, setLanguage] = useState(() => {
    try { const saved = localStorage.getItem("jansamvad.voice.language"); if (languages.some(([code]) => code === saved)) return saved!; } catch { /* optional preference */ }
    return lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : "en-IN";
  });
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const transcriptCallback = useRef(onTranscript);
  transcriptCallback.current = onTranscript;
  useEffect(() => () => {
    if (recognition.current) {
      const current = recognition.current;
      current.onstart = current.onend = current.onerror = current.onresult = null;
      current.abort();
    }
  }, []);
  function toggle() {
    if (recognition.current) { recognition.current.stop(); return; }
    setError("");
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { setError("Voice input is unavailable in this browser. You can type your report instead."); return; }
    const current = new Constructor();
    current.lang = language;
    current.continuous = false;
    current.interimResults = false;
    current.onstart = () => setListening(true);
    current.onend = () => { recognition.current = null; setListening(false); };
    current.onerror = ({ error: code }) => {
      setListening(false);
      const messages: Record<string, string> = { "not-allowed": "Microphone permission was denied. Allow microphone access or type your report.", "audio-capture": "No microphone is available. Connect one or type your report.", "network": "The speech service could not connect. Check your connection and try again.", "no-speech": "No speech was detected. Try again when you are ready.", "language-not-supported": "The selected language is not supported by this browser's speech service. Choose another language or type your report." };
      if (code !== "aborted") setError(messages[code] || "Voice input stopped. Try again or type your report.");
      current.abort();
      recognition.current = null;
    };
    current.onresult = event => {
      const parts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index++) if (event.results[index].isFinal) parts.push(event.results[index][0].transcript);
      if (parts.length) transcriptCallback.current(parts.join(" "));
    };
    recognition.current = current;
    setListening(true);
    try { current.start(); } catch { recognition.current = null; setListening(false); setError("Could not start voice input. Check microphone permissions and try again."); }
  }
  return <div className="my-3 space-y-2">
    <div className="flex flex-wrap items-center gap-3"><label htmlFor="voice-language" className="text-xs font-semibold">Voice language</label><select id="voice-language" disabled={listening} value={language} onChange={event => { setLanguage(event.target.value); setError(""); try { localStorage.setItem("jansamvad.voice.language", event.target.value); } catch { /* preference remains usable for this visit */ } }} className="rounded-lg border bg-[hsl(var(--background))] p-2 text-xs">{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select><button type="button" onClick={toggle} data-testid="voice-toggle" className="flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]"><Mic size={14} />{listening ? "Stop listening" : "Voice Input"}</button></div>
    <p className="text-xs text-[hsl(var(--muted-foreground))]" role="status">{listening ? `Listening in ${languages.find(([code]) => code === language)?.[1]}…` : "Choose the language you will speak. Availability depends on your browser's speech service; text input is always available."}</p>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
  </div>;
}
