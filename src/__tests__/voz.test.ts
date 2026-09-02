/**
 * LO QUE SE LE DA AL SINTETIZADOR, Y QUE EL AUDIO QUE LA PÁGINA PIDE EXISTE.
 *
 * Dos clases de fallo distintas, y las dos son mudas —no tiran una excepción,
 * sólo suenan mal o no suenan—, que es justo por lo que necesitan prueba.
 *
 * 1. LA NORMALIZACIÓN. Cada caso de aquí sale de una medición contra
 *    `es-MX-DaliaNeural`: se sintetizó «El valor es X» con el símbolo y con su
 *    lectura escrita y se compararon los tamaños. El método y las cifras están
 *    en la cabecera de `src/lib/voz/decir.ts`. Si alguien «simplifica» esas
 *    reglas, esto lo detiene.
 *
 * 2. LA CADENA DE CLAVES. El extractor grabó los MP3 con unos nombres y el
 *    navegador los pide con otros; hoy es el mismo código, pero el manifiesto
 *    puede quedarse viejo respecto a un briefing que se editó después. Un lab
 *    que diga «tengo voz» y le falte un archivo deja a la locutora callada en
 *    mitad del párrafo.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { paraDecir, frases, papelDe, esOrden, PAPELES, pausaEntre } from '@/lib/voz/decir';
import { clipsDeBriefing, rutaVoz } from '@/lib/voz/claves';
import { tieneVoz, LABS_CON_VOZ } from '@/lib/voz/hecha';

const RAIZ = join(__dirname, '..', '..');
const BRIEFINGS = join(RAIZ, 'public', 'labs-data', 'briefing');
const VOZ = join(RAIZ, 'public', 'assets', 'voz');

describe('paraDecir · lo que se oye no es lo que está escrito', () => {
  it('quita los asteriscos del markdown, que el motor PRONUNCIA', () => {
    // Medido: «El valor es **muy alto**» pesa 14 832 bytes contra 11 952 sin los
    // asteriscos. La diferencia es la locutora diciendo «asterisco».
    expect(paraDecir('la tesis es **incómoda** aquí')).toBe('la tesis es incómoda aquí.');
    expect(paraDecir('*énfasis* suelto')).toBe('énfasis suelto.');
    expect(paraDecir('el `código` en línea')).toBe('el código en línea.');
  });

  it('quita las comillas angulares, que también se pronuncian', () => {
    // Medido: 14 544 con «hola» contra 11 952 sin las comillas.
    expect(paraDecir('la tabla «1993 y anteriores» aplica')).toBe('la tabla 1993 y anteriores aplica.');
  });

  it('baja los subíndices a dígito, porque el motor los IGNORA', () => {
    // Medido: «CO₂» 11 088 ≈ la frase sin nada; «CO2» 12 816. Sin esto, CO₂
    // suena «CO» y H₂O suena «HO»: no es estilo, es química cambiada.
    expect(paraDecir('sube el CO₂ y baja el H₂O')).toBe('sube el CO2 y baja el H2O.');
    expect(paraDecir('el NOₓ del escape')).toBe('el NOx del escape.');
  });

  it('traduce la flecha y el punto medio, que se caen sin dejar ni pausa', () => {
    // Medido: «A → B» 11 088 = «A B» 11 088, o sea que la flecha no existe.
    expect(paraDecir('R-134a → R-1234yf')).toBe('R-134a a R-1234yf.');
    expect(paraDecir('uno · dos · tres')).toBe('uno, dos, tres.');
  });

  it('deletrea las unidades que el motor no arma solo', () => {
    expect(paraDecir('mide 5 kV')).toBe('mide 5 kilovoltios.');
    expect(paraDecir('a 50 Hz')).toBe('a 50 hercios.');
    expect(paraDecir('a 50 kHz')).toBe('a 50 kilohercios.');   // el prefijo, antes que la regla corta
    expect(paraDecir('de 10 µF')).toBe('de 10 microfaradios.');
    expect(paraDecir('gira a ω constante')).toBe('gira a omega constante.');
  });

  it('NO toca lo que ya se lee bien: tocarlo sólo puede empeorarlo', () => {
    // λ, Δ, η, Ω, ≤, %, °C, m² y la coma decimal salieron IDÉNTICOS a su
    // lectura escrita. Están medidos uno por uno en decir.ts.
    const intactos = 'con λ = 1,000 y Δ de 5 °C, η ≤ 92 % sobre 3 m² y 10 Ω';
    expect(paraDecir(intactos)).toBe(intactos + '.');
  });

  it('cierra la frase para que no salga cortada al pegarla con la siguiente', () => {
    expect(paraDecir('sin punto final')).toBe('sin punto final.');
    expect(paraDecir('con punto final.')).toBe('con punto final.');
    expect(paraDecir('¿y una pregunta?')).toBe('¿y una pregunta?');
  });

  it('no inventa texto donde no hay nada', () => {
    expect(paraDecir('')).toBe('');
    expect(paraDecir(null)).toBe('');
    expect(paraDecir('   ')).toBe('');
  });
});

describe('frases · dónde se corta un párrafo', () => {
  it('no parte en el punto de una norma ni en el de una cifra', () => {
    // «NOM-041-SEMARNAT-2015.» y «1,05.» llevan puntos que no terminan frase.
    const p = 'El límite lo fija la NOM-041-SEMARNAT-2015. El vehículo cumple cuando no rebasa ninguno.';
    expect(frases(p)).toHaveLength(2);
  });

  it('pega a la anterior lo que es demasiado corto para ser una frase', () => {
    const p = 'La relación estequiométrica sale de un balance de átomos. 14,60. Y de ahí cuelga todo lo demás.';
    const f = frases(p);
    expect(f).toHaveLength(2);
    expect(f[0]).toContain('14,60.');
  });
});

describe('papelDe · la dirección se deduce, no se escribe', () => {
  it('reconoce el contraste por su conector', () => {
    expect(papelDe('Pero al cortar el aire el básico suelta el panel.', 2, 5)).toBe('contraste');
    expect(papelDe('Sin embargo la fuerza sube.', 2, 5)).toBe('contraste');
  });

  it('marca como giro la frase que llevaba negrita', () => {
    expect(papelDe('la tesis es **incómoda**', 3, 6)).toBe('giro');
  });

  it('usa la posición cuando no hay ninguna otra marca', () => {
    expect(papelDe('Abre el tema.', 0, 4)).toBe('entrada');
    expect(papelDe('Cierra el tema.', 3, 4)).toBe('remate');
    expect(papelDe('Va por el medio.', 1, 4)).toBe('dato');
  });

  it('un bloque de dos frases no tiene remate: sería la mitad del bloque', () => {
    expect(papelDe('La segunda de dos.', 1, 2)).toBe('dato');
  });

  it('reconoce la orden de un paso de misión por el verbo en mayúsculas', () => {
    expect(esOrden('PON λ = 0,90 y compara.')).toBe(true);
    expect(esOrden('RETO · Llega un vehículo.')).toBe(true);
    expect(esOrden('Observa el resultado.')).toBe(false);
  });
});

describe('PAPELES · ritmo y pausa viven juntos', () => {
  it('todo papel que devuelve papelDe tiene su entrada en la tabla', () => {
    for (const papel of ['rotulo', 'entrada', 'dato', 'contraste', 'giro', 'remate', 'orden'] as const) {
      expect(PAPELES[papel]).toBeDefined();
      expect(PAPELES[papel].ritmo).toMatch(/^[+-]\d+%$/);
    }
  });

  it('el tono NO está en la tabla: moverlo arrastra los formantes', () => {
    // Si alguien vuelve a meter `tono` aquí, esto lo detiene. Ver la cabecera de
    // narrar.py: el cliente ya escuchó lo que pasa —«a veces como niña, otras
    // como monstruo»— y no hay dosis pequeña que lo salve.
    for (const v of Object.values(PAPELES)) {
      expect(Object.keys(v).sort()).toEqual(['antes', 'despues', 'ritmo']);
    }
  });

  it('el giro entra después de un silencio y el contraste casi encima', () => {
    expect(pausaEntre('dato', 'giro')).toBeGreaterThan(pausaEntre('dato', 'contraste'));
  });

  it('la primera frase de una cola no arrastra pausa de nadie', () => {
    expect(pausaEntre(null, 'entrada')).toBe(0);
  });
});

describe('clipsDeBriefing · el contrato de las claves', () => {
  const briefing = {
    titulo: 'Gases de Escape',
    subtitulo: 'Motor de combustión',
    bienvenida: 'Primer párrafo con su frase. Y una segunda frase que lo remata bien.\n\nSegundo párrafo entero.',
    conceptos: [{ nombre: 'Un balance', descripcion: 'C, H y O se conservan siempre en el proceso.' }],
    mision: ['PON λ = 0,90 y compara el resultado con el del motor.'],
    aplicaciones: [{ area: 'Verificación', ejemplo: 'El coche que reprueba con el motor perfecto.' }],
  };

  it('las claves llevan la posición dentro, y son estables', () => {
    const claves = clipsDeBriefing(briefing).map((c) => c.clave);
    expect(claves).toContain('titulo');
    expect(claves).toContain('bienvenida-0-0');
    expect(claves).toContain('bienvenida-1-0');
    expect(claves).toContain('concepto-0-0');
    expect(claves).toContain('mision-0-0');
    expect(claves).toContain('aplicacion-0-0');
  });

  it('el mismo briefing da siempre los mismos clips', () => {
    expect(clipsDeBriefing(briefing)).toEqual(clipsDeBriefing(briefing));
  });

  it('cada clip cae en el bloque de pantalla que lo va a leer', () => {
    for (const c of clipsDeBriefing(briefing)) {
      expect(['titulo', 'bienvenida', 'conceptos', 'mision', 'aplicaciones']).toContain(c.bloque);
    }
  });

  it('un briefing vacío no produce clips en vez de producir clips vacíos', () => {
    expect(clipsDeBriefing({})).toEqual([]);
  });

  it('el rótulo de un concepto se dice como rótulo y su misión como orden', () => {
    const clips = clipsDeBriefing(briefing);
    expect(clips.find((c) => c.clave === 'concepto-0-0')?.papel).toBe('rotulo');
    expect(clips.find((c) => c.clave === 'mision-0-0')?.papel).toBe('orden');
  });
});

describe('el manifiesto no miente', () => {
  const hayAudio = existsSync(VOZ);

  it('todo lab con voz tiene su briefing publicado', () => {
    const conVoz = leerLabsConVoz();
    for (const lab of conVoz) {
      expect(existsSync(join(BRIEFINGS, `${lab}.json`))).toBe(true);
    }
  });

  /* Esta es la que de verdad importa, y sólo puede correr donde estén los MP3:
     están fuera de git a propósito (~300 MB de audio derivado). En CI se salta
     con el aviso puesto, no en silencio. */
  (hayAudio ? it : it.skip)('todo clip que la página va a pedir existe en disco', () => {
    const faltan: string[] = [];
    for (const lab of leerLabsConVoz()) {
      const briefing = JSON.parse(readFileSync(join(BRIEFINGS, `${lab}.json`), 'utf8'));
      for (const clip of clipsDeBriefing(briefing)) {
        const ruta = join(RAIZ, 'public', rutaVoz(lab, clip.clave));
        if (!existsSync(ruta)) faltan.push(`${lab}/${clip.clave}`);
      }
    }
    expect(faltan).toEqual([]);
  });

  it('tieneVoz responde que no para un lab que no existe', () => {
    expect(tieneVoz('no-existe-42')).toBe(false);
  });

  it('el contador coincide con la lista', () => {
    expect(LABS_CON_VOZ).toBe(leerLabsConVoz().length);
  });
});

/** La lista del manifiesto, leída del archivo generado. */
function leerLabsConVoz(): string[] {
  const fuente = readFileSync(join(RAIZ, 'src', 'lib', 'voz', 'hecha.ts'), 'utf8');
  const dentro = fuente.slice(fuente.indexOf('new Set(['), fuente.indexOf('])'));
  return [...dentro.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}
