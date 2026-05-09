"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, XCircle, ArrowRight, Brain, 
  Trophy, HelpCircle, Sparkles, Rocket,
  Award, Star, Zap, Download, RefreshCcw
} from "lucide-react";

export interface Question {
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
  explicacion: string;
}

interface LabQuizProps {
  id: string;
  questions: Question[];
  onComplete: (score: number) => void;
  onCancel: () => void;
}

export default function LabQuiz({ id, questions, onComplete, onCancel }: LabQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  const handleOptionSelect = (idx: number) => {
    if (showFeedback) return;
    setSelectedOption(idx);
    setShowFeedback(true);
    
    if (idx === currentQuestion.respuestaCorrecta) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setIsFinished(true);
    }
  };

  const getMedalInfo = (pct: number) => {
    if (pct >= 100) return { 
      label: "Excelencia Diamante", 
      color: "text-cyan-400", 
      bg: "bg-cyan-500/10", 
      border: "border-cyan-500/30",
      icon: <Award size={80} className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]" fill="currentColor" />,
      desc: "Has alcanzado el dominio absoluto de los conceptos cuánticos."
    };
    if (pct >= 80) return { 
      label: "Maestría de Oro", 
      color: "text-yellow-400", 
      bg: "bg-yellow-500/10", 
      border: "border-yellow-500/30",
      icon: <Trophy size={80} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" fill="currentColor" />,
      desc: "Tu comprensión técnica es excepcional. Nivel experto validado."
    };
    if (pct >= 60) return { 
      label: "Certificación de Plata", 
      color: "text-slate-300", 
      bg: "bg-slate-500/10", 
      border: "border-slate-500/30",
      icon: <Star size={80} className="text-slate-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" fill="currentColor" />,
      desc: "Certificación obtenida. Tienes una base sólida de conocimientos."
    };
    return { 
      label: "Certificado de Participación", 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10", 
      border: "border-emerald-500/30",
      icon: <Zap size={80} className="text-emerald-400" />,
      desc: "Has completado la práctica. Te recomendamos repasar los conceptos clave."
    };
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    const medal = getMedalInfo(percentage);

    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 z-[600] flex items-center justify-center bg-[#023047]/98 backdrop-blur-3xl p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
          className="bg-gradient-to-br from-[#023047] to-[#0a1a2e] border border-white/10 rounded-[4rem] p-16 max-w-2xl w-full text-center text-white relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]"
        >
          {/* Decorative background elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
          
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.2 }}
            className="flex justify-center mb-10"
          >
            <div className={`w-40 h-40 rounded-full ${medal.bg} flex items-center justify-center border ${medal.border} relative`}>
               <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse" />
               {medal.icon}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <span className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 block ${medal.color}`}>{medal.label}</span>
            <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter italic">Certificación CEN</h2>
            <p className="text-slate-400 mb-12 font-bold max-w-md mx-auto leading-relaxed">{medal.desc}</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Puntaje Obtenido</div>
              <div className="text-5xl font-black font-mono tracking-tighter">{score}<span className="text-xl text-slate-500">/{questions.length}</span></div>
            </div>
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nivel de Precisión</div>
              <div className="text-5xl font-black font-mono tracking-tighter">{percentage}<span className="text-xl text-slate-500">%</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => onComplete(score)}
              className="w-full py-6 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-cyan-600/30 transition-all flex items-center justify-center gap-3 group"
            >
              Cerrar y Validar <Rocket size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <div className="flex gap-4">
              <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-[9px] uppercase tracking-widest rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-all">
                <Download size={14} /> Descargar Certificado
              </button>
              <button onClick={() => window.location.reload()} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-[9px] uppercase tracking-widest rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-all">
                <RefreshCcw size={14} /> Reintentar Quiz
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 z-[600] flex items-center justify-center bg-[#023047]/95 backdrop-blur-xl p-6 overflow-y-auto"
      >
        <div className="max-w-4xl w-full flex flex-col gap-6 relative py-12">
          
          {/* Header Area */}
          <div className="flex items-center justify-between text-white px-4">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 shadow-lg">
                <Brain size={28} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Evaluación Técnica</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   Fase {currentIdx + 1} <ArrowRight size={10} /> {questions.length} Objetivos
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Aciertos: {score}</span>
                <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(score/questions.length)*100}%` }} className="h-full bg-emerald-500" />
                </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400"
            />
          </div>

          {/* Question Card */}
          <motion.div 
            key={currentIdx}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            className="bg-white/5 border border-white/10 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col backdrop-blur-md"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            <div className="relative z-10 flex-1">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-cyan-500/20">Análisis Cuántico</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>
                <h2 className="text-3xl font-black text-white leading-[1.1] tracking-tight">
                  {currentQuestion.pregunta}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.opciones.map((opcion, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.respuestaCorrecta;
                  const showAsCorrect = showFeedback && isCorrect;
                  const showAsIncorrect = showFeedback && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!showFeedback ? { scale: 1.01, x: 10 } : {}}
                      whileTap={!showFeedback ? { scale: 0.98 } : {}}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={showFeedback}
                      className={`
                        w-full text-left p-6 rounded-[1.5rem] border text-[15px] font-bold transition-all flex items-center justify-between group
                        ${isSelected ? 'ring-2 ring-cyan-500/50 ring-offset-4 ring-offset-[#023047]' : ''}
                        ${showAsCorrect ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 
                          showAsIncorrect ? 'bg-red-500/20 border-red-500/50 text-red-400' : 
                          'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${isSelected ? 'bg-cyan-500 text-white' : 'bg-white/10 text-slate-500 group-hover:bg-white/20'}`}>
                           {String.fromCharCode(65 + idx)}
                        </div>
                        <span>{opcion}</span>
                      </div>
                      {showAsCorrect && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={24} className="text-emerald-400" /></motion.div>}
                      {showAsIncorrect && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><XCircle size={24} className="text-red-400" /></motion.div>}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Area */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, y: 20 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  className="mt-10 pt-10 border-t border-white/10"
                >
                  <div className={`flex gap-6 items-start p-8 rounded-[2rem] ${selectedOption === currentQuestion.respuestaCorrecta ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${selectedOption === currentQuestion.respuestaCorrecta ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {selectedOption === currentQuestion.respuestaCorrecta ? <Sparkles size={28} /> : <HelpCircle size={28} />}
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${selectedOption === currentQuestion.respuestaCorrecta ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedOption === currentQuestion.respuestaCorrecta ? '¡Análisis Correcto!' : 'Ajuste de Concepto'}
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">{currentQuestion.explicacion}</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleNext}
                      className="px-12 py-5 bg-white text-[#023047] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-cyan-400 shadow-xl shadow-white/5 transition-all flex items-center gap-3 group"
                    >
                      {currentIdx < questions.length - 1 ? 'Siguiente Objetivo' : 'Finalizar Evaluación'}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer labels */}
          <div className="flex justify-center gap-12 text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">
            <span className="flex items-center gap-3"><HelpCircle size={12} /> Pensamiento Crítico</span>
            <span className="flex items-center gap-3"><CheckCircle2 size={12} /> Rigor Científico</span>
            <span className="flex items-center gap-3"><Rocket size={12} /> Acreditación CEN</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
