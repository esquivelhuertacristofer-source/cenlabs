# 💎 CEN LABS - Diamond Snapshot v1 (2026-04-21)

Este directorio contiene una copia de seguridad íntegra de los laboratorios que han alcanzado el estado de alta fidelidad **Diamond State**. En caso de cualquier fallo o regresión, estos archivos pueden usarse para restaurar la funcionalidad completa.

## 📂 Contenido del Respaldo

### 🧬 BIO-03 (Síntesis de Proteínas)
- **Piloto**: `components/PilotoSintesisProteinas.tsx` (Controles maestros y reset).
- **Escena 3D**: `components/simuladores/bio03/Sintesis3DScene.tsx` (Holograma de cristal y proteínas sólidas).

### 🍃 BIO-04 (Fotosíntesis)
- **Piloto**: `components/PilotoFotosintesis.tsx` (3 misiones: Espectro, Distancia, Marte).
- **Escena 3D**: `components/simuladores/bio04/Fotosintesis3DScene.tsx` (Iluminación RGB reactiva y burbujas O2).

### 🧪 BIO-05 (Genética)
- **Piloto**: `components/PilotoGenetica.tsx` (Mando de hibridación y leyendas de rasgos).
- **Escena 3D**: `components/simuladores/bio05/Genetica3DScene.tsx` (Cámaras de incubación y etiquetas 3D).
- **Bitácora**: `components/bitacoras/BitacoraGenetica.tsx` (Estadísticas empíricas en tiempo real).

### ⚙️ Núcleo Lógico
- **Store**: `store/slices/biologiaSlice.ts` (Motores de cálculo de fotosíntesis y herencia mendeliana).

## 🛠️ Instrucciones de Restauración
Para volver a este estado, simplemente copia el archivo deseado desde esta carpeta y sobrescríbelo en su ubicación original en `src/`.

---
**Estado del Sistema**: Estable | **Nivel de Fidelidad**: Diamond State v5.2
