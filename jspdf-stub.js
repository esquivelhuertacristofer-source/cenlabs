// Stub de 'jspdf' para el bundle de SERVIDOR (worker de Cloudflare).
//
// jsPDF (~100 KiB gz) se usa EXCLUSIVAMENTE en cliente: pdfGenerator.ts,
// reportUtils.ts y admin/usuarios/page.tsx son todos 'use client' y solo
// instancian `new jsPDF()` dentro de handlers/funciones async del navegador —
// nunca durante el render de servidor ni en rutas de servidor.
//
// next.config.ts aliasa 'jspdf' a este stub SOLO cuando isServer, de modo que el
// SDK real no entre al grafo del build de servidor (que OpenNext inlinea entero al
// worker). En cliente se usa el jspdf real (el alias no aplica). Los tipos siguen
// viniendo del paquete real vía TypeScript (el alias de webpack no afecta tipos).
//
// Es un no-op SILENCIOSO (no lanza): si algún render de servidor llegara a
// instanciarlo por accidente, no rompe nada — honra "mientras no rompa nada".
const noop = () => {};

class JsPDFStub {
  constructor() {
    // Cualquier método (text, setFontSize, addPage, save, output, ...) es no-op.
    // Los encadenables devuelven la misma instancia; el resto, undefined.
    return new Proxy(this, {
      get(target, prop) {
        if (prop === 'output') return () => '';
        if (prop === 'splitTextToSize') return (text) => (Array.isArray(text) ? text : [String(text ?? '')]);
        if (prop === 'internal') {
          return { pageSize: { getWidth: () => 0, getHeight: () => 0, width: 0, height: 0 } };
        }
        if (prop in target) return target[prop];
        // Método encadenable no-op por defecto.
        return () => target;
      },
    });
  }
}

export const jsPDF = JsPDFStub;
export default JsPDFStub;
