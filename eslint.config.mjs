import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
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
    },
  },
];

export default eslintConfig;
