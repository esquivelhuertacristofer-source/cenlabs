import { SimuladorState, BitacoraData } from '@/store/types';

type Tiro1State          = SimuladorState['tiro1'];
type Plano2State         = SimuladorState['plano2'];
type Pendulo3State       = SimuladorState['pendulo3'];
type Hooke4State         = SimuladorState['hooke4'];
type Arquimedes6State    = SimuladorState['arquimedes6'];
type Dilatacion7State    = SimuladorState['dilatacion7'];
type Ohm8State           = SimuladorState['ohm8'];
type Electrostatica9State = SimuladorState['electrostatica9'];
type Motor10State        = SimuladorState['motor10'];

// F1 — Tiro Parabólico
export function validarF1(tiro1: Tiro1State): boolean {
  return tiro1.resultado === 'exito';
}

// F2 — Plano Inclinado
export function validarF2(plano2: Plano2State): boolean {
  return plano2.angulo > 0 && !!plano2.resultado;
}

// F3 — Péndulo Simple
export function validarF3(pendulo3: Pendulo3State): boolean {
  return pendulo3.longitud > 0 && pendulo3.periodo > 0;
}

// F4 — Ley de Hooke
export function validarF4(hooke4: Hooke4State): boolean {
  return hooke4.masa > 0 && hooke4.k > 0 && hooke4.estiramiento !== 0;
}

// F5 — Prensa Hidráulica (valida por bitácora)
export function validarF5(bitacoraData: BitacoraData): boolean {
  return !!bitacoraData.fisica5;
}

// F6 — Principio de Arquímedes
export function validarF6(arquimedes6: Arquimedes6State): boolean {
  return (arquimedes6.sumergido ?? 0) >= 1;
}

// F7 — Dilatación Térmica
export function validarF7(dilatacion7: Dilatacion7State): boolean {
  return (dilatacion7.tempFin - dilatacion7.tempIni) >= 50;
}

// F8 — Ley de Ohm
export function validarF8(ohm8: Ohm8State): boolean {
  return ohm8.voltaje > 0 && ohm8.resistencia > 0 && ohm8.switchOn;
}

// F9 — Electrostática (Ley de Coulomb)
export function validarF9(electrostatica9: Electrostatica9State): boolean {
  return Math.abs(electrostatica9.q1) > 0 && Math.abs(electrostatica9.q2) > 0;
}

// F10 — Motor Eléctrico
export function validarF10(motor10: Motor10State): boolean {
  return motor10.encendido && motor10.rpm > 0;
}
