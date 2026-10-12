import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';
import { aforoCorrecto, TOLERANCIA_Q5_REL } from '@/domain/quimica';

// Mismas tolerancias que el validador: masa a ±5 % de la calculada y menisco
// dentro de la tolerancia de aforo del matraz (±0.2 % del nominal, mínimo 0.5 mL).
// La masa requerida NO se muestra como meta: es la respuesta del pre-laboratorio.
export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { soluciones } = s;
  const polvo = soluciones?.matraz?.polvo || 0;
  const agua = soluciones?.matraz?.agua || 0;
  const mReq = soluciones?.mRequerida || 7.305;
  const vTarget = soluciones?.vTarget || 250;
  const pesajeOk = polvo > 0 && Math.abs(polvo - mReq) / mReq <= TOLERANCIA_Q5_REL;
  return [
      { label: 'Pesaje Analítico (±5 %)', current: pesajeOk ? 1 : 0, target: 1, completed: pesajeOk },
      { label: 'Exactitud de Aforo',  current: agua,  target: vTarget, completed: aforoCorrecto(agua, vTarget) },
      { label: 'Certificación de M',  current: soluciones?.status === 'success' ? 1 : 0, target: 1, completed: soluciones?.status === 'success' },
    ];
}
