import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Loader2, Sparkles, Plus, Trash2, MessageSquare,
  FileText, ScrollText, ChevronLeft, Zap, GraduationCap, Layout,
  BarChart3, Users, DollarSign, Clock, AlertTriangle,
} from "lucide-react";
import DocumentPrinter from "../../components/DocumentPrinter";

const suggestions = [
  { icon: FileText, text: "Combien d'élèves ?", ar: "كم عدد التلاميذ؟" },
  { icon: DollarSign, text: "Bilan financier", ar: "الميزانية المالية" },
  { icon: Users, text: "Demandes RH", ar: "طلبات الموارد البشرية" },
  { icon: BarChart3, text: "Résultats scolaires", ar: "النتائج المدرسية" },
  { icon: Clock, text: "Absences", ar: "الغيابات" },
  { icon: Layout, text: "Répartition niveaux", ar: "التوزيع حسب المستوى" },
];

function isRTL(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function BubbleContent({ content }) {
  const rtl = isRTL(content);
  const parts = content.split(/(\*\*.*?\*\*)/g);
  return (
    <span dir={rtl ? "rtl" : "ltr"} className={rtl ? "text-right block" : ""}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-purple-300">{part.slice(2, -2)}</strong>;
        }
        return part.split('\n').map((line, j) => (
          <React.Fragment key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </React.Fragment>
        ));
      })}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30 ring-1 ring-purple-400/20">
        <Bot size={17} className="text-white" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-bl-md px-5 py-4 shadow-xl"
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, color, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 shadow-lg hover:shadow-xl ${color}`}
    >
      <Icon size={18} />
      <div className="text-left">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[10px] opacity-70">{desc}</p>
      </div>
    </motion.button>
  );
}

export default function AssistantModule({ api, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documentData, setDocumentData] = useState(null);
  const [pendingDoc, setPendingDoc] = useState(null);
  const chatEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get("/assistant/conversations");
      setConversations(res.data);
    } catch { /* ignore */ }
  }, [api]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadMessages = useCallback(async (convId) => {
    try {
      const res = await api.get(`/assistant/conversations/${convId}/messages`);
      setMessages(res.data);
      setActiveConv(convId);
    } catch { /* ignore */ }
  }, [api]);

  const newConversation = async () => {
    try {
      const res = await api.post("/assistant/conversations", { title: "Nouvelle conversation" });
      setConversations(prev => [res.data, ...prev]);
      setActiveConv(res.data.id);
      setMessages([]);
      setSidebarOpen(false);
    } catch { /* ignore */ }
  };

  const deleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await api.delete(`/assistant/conversations/${convId}`);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConv === convId) {
        setActiveConv(null);
        setMessages([]);
      }
    } catch { /* ignore */ }
  };

  const handleAsk = async (question) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);
    setPendingDoc(null);
    try {
      const res = await api.post("/assistant/ask", { question: q, conversation_id: activeConv });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.answer }]);
      if (res.data.document) {
        setDocumentData({ ...res.data.document.data, type: res.data.document.type, numero: res.data.document.data.numero || `DOC-${Date.now()}` });
      } else {
        detectDocumentIntent(q);
      }
      if (!activeConv || activeConv !== res.data.conversation_id) {
        setActiveConv(res.data.conversation_id);
        loadConversations();
      } else {
        loadConversations();
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur s'est produite." }]);
    } finally {
      setLoading(false);
    }
  };

  const detectDocumentIntent = async (question) => {
    var q = question.toLowerCase();
    var isAttestation = q.includes('attestation') || q.includes('travail');
    var isCertificat = q.includes('certificat') || q.includes('scolaire') || q.includes('scolarite') || q.includes('شهادة');
    if (!isAttestation && !isCertificat) return;

    var docType = isAttestation ? 'attestation' : 'certificat';
    var stopWords = ['génère','genere','pour','une','un','de','la','le','du','des','attestation','certificat','travail','scolaire','scolarite','شهادة','je','tu','il','elle','nous','vous','ils','elles','sur','dans','avec','est','sont','a','les','ces','mes','tes','ses','nos','vos','leurs','lui','moi','toi','aussi','mais','donc','car','ni','or','et','ou','en','au','aux','son','sa','se','ce','cette','que','qui','quoi','dont','où','pas','plus','très','bien','fait','faire'];
    var words = question.split(/[\s,.\n]+/);
    var nameWords = [];
    for (var w of words) {
      var clean = w.replace(/[^a-zA-ZÀ-ÿ\u0600-\u06FF\s]/g, '');
      if (clean.length > 2 && !stopWords.includes(clean.toLowerCase())) {
        nameWords.push(clean);
      }
    }
    var name = nameWords.slice(0, 3).join(' ');
    if (!name && isCertificat) name = '';

    try {
      var docRes = await api.post('/assistant/document-data', { name, type: docType });
      if (docRes.data.found) {
        setPendingDoc({ type: docType, person: docRes.data.person, document: docRes.data.document });
      }
    } catch {}
  };

  const handleGenerateDocument = async () => {
    if (!pendingDoc) return;
    try {
      var res = await api.post('/assistant/generate-document', { type: pendingDoc.document.type, person: pendingDoc.person });
      setDocumentData(res.data);
      setPendingDoc(null);
    } catch {}
  };

  const handleSuggestion = (text) => handleAsk(text);

  const quickActions = [
    { icon: ScrollText, label: "Attestation de travail", desc: "Générer un document", color: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-300 hover:from-blue-500/20 hover:to-indigo-500/20", onClick: () => handleAsk("Génère une attestation de travail") },
    { icon: FileText, label: "Certificat scolaire", desc: "Générer un certificat", color: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-300 hover:from-emerald-500/20 hover:to-teal-500/20", onClick: () => handleAsk("Génère un certificat de scolarité") },
  ];

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-950 via-slate-900 to-purple-950 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="relative bg-white/[0.03] backdrop-blur-2xl border-r border-white/5 flex-shrink-0 overflow-hidden z-10"
          >
            <div className="w-[280px] h-full flex flex-col">
              <div className="p-4 border-b border-white/5">
                <button
                  onClick={newConversation}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-xl text-sm font-semibold hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 transition-all duration-300 shadow-lg shadow-purple-600/20 hover:shadow-purple-500/40"
                >
                  <Plus size={16} />
                  Nouvelle conversation
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {conversations.map(conv => (
                  <motion.div
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => { loadMessages(conv.id); setSidebarOpen(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadMessages(conv.id); setSidebarOpen(false); } }}
                    className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition-all duration-200 cursor-pointer ${
                      activeConv === conv.id
                        ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 text-white border border-violet-500/20 shadow-lg shadow-violet-600/10"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeConv === conv.id
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-600"
                        : "bg-white/5"
                    }`}>
                      <MessageSquare size={14} className={activeConv === conv.id ? "text-white" : "text-gray-500"} />
                    </div>
                    <span className="flex-1 truncate font-medium">{conv.title}</span>
                    <button onClick={(e) => deleteConversation(e, conv.id)} className="p-1 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white/[0.02] backdrop-blur-2xl border-b border-white/5 px-4 md:px-6 py-3 flex-shrink-0 flex items-center gap-3"
        >
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-200">
            <ChevronLeft size={18} className={sidebarOpen ? "" : "rotate-180"} />
          </button>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-purple-600/30 flex-shrink-0 ring-1 ring-purple-400/20"
          >
            <Sparkles size={18} className="text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">
              Assistant SGS
            </h1>
            <p className="text-[11px] text-gray-500 truncate">
              {activeConv ? (conversations.find(c => c.id === activeConv)?.title || 'Conversation') : 'Nouvelle conversation'}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {quickActions.map((qa, i) => (
              <QuickAction key={i} {...qa} />
            ))}
          </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6 py-4 space-y-4 relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-purple-600/30 mb-5 ring-1 ring-purple-400/20">
                  <Sparkles size={34} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-gray-950 shadow-lg" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Assistant SGS</h2>
              <p className="text-sm text-gray-500 max-w-md mb-8">
                Posez des questions sur l'établissement : élèves, finances, RH, absences, résultats scolaires...
              </p>

              <div className="flex flex-wrap gap-2 justify-center md:hidden mb-6">
                {quickActions.map((qa, i) => (
                  <QuickAction key={i} {...qa} />
                ))}
              </div>

              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSuggestion(s.text)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-purple-500/30 transition-all duration-200 shadow-lg hover:shadow-purple-500/10 font-medium"
                  >
                    <s.icon size={14} className="opacity-60" />
                    {s.text}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id || i}
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30 mt-1 ring-1 ring-purple-400/20">
                        <Bot size={17} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-md shadow-purple-600/20"
                        : "bg-white/[0.04] backdrop-blur-xl border border-white/10 text-gray-200 rounded-bl-md"
                    }`}>
                      <BubbleContent content={msg.content} />
                    </div>
                    {msg.role === "user" && (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-600/30 mt-1 ring-1 ring-purple-400/20">
                        <User size={17} className="text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {pendingDoc && !loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                  <button onClick={handleGenerateDocument}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-xl font-semibold text-sm hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 transition-all duration-300 shadow-xl shadow-purple-600/30 hover:shadow-purple-500/50 flex items-center gap-2"
                  >
                    <FileText size={16} />
                    {pendingDoc.type === 'attestation' ? "Générer l'attestation" : 'Générer le certificat'}
                  </button>
                </motion.div>
              )}

              {loading && <TypingIndicator />}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white/[0.02] backdrop-blur-2xl border-t border-white/5 px-4 md:px-6 py-4 flex-shrink-0"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleAsk(input); }} className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                disabled={loading}
                dir={isRTL(input) ? "rtl" : "ltr"}
                className="w-full border border-white/10 rounded-xl px-4 py-3.5 text-sm bg-white/[0.04] text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm"
              />
            </div>
            <motion.button
              type="submit"
              disabled={!input.trim() || loading}
              whileHover={input.trim() && !loading ? { scale: 1.03 } : {}}
              whileTap={input.trim() && !loading ? { scale: 0.97 } : {}}
              className="px-5 py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-xl font-semibold text-sm hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl shadow-purple-600/30 hover:shadow-purple-500/50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span className="hidden sm:inline">{loading ? '...' : 'Envoyer'}</span>
            </motion.button>
          </form>
        </motion.div>
      </div>

      <DocumentPrinter doc={documentData} onClose={() => setDocumentData(null)} />
    </div>
  );
}
