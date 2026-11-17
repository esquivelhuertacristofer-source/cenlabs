import type { SimuladorContenido } from '@/data/simuladoresData';

const contenido: SimuladorContenido = {
    titulo: "Microscopio Virtual",
    videoUrl: "",
    mision: "Resuelve tres de los seis casos observando: mide, cuenta o identifica lo que hay en cada preparación",
    ecuacion: "d = 0,61·λ / AN  (resolución)", formulaGfx: "Aumento = ocular · objetivo",
    pasos: [
      { id: 1, text: "Elige un caso. Arrastra la imagen para mover la platina y recorre la preparación.", icon: "layers" },
      { id: 2, text: "Sube de objetivo hasta que se RESUELVA lo que buscas (a 100×, con aceite de inmersión) y afina con el micrométrico.", icon: "zoom-in" },
      { id: 3, text: "Ajusta la lámpara y el diafragma: cerrado da contraste, abierto da resolución.", icon: "sun" },
      { id: 4, text: "Mide con la regla o cuenta dentro del marco, escribe tu respuesta y pulsa «Comprobar».", icon: "camera" }
    ],
    guiaMaestro: {
      objetivo: "Manejar un microscopio de campo claro con criterio óptico y obtener datos cuantitativos de una preparación: medir con la barra de escala, contar en un campo delimitado e identificar por morfología y tinción.",
      friccion: "Cada preparación tiene su plano focal y a más aumento hay menos luz y menos profundidad de campo: el alumno debe reenfocar, subir la lámpara y, a 100×, poner aceite antes de que su dato sea válido.",
      puntosClave: [
        "Casos: agua de estanque en vivo (medir un paramecio), frotis con Plasmodium en anillo (parasitemia en el marco), Gram (bacteria predominante), mitosis en raíz de cebolla (índice mitótico), epidermis de cebolla con lugol (largo celular) y estomas (densidad por mm²).",
        "Escalas reales: eritrocito 7–8 µm; anillo de Plasmodium ≈ 2 µm; bacterias 0,6–1 µm de ancho; célula de cebolla 190–310 µm; paramecio 175–280 µm.",
        "Óptica: aumento = objetivo × ocular (10×); campo = 18 mm ÷ objetivo; resolución d = 1,22·λ/(AN objetivo + AN condensador), que con el diafragma abierto es 0,61·λ/AN; profundidad de campo = n·λ/AN².",
        "Simplificaciones declaradas: λ fija de 550 nm; preparaciones dibujadas por procedimiento (no son fotografías); los protozoarios van frenados, como con metilcelulosa; el objetivo de 100× en seco se modela con AN 0,85 y aberración esférica fija; el contraste frente al diafragma es una recta empírica; la imagen es la de la cámara (derecha, sin la inversión del ocular).",
        "El juez compara los conteos con lo que hay dentro del marco en esa posición de la platina (±15 % en el total, ±1 en lo raro) y las medidas con ±12 % (paramecio) y ±20 % (cebolla)."
      ]
    },
    conceptos: [
      { titulo: "Aumento Total", desc: "Producto del aumento del ocular por el del objetivo." },
      { titulo: "Resolución", desc: "Distancia mínima a la que dos puntos se ven separados: d = 0,61·λ/AN." },
      { titulo: "Profundidad de campo", desc: "Espesor de la preparación que se ve nítido a la vez; se desploma al subir de objetivo." },
      { titulo: "Tinción", desc: "Colorante que da contraste: Giemsa en sangre, Gram en bacterias, lugol en células vegetales." }
    ]
  };

export default contenido;
