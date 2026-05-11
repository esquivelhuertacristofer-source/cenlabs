import type { Metadata } from "next";
import Link from "next/link";
import { MoveLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | CEN Labs",
  description:
    "Aviso de privacidad integral de CEN Labs conforme a la LFPDPPP.",
};

// ── Componente auxiliar para secciones ────────────────────────────────────────
function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-[#023047] font-black text-lg mb-3 flex items-center gap-2">
        <span className="bg-[#023047] text-white text-xs font-black px-2 py-0.5 rounded-lg">
          {number}
        </span>
        {title}
      </h2>
      <div className="text-[#374151] text-sm leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] my-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#023047] text-white">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-[#374151] border-t border-[#f1f5f9]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Encabezado ── */}
      <div className="bg-[#023047] text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[#8ECAE6] hover:text-white text-xs font-bold uppercase tracking-widest transition-colors mb-6"
          >
            <MoveLeft className="w-4 h-4" /> Volver
          </Link>
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-2xl shrink-0">
              <Shield className="w-8 h-8 text-[#8ECAE6]" />
            </div>
            <div>
              <h1
                className="text-white font-black text-3xl leading-tight"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Aviso de Privacidad
              </h1>
              <p className="text-blue-100/60 text-sm mt-1">
                CEN Labs — Plataforma de Laboratorios Virtuales de Ciencias
              </p>
              <p className="text-blue-100/40 text-xs mt-2">
                Conforme a la Ley Federal de Protección de Datos Personales en
                Posesión de los Particulares (LFPDPPP) — Última actualización:{" "}
                {/* Actualizar esta fecha al publicar */}
                mayo 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Aviso simplificado */}
        <div className="bg-[#EFF9FF] border border-[#219EBC]/30 rounded-2xl p-6 mb-10">
          <p className="text-xs font-black text-[#219EBC] uppercase tracking-widest mb-2">
            Aviso Simplificado
          </p>
          <p className="text-[#023047] text-sm leading-relaxed">
            <strong>[NOMBRE DEL RESPONSABLE]</strong> recaba tu nombre, correo
            electrónico y datos de uso académico para operar CEN Labs. Tus datos{" "}
            <strong>no se venden</strong>. Se comparten únicamente con Supabase Inc. y
            Vercel Inc. como proveedores tecnológicos. Puedes ejercer tus derechos
            ARCO escribiendo a{" "}
            <a
              href="mailto:[CORREO DE PRIVACIDAD]"
              className="text-[#219EBC] hover:underline font-bold"
            >
              [CORREO DE PRIVACIDAD]
            </a>
            .
          </p>
        </div>

        {/* Secciones del aviso integral */}
        <Section number="I" title="Identidad y domicilio del Responsable">
          <p>
            <strong>[NOMBRE COMPLETO O RAZÓN SOCIAL]</strong>, con domicilio en{" "}
            <strong>[CALLE, NÚMERO, COLONIA, MUNICIPIO, ESTADO, CP]</strong>, México,
            con RFC <strong>[RFC]</strong> (en adelante, &quot;CEN Labs&quot; o el
            &quot;Responsable&quot;), es responsable del tratamiento de sus datos
            personales.
          </p>
          <p>
            Para cualquier asunto relacionado con este aviso:{" "}
            <a
              href="mailto:[CORREO DE PRIVACIDAD]"
              className="text-[#219EBC] hover:underline font-semibold"
            >
              [CORREO DE PRIVACIDAD]
            </a>
          </p>
        </Section>

        <Section number="II" title="Datos personales que se recaban">
          <p className="font-semibold text-[#023047]">Identificación y contacto</p>
          <Table
            headers={["Dato", "Cómo se obtiene"]}
            rows={[
              ["Nombre completo", "Registro directo o alta masiva por la institución"],
              ["Correo electrónico", "Registro directo o alta masiva por la institución"],
              ["Rol académico (alumno / profesor / admin)", "Asignado por administrador de la institución"],
            ]}
          />
          <p className="font-semibold text-[#023047]">Actividad académica</p>
          <Table
            headers={["Dato", "Cómo se genera"]}
            rows={[
              ["Historial de prácticas de laboratorio", "Generado al completar simuladores"],
              ["Puntuaciones y resultados", "Calculados por el motor de evaluación"],
              ["Eventos de interacción en bitácora", "Registros durante la práctica"],
              ["Duración de sesiones", "Medición automática de tiempo en tarea"],
            ]}
          />
          <p className="font-semibold text-[#023047]">Datos técnicos</p>
          <Table
            headers={["Dato", "Observación"]}
            rows={[
              ["Hash de dirección IP", "Irreversible (SHA-256 + salt privado). No es la IP directa."],
              ["Progreso en localStorage", "Almacenado en el navegador del usuario. Solo se transmite al enviar resultados."],
            ]}
          />
          <p className="text-[#219EBC] font-semibold text-xs">
            CEN Labs no recaba datos sensibles (salud, religión, biometría, origen étnico, etc.).
          </p>
        </Section>

        <Section number="III" title="Finalidades del tratamiento">
          <p className="font-semibold text-[#023047]">Finalidades primarias (necesarias para el servicio)</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Autenticación y control de acceso a la plataforma</li>
            <li>Seguimiento del progreso académico del alumno</li>
            <li>Generación de reportes para el docente</li>
            <li>Seguridad y prevención de uso indebido</li>
            <li>Soporte técnico ante incidencias</li>
          </ul>
          <p className="font-semibold text-[#023047] mt-4">Finalidades secundarias (puede oponerse)</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mejora del contenido de simuladores mediante análisis agregado y anonimizado</li>
            <li>Elaboración de estadísticas educativas sin identificar usuarios individuales</li>
          </ul>
          <p className="text-[#64748b] text-xs mt-2">
            Para oponerse a finalidades secundarias, envíe un correo a{" "}
            <a href="mailto:[CORREO DE PRIVACIDAD]" className="text-[#219EBC] hover:underline">
              [CORREO DE PRIVACIDAD]
            </a>{" "}
            con el asunto &quot;Oposición a finalidades secundarias&quot;. No afecta el acceso al servicio.
          </p>
        </Section>

        <Section number="IV" title="Tratamiento de datos de menores de edad">
          <p>
            CEN Labs reconoce que la plataforma puede ser utilizada por estudiantes
            de preparatoria que sean menores de edad. Los datos de alumnos se recaban
            dentro del marco de la relación entre CEN Labs y la{" "}
            <strong>institución educativa contratante</strong>, la cual actúa como
            responsable del consentimiento de sus estudiantes.
          </p>
          <p>
            Al contratar el servicio, la institución declara haber obtenido las
            autorizaciones necesarias, incluyendo el consentimiento de padres o
            tutores cuando el alumno sea menor de edad.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#64748b]">
            <li>Los datos de menores se tratan con el estándar de protección más alto</li>
            <li>No se usan para elaborar perfiles conductuales ni con fines publicitarios</li>
            <li>El acceso está restringido al docente asignado y al administrador institucional</li>
          </ul>
        </Section>

        <Section number="V" title="Transferencias de datos personales">
          <p>
            CEN Labs comparte datos con los siguientes <strong>encargados del tratamiento</strong>,
            que procesan datos a nombre de CEN Labs exclusivamente para operar la plataforma:
          </p>
          <Table
            headers={["Proveedor", "País", "Finalidad"]}
            rows={[
              ["Supabase Inc.", "Estados Unidos", "Base de datos y autenticación"],
              ["Vercel Inc.", "Estados Unidos", "Hospedaje y operación de la plataforma"],
            ]}
          />
          <p className="text-[#219EBC] font-semibold text-xs">
            Sus datos no se venden, no se ceden a terceros con fines comerciales
            y no se usan para entrenar modelos de inteligencia artificial de terceros.
          </p>
        </Section>

        <Section number="VI" title="Derechos ARCO — Cómo ejercerlos">
          <p>
            Tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse</strong> al
            tratamiento de sus datos personales.
          </p>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-1 text-xs">
            <p>Envíe su solicitud a:{" "}
              <a href="mailto:[CORREO DE PRIVACIDAD]" className="text-[#219EBC] font-bold hover:underline">
                [CORREO DE PRIVACIDAD]
              </a>
            </p>
            <p>Incluya: nombre completo, correo registrado, derecho que desea ejercer,
              copia de identificación oficial vigente.</p>
            <p>Plazo de respuesta: <strong>20 días hábiles</strong> desde la recepción completa.</p>
            <p>El ejercicio es <strong>gratuito</strong>.</p>
          </div>
        </Section>

        <Section number="VII" title="Cookies y tecnologías de rastreo">
          <p>
            Usamos <strong>cookies de sesión HttpOnly</strong> gestionadas por Supabase
            para mantener el inicio de sesión de forma segura. No pueden desactivarse
            sin impedir el funcionamiento del login.
          </p>
          <p>
            El progreso del simulador se guarda en <strong>localStorage</strong> del
            navegador (clave: <code className="bg-[#f1f5f9] px-1.5 py-0.5 rounded text-[#0f172a] font-mono text-xs">cen-sim-v10</code>).
            Puede eliminarlo borrando los datos del sitio desde su navegador.
          </p>
          <p className="text-[#64748b] text-xs">
            No usamos cookies publicitarias ni de seguimiento entre sitios.
          </p>
        </Section>

        <Section number="VIII" title="Conservación de los datos">
          <Table
            headers={["Categoría", "Período"]}
            rows={[
              ["Datos de cuenta activa", "Durante la vigencia del contrato institucional"],
              ["Historial académico", "Hasta 2 años tras la baja, salvo cancelación anticipada"],
              ["Datos técnicos (IP hash, logs)", "Hasta 90 días"],
              ["Progreso en localStorage", "Hasta que el usuario limpie su navegador"],
            ]}
          />
        </Section>

        <Section number="IX" title="Cambios a este Aviso">
          <p>
            Podemos modificar este Aviso en cualquier momento. Ante cambios sustanciales,
            lo notificaremos mediante un aviso al iniciar sesión y por correo electrónico.
            La versión vigente siempre estará disponible en esta página.
          </p>
        </Section>

        <Section number="X" title="Autoridad supervisora">
          <p>
            Si considera que sus derechos han sido vulnerados, puede presentar una
            queja ante el{" "}
            <strong>
              Instituto Nacional de Transparencia, Acceso a la Información y
              Protección de Datos Personales (INAI)
            </strong>
            :{" "}
            <a
              href="https://www.inai.org.mx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#219EBC] hover:underline"
            >
              www.inai.org.mx
            </a>{" "}
            · Tel. 800 835 4324
          </p>
        </Section>

        {/* Pie */}
        <div className="border-t border-[#e2e8f0] pt-6 text-xs text-[#94a3b8] text-center">
          <p>
            Aviso elaborado conforme a la LFPDPPP (DOF 05-07-2010) y su Reglamento (DOF 21-12-2011).
          </p>
          <p className="mt-1">
            Versión 1.0 — Mayo 2026 ·{" "}
            <Link href="/login" className="text-[#219EBC] hover:underline">
              Volver a CEN Labs
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
