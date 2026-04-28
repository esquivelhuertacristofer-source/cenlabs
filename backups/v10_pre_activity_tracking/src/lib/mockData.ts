// Mock data for the CEN Labs Teacher Dashboard - Aligned with Master Context

export const performanceData = [
  { day: "Lun", hours: 1.2 },
  { day: "Mar", hours: 2.1 },
  { day: "Mié", hours: 3.5 },
  { day: "Jue", hours: 3.8 },
  { day: "Vie", hours: 2.9 },
  { day: "Sáb", hours: 1.5 },
  { day: "Dom", hours: 0.8 },
];

export const labProgress = [
  { name: "Física", description: "Práctica 9 de 10", progress: 91, color: "#FB8500" },
  { name: "Química", description: "Práctica 4 de 10", progress: 75, color: "#8ECAE6" },
  { name: "Biología", description: "Práctica 2 de 10", progress: 25, color: "#219EBC" },
  { name: "Matemáticas", description: "Práctica 5 de 10", progress: 97, color: "#FFB703" },
];

export type PracticeStatus = "en_progreso" | "completada";

export interface PracticeRecord {
  id: string;
  name: string;
  subject: string;
  status: PracticeStatus | "pendiente";
  score: number | null;
  timeSeconds: number;
  failedAttempts: number;
  hintsUsed: number;
}

const generatePractices = (subject: string): PracticeRecord[] => [
  { 
    id: `p1-${subject}`, 
    name: `Práctica 1 de ${subject}`, 
    subject, 
    status: "completada", 
    score: 9.5,
    timeSeconds: 1240,
    failedAttempts: 1,
    hintsUsed: 2
  },
  { 
    id: `p2-${subject}`, 
    name: `Práctica 2 de ${subject}`, 
    subject, 
    status: "completada", 
    score: 10,
    timeSeconds: 980,
    failedAttempts: 0,
    hintsUsed: 0
  },
  { 
    id: `p3-${subject}`, 
    name: `Práctica 3 de ${subject}`, 
    subject, 
    status: "en_progreso", 
    score: null,
    timeSeconds: 450,
    failedAttempts: 3,
    hintsUsed: 4
  },
  { 
    id: `p4-${subject}`, 
    name: `Práctica 4 de ${subject}`, 
    subject, 
    status: "pendiente", 
    score: null,
    timeSeconds: 0,
    failedAttempts: 0,
    hintsUsed: 0
  },
];

export const students = [
  { 
    id: "1",
    name: "María González", 
    group: "3a",
    score: 9.6, 
    initials: "MG", 
    color: "bg-[#FB8500]",
    email: "maria.gonzalez@cenlabs.com",
    lastActivity: "Hace 10 min",
    stats: [
      { subject: "Química", value: 95 },
      { subject: "Física", value: 88 },
      { subject: "Biología", value: 92 },
      { subject: "Matemáticas", value: 98 },
      { subject: "Práctica", value: 96 },
      { subject: "Teoría", value: 90 },
    ],
    practices: [
        ...generatePractices("Física"),
        ...generatePractices("Química").slice(0, 2),
    ]
  },
  { 
    id: "2",
    name: "Carlos Ramírez", 
    group: "1b",
    score: 9.1, 
    initials: "CR", 
    color: "bg-[#219EBC]",
    email: "carlos.ramirez@cenlabs.com",
    lastActivity: "Hace 25 min",
    stats: [
      { subject: "Química", value: 92 },
      { subject: "Física", value: 95 },
      { subject: "Biología", value: 85 },
      { subject: "Matemáticas", value: 88 },
      { subject: "Práctica", value: 94 },
      { subject: "Teoría", value: 82 },
    ],
    practices: [
        ...generatePractices("Química"),
        ...generatePractices("Física").slice(0, 3)
    ]
  },
  { 
    id: "3",
    name: "Ana López", 
    group: "3a",
    score: 8.5, 
    initials: "AL", 
    color: "bg-[#8ECAE6]",
    email: "ana.lopez@cenlabs.com",
    lastActivity: "Hace 1 hora",
    stats: [
      { subject: "Química", value: 85 },
      { subject: "Física", value: 82 },
      { subject: "Biología", value: 90 },
      { subject: "Matemáticas", value: 85 },
      { subject: "Práctica", value: 88 },
      { subject: "Teoría", value: 92 },
    ],
    practices: [
        ...generatePractices("Biología"),
    ]
  },
  { 
    id: "4",
    name: "Diego Torres", 
    group: "5c",
    score: 7.9, 
    initials: "DT", 
    color: "bg-[#FFB703]",
    email: "diego.torres@cenlabs.com",
    lastActivity: "Hace 3 horas",
    stats: [
      { subject: "Química", value: 78 },
      { subject: "Física", value: 80 },
      { subject: "Biología", value: 82 },
      { subject: "Matemáticas", value: 75 },
      { subject: "Práctica", value: 85 },
      { subject: "Teoría", value: 70 },
    ],
    practices: [
        ...generatePractices("Matemáticas"),
    ]
  },
];

