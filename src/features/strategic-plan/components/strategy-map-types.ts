export type EstadoObjetivo = "cumplido" | "en-proceso" | "no-cumplido"

export interface ObjetivoEstrategico {
  id: string
  nombre: string
  estado: EstadoObjetivo
  perspectiva: "financiera" | "cliente" | "procesos" | "persona"
  padreId?: string
}
