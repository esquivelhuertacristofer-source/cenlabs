import React, { useState } from 'react';
import { X, Delete, Calculator } from 'lucide-react';

interface ScientificCalculatorProps {
  onClose?: () => void;
  language?: 'es' | 'en';
}

// Parser recursivo descendente — reemplaza new Function / eval.
// Gramática: expr → term ((+|-) term)*
//            term → pow ((*|/) pow)*
//            pow  → unary (^ pow)?          ← asociativo a la derecha
//            unary→ - unary | atom
//            atom → sin(expr)|cos(expr)|tan(expr)|log(expr)|π|e|(expr)|num
function evaluateExpr(raw: string): number {
  const src = raw.replace(/×/g, '*').replace(/÷/g, '/').trim();
  let pos = 0;

  function skip() { while (pos < src.length && src[pos] === ' ') pos++; }
  function peek() { skip(); return src[pos] ?? ''; }

  function parseExpr(): number {
    let v = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = src[pos++];
      v = op === '+' ? v + parseTerm() : v - parseTerm();
    }
    return v;
  }

  function parseTerm(): number {
    let v = parsePow();
    while (peek() === '*' || peek() === '/') {
      const op = src[pos++];
      const r = parsePow();
      if (op === '/' && r === 0) throw new Error('División por cero');
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }

  function parsePow(): number {
    const base = parseUnary();
    if (peek() === '^') { pos++; return Math.pow(base, parsePow()); }
    return base;
  }

  function parseUnary(): number {
    if (peek() === '-') { pos++; return -parseUnary(); }
    return parseAtom();
  }

  function readArg(): number {
    skip();
    if (src[pos] !== '(') throw new Error('Se esperaba (');
    pos++;
    const v = parseExpr();
    skip();
    if (src[pos] !== ')') throw new Error('Se esperaba )');
    pos++;
    return v;
  }

  function parseAtom(): number {
    skip();
    if (src.startsWith('sin', pos)) { pos += 3; return Math.sin(readArg()); }
    if (src.startsWith('cos', pos)) { pos += 3; return Math.cos(readArg()); }
    if (src.startsWith('tan', pos)) { pos += 3; return Math.tan(readArg()); }
    if (src.startsWith('log', pos)) { pos += 3; return Math.log10(readArg()); }
    if (src[pos] === 'π') { pos++; return Math.PI; }
    if (src[pos] === 'e') { pos++; return Math.E; }
    if (src[pos] === '(') {
      pos++;
      const v = parseExpr();
      skip();
      if (src[pos] !== ')') throw new Error('Se esperaba )');
      pos++;
      return v;
    }
    return parseNum();
  }

  function parseNum(): number {
    skip();
    let s = '';
    while (pos < src.length && /[0-9.]/.test(src[pos])) s += src[pos++];
    if (!s) throw new Error('Token inesperado');
    return parseFloat(s);
  }

  const result = parseExpr();
  skip();
  if (pos !== src.length) throw new Error('Expresión inválida');
  if (!isFinite(result)) throw new Error('Resultado inválido');
  return result;
}

export default function ScientificCalculator({ onClose, language = 'es' }: ScientificCalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');

  const append = (char: string) => {
    setDisplay(prev => prev === '0' ? char : prev + char);
  };

  const clear = () => {
    setDisplay('0');
    setHistory('');
  };

  const del = () => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const compute = () => {
    try {
      const result = evaluateExpr(display);
      setHistory(display + ' =');
      setDisplay(String(Number(result.toFixed(8))));
    } catch {
      setDisplay('Error');
    }
  };

  const buttons = [
    { label: 'sin', action: () => append('sin('), type: 'fn' },
    { label: 'cos', action: () => append('cos('), type: 'fn' },
    { label: 'tan', action: () => append('tan('), type: 'fn' },
    { label: '^', action: () => append('^'), type: 'op' },
    { label: 'π', action: () => append('π'), type: 'const' },
    { label: 'e', action: () => append('e'), type: 'const' },
    { label: 'log', action: () => append('log('), type: 'fn' },
    { label: '(', action: () => append('('), type: 'op' },
    { label: ')', action: () => append(')'), type: 'op' },
    { label: '÷', action: () => append('÷'), type: 'op' },
    { label: '7', action: () => append('7'), type: 'num' },
    { label: '8', action: () => append('8'), type: 'num' },
    { label: '9', action: () => append('9'), type: 'num' },
    { label: '×', action: () => append('×'), type: 'op' },
    { label: '4', action: () => append('4'), type: 'num' },
    { label: '5', action: () => append('5'), type: 'num' },
    { label: '6', action: () => append('6'), type: 'num' },
    { label: '-', action: () => append('-'), type: 'op' },
    { label: '1', action: () => append('1'), type: 'num' },
    { label: '2', action: () => append('2'), type: 'num' },
    { label: '3', action: () => append('3'), type: 'num' },
    { label: '+', action: () => append('+'), type: 'op' },
    { label: 'C', action: clear, type: 'clear' },
    { label: '0', action: () => append('0'), type: 'num' },
    { label: '.', action: () => append('.'), type: 'num' },
    { label: '=', action: compute, type: 'equal' }
  ];

  return (
    <div className="bg-slate-50 rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden w-80">
      <div className="bg-[#023047] p-6 text-right">
        <div className="flex justify-between items-center mb-2">
           <div className="flex items-center gap-2 text-white/40">
              <Calculator size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{language === 'es' ? 'Calculadora' : 'Calculator'}</span>
           </div>
           {onClose && (
             <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
             </button>
           )}
        </div>
        <div className="h-4 text-[10px] text-white/40 font-mono mb-1 truncate">{history}</div>
        <div className="text-3xl font-mono font-black text-[#8ECAE6] truncate">{display}</div>
      </div>

      <div className="p-4 grid grid-cols-4 gap-2 bg-white">
        <button
          onClick={del}
          className="col-span-2 py-3 rounded-xl bg-slate-100 text-slate-500 font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-slate-200"
        >
          <Delete size={14} /> {language === 'es' ? 'Borrar' : 'Delete'}
        </button>
        <div className="col-span-2" />

        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`
              py-3 rounded-xl font-black text-sm flex items-center justify-center transition-all active:scale-95
              ${btn.type === 'num' ? 'bg-slate-50 text-[#023047] hover:bg-slate-100' : ''}
              ${btn.type === 'op' ? 'bg-[#219EBC]/10 text-[#219EBC] hover:bg-[#219EBC]/20' : ''}
              ${btn.type === 'fn' ? 'bg-indigo-50 text-indigo-500 text-xs hover:bg-indigo-100' : ''}
              ${btn.type === 'const' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : ''}
              ${btn.type === 'equal' ? 'bg-[#FB8500] text-white shadow-lg shadow-orange-200 hover:bg-orange-600' : ''}
              ${btn.type === 'clear' ? 'bg-red-50 text-red-500 hover:bg-red-100' : ''}
            `}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
