"use client";

import Link from "next/link";

interface PrivacyConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Checkbox de consentimiento del aviso de privacidad.
 * Requerido por LFPDPPP para la primera sesión de cada usuario.
 * Integrar en el formulario de login o en una pantalla de bienvenida inicial.
 */
export default function PrivacyConsentCheckbox({
  checked,
  onChange,
}: PrivacyConsentCheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center
            ${checked
              ? "bg-[#219EBC] border-[#219EBC]"
              : "bg-white border-gray-200 group-hover:border-[#219EBC]/50"
            }`}
        >
          {checked && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-[11px] text-gray-400 leading-relaxed font-medium">
        He leído y acepto el{" "}
        <Link
          href="/privacidad"
          target="_blank"
          className="text-[#219EBC] hover:text-[#023047] font-bold underline underline-offset-2 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Aviso de Privacidad
        </Link>
        {" "}de CEN Labs. Entiendo que mis datos se usan para operar la plataforma educativa.
      </span>
    </label>
  );
}
