import {THREE} from './kit';
import {refinarEscena} from './refinamientos';
import {montarEquipo} from './montajes';
import type {EscenaConstruida} from './kit';
import {uvvis,difraccion,curado} from './quimica';
import {fotoelasticidad,fotoelectrico} from './fisica';
import {bezier,capacidad} from './matematicas';
import {tunel,prepararTunel} from './fluidos';
import {prepararProteina,enzimas,atp} from './biologia';
import {cuerda as ondas_cuerda,interferencia as ondas_interferencia,fibra as ondas_fibra,acustica as ondas_acustica} from './ondas';
import {conduccion as termica_conduccion,solar as termica_solar,golpe as termica_golpe,capilaridad as termica_capilaridad} from './termica';
import {espectrometro as campos_espectrometro,hall as campos_hall,giroscopio as campos_giroscopio} from './campos';
import {hplc as instrumentos_hplc,ftir as instrumentos_ftir} from './instrumentos';
import {corrosion as reactores_corrosion,deposito as reactores_deposito,electrolisis as reactores_electrolisis,reactor as reactores_reactor,calorimetria as reactores_calorimetria,precipitacion as reactores_precipitacion,floculacion as reactores_floculacion,adsorcion as reactores_adsorcion,aleacion as reactores_aleacion} from './reactores';
import {vectores as diseno_vectores,programacion as diseno_programacion,regresion as diseno_regresion,tolerancias as diseno_tolerancias,gradiente as diseno_gradiente,integral as diseno_integral,numericos as diseno_numericos} from './diseno';
import {muestreo as calidad_muestreo,weibull as calidad_weibull,bayes as calidad_bayes} from './calidad';
import {pcr as biotecnologia_pcr,gel as biotecnologia_gel,bioreactor as biotecnologia_bioreactor,asepsia as biotecnologia_asepsia} from './biotecnologia';
import {pulmon as biomecanica_pulmon,hemodinamica as biomecanica_hemodinamica,sarcomero as biomecanica_sarcomero,ecotoxicologia as biomecanica_ecotoxicologia} from './biomecanica';
const factories:Record<string,()=>EscenaConstruida>={'fisica-11':ondas_cuerda,'fisica-12':ondas_interferencia,'fisica-14':ondas_fibra,'fisica-15':ondas_acustica,'fisica-16':termica_conduccion,'fisica-17':termica_solar,'fisica-19':termica_golpe,'fisica-20':termica_capilaridad,'fisica-21':campos_espectrometro,'fisica-22':campos_hall,'fisica-24':campos_giroscopio,'quimica-12':instrumentos_hplc,'quimica-13':instrumentos_ftir,'quimica-14':reactores_corrosion,'quimica-15':reactores_deposito,'quimica-16':reactores_electrolisis,'quimica-17':reactores_reactor,'quimica-18':reactores_calorimetria,'quimica-21':reactores_precipitacion,'quimica-22':reactores_floculacion,'quimica-23':reactores_adsorcion,'quimica-24':reactores_aleacion,'matematicas-11':diseno_vectores,'matematicas-13':diseno_programacion,'matematicas-14':diseno_regresion,'matematicas-18':diseno_tolerancias,'matematicas-19':diseno_gradiente,'matematicas-20':diseno_integral,'matematicas-21':diseno_numericos,'matematicas-16':calidad_muestreo,'matematicas-17':calidad_weibull,'matematicas-22':calidad_bayes,'biologia-13':biotecnologia_pcr,'biologia-14':biotecnologia_gel,'biologia-15':biotecnologia_bioreactor,'biologia-20':biotecnologia_asepsia,'biologia-16':biomecanica_pulmon,'biologia-17':biomecanica_hemodinamica,'biologia-18':biomecanica_sarcomero,'biologia-19':biomecanica_ecotoxicologia,'quimica-11':uvvis,'quimica-19':difraccion,'quimica-20':curado,'fisica-13':fotoelasticidad,'fisica-18':tunel,'fisica-23':fotoelectrico,'matematicas-12':bezier,'matematicas-15':capacidad,'biologia-11':enzimas,'biologia-12':atp};
export function createScene(id:string){if(!factories[id])throw Error('Escena científica no registrada: '+id);const scene=factories[id](),base=scene.update,detail=refinarEscena(id,scene),assembly=montarEquipo(id,scene);if(scene.probe)scene.root.traverse(o=>{if((o instanceof THREE.Mesh||o instanceof THREE.Line)&&o.name!=='campo-velocidad-lbm')o.raycast=()=>{};});scene.update=(v,p,t)=>{base(v,p,t);detail(v,p,t);assembly();};return scene;}
export async function prepararEscena(id:string){await Promise.all([prepararProteina(id),prepararTunel(id)]);}