export const topAlumnos = [
  { name: "María González", score: 9.6, initials: "MG", color: "bg-[#FB8500]" },
  { name: "Carlos Ramírez", score: 9.1, initials: "CR", color: "bg-[#219EBC]" },
  { name: "Ana López", score: 8.5, initials: "AL", color: "bg-[#8ECAE6]" },
];

export const latestDeliveries = [
  {
    initials: "MG",
    color: "bg-[#FB8500]",
    name: "María González",
    time: "Hace 10 min",
    text: "Completó Práctica 4 de Física",
  },
  {
    initials: "CR",
    color: "bg-[#219EBC]",
    name: "Carlos Ramírez",
    time: "Hace 25 min",
    text: "Envió reporte de Química Orgánica",
  },
];

export const upcomingActivities = [
  {
    day: 8,
    title: "Cierre de Práctica 3 de Física",
    date: "8 de Abril 2026",
    time: "11:59 P.M.",
    location: "Laboratorio Virtual de Mecánica",
    subject: "Física",
  },
  {
    day: 13,
    title: "Entrega Práctica de Química",
    date: "13 de Abril 2026",
    time: "8:00 P.M.",
    location: "Plataforma CEN",
    subject: "Química",
  },
];

export const metricCards = [
  {
    title: "Alumnos Activos",
    value: "142",
    change: "+12%",
    isPositive: true,
  },
  {
    title: "Grupos Asignados",
    value: "4",
    suffix: " Activos",
    change: "Sin cambios",
    isPositive: true,
  },
  {
    title: "Prácticas Completadas",
    value: "89",
    change: "+8%",
    isPositive: true,
  },
];

export const groups = [
  { label: "Todos los Grupos", value: "all" },
  { label: "3ro Prepa - A", value: "3a" },
  { label: "1er Semestre - B", value: "1b" },
  { label: "5to Semestre - C", value: "5c" },
];

export const laboratories = [
  {
    id: "l1",
    name: "Laboratorio de Mecánica",
    subject: "Física",
    image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&q=80&w=800",
    color: "text-[#FB8500]",
    bgColor: "bg-[#FB8500]/10 dark:bg-[#FB8500]/20",
    practices: 10,
    activeStudents: 45,
    description: "Explora las leyes de Newton, cinemática y dinámica en un entorno virtual controlado.",
  },
  {
    id: "l2",
    name: "Estudio de Células",
    subject: "Biología",
    image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=800",
    color: "text-[#219EBC]",
    bgColor: "bg-[#219EBC]/10 dark:bg-[#219EBC]/20",
    practices: 10,
    activeStudents: 32,
    description: "Analiza la estructura celular, mitosis y meiosis con microscopía virtual de alta resolución.",
  },
  {
    id: "l3",
    name: "Reacciones Orgánicas",
    subject: "Química",
    image: "https://images.unsplash.com/photo-1603126731702-891345414d23?auto=format&fit=crop&q=80&w=800",
    color: "text-[#8ECAE6]",
    bgColor: "bg-[#8ECAE6]/10 dark:bg-[#8ECAE6]/20",
    practices: 10,
    activeStudents: 28,
    description: "Experimenta con enlaces de carbono, grupos funcionales y síntesis orgánica sin riesgos.",
  },
  {
    id: "l4",
    name: "Geometría Descriptiva",
    subject: "Matemáticas",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
    color: "text-[#FFB703]",
    bgColor: "bg-[#FFB703]/10 dark:bg-[#FFB703]/20",
    practices: 10,
    activeStudents: 50,
    description: "Visualiza funciones, vectores y cálculo multivariable de forma interactiva y dinámica.",
  },
];

// Calendar activity dots mapping (day -> color)
export const calendarActivities: Record<number, string> = {
  8: "#FB8500",  // Física
  13: "#8ECAE6", // Química
  18: "#219EBC", // Biología
  23: "#FFB703", // Matemáticas
};

export const messages = [
  {
    initials: "MG",
    color: "bg-[#FB8500]",
    name: "María González",
    time: "Hace 5 min",
    text: "Profe, tengo una duda sobre la Práctica 4 de Física.",
    attachments: []
  },
  {
    initials: "CR",
    color: "bg-[#219EBC]",
    name: "Carlos Ramírez",
    time: "Hace 30 min",
    text: "Envié mi bitácora de Química. Por favor revísela.",
    attachments: ["bitacora_quimica_p4.pdf"]
  },
  {
    initials: "AL",
    color: "bg-[#8ECAE6]",
    name: "Ana López",
    time: "Hace 1 hora",
    text: "El simulador de Biología no me carga correctamente.",
    attachments: []
  },
];

