// Tipado mínimo de la API de D1 que usa el piloto (sin depender de @cloudflare/workers-types).
interface D1Result<T = Record<string, unknown>> {
  results: T[]
  success: boolean
  meta: { rows_read?: number; rows_written?: number; duration?: number; [k: string]: unknown }
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(col?: string): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(sql: string): Promise<unknown>
}
