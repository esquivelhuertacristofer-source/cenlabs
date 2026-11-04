// ESLint 9 — flat config. eslint-config-next 16 publica configuraciones planas
// nativas en ./core-web-vitals y ./typescript: se expanden directo, sin FlatCompat
// (con FlatCompat truena «Converting circular structure to JSON»). Igual que NEM.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    // public/labs/vendor: three.js de terceros, servido tal cual (47 errores ajenos).
    ignores: [".next/**", ".open-next/**", ".wrangler/**", ".export/**", "out/**", "build/**", "next-env.d.ts", "cloudflare-env.d.ts", "public/labs/vendor/**"],
  },
  ...coreWebVitals,
  ...typescript,
  {
    // ── Reglas del compilador de React (nuevas en eslint-config-next 16) ─────
    // Con Next 16 aparecieron 673 marcas (2026-11-03): immutability 326, refs 210,
    // set-state-in-effect 78, preserve-manual-memoization 24, use-memo 18, purity 11,
    // static-components 6. Describen lo que el compilador de React supone, y en Labs
    // el compilador está APAGADO (next.config: reactCompiler false), así que no cambian
    // cómo corre nada. Casi todas (465) están en los simuladores 3D, donde three.js muta
    // la escena en cada frame a propósito. Quedan como AVISO para que `lint` pueda ser
    // la puerta del despliegue (Next 16 ya no corre ESLint dentro de `next build`) sin
    // esconder la deuda. Mismo criterio que NEM.
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  {
    rules: {
      // Downgrade a warn: la base de código usa `any` extensamente en APIs de
      // Supabase, Three.js y Zustand donde el tipo exacto no está disponible.
      // Se corregirá progresivamente — no debe bloquear el build.
      "@typescript-eslint/no-explicit-any": "warn",

      // Downgrade a warn: muchos componentes 3D (Pilots, Bitacoras) tienen
      // imports declarados para documentar las dependencias del módulo aunque
      // no todos se usen en cada render path.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Downgrade a warn: los <img> en componentes Three.js/R3F no se pueden
      // reemplazar por <Image /> sin cambios de arquitectura en las escenas 3D.
      "@next/next/no-img-element": "warn",

      // Downgrade a warn: el texto educativo en español usa comillas tipográficas
      // y apóstrofos que JSX interpreta como entidades sin escapar. Escaparlos
      // manualmente añadiría ruido de &ldquo;/&rdquo; en todo el texto de lab.
      "react/no-unescaped-entities": "warn",

      // Error en producción: console.log expone datos de sesión del alumno en
      // la consola del browser. Usar console.warn/error para logs legítimos, o
      // envolver en `if (process.env.NODE_ENV === 'development')`.
      "no-console": ["error", { allow: ["warn", "error", "debug"] }],
    },
  },
  // LAST — overrides for test files (must come after the general rules block).
  {
    files: ["src/__tests__/**/*.ts", "src/__tests__/**/*.tsx"],
    rules: {
      "no-console": "off",
    },
  },
  // Scripts CLI y archivos de configuración son herramientas Node de desarrollo:
  // `console` es su salida legítima y `require()` es válido en los `.js` de config.
  // No forman parte del bundle del navegador, así que estas reglas no aplican.
  {
    files: [
      "scripts/**/*.{ts,js,mjs,mts}",
      "*.config.{js,mjs,ts}",
      "jest.config.js",
      "jest.setup.js",
    ],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
      // Los cuerpos de lab (scripts/lab-src/*.body.js) son fragmentos de template
      // compactos que se ensamblan en el HTML generado, no parte del bundle de la
      // app. Usan idiomas de efecto-lateral guardado (`cond && (obj.x=v)`) y
      // ternarios-como-sentencia (`cond ? a=x : b=y`) intencionalmente; están
      // verificados en runtime con Playwright. `no-unused-expressions` es ruido aquí.
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
];

export default eslintConfig;
