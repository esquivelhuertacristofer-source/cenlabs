/** Sustituye distractores decorativos por errores científicos plausibles. */
import {readdir,readFile,writeFile} from 'node:fs/promises';
const replacements={
 'Contando colores de la proteína.':'Tomando el producto final sin dividir por el intervalo de tiempo.',
 'Sólo si el rotor se muestra de color azul.':'Sí, porque el transporte de ADP y fosfato no agrega costo energético.',
 'Sí, por el color de la sangre.':'Sí, porque la presión máxima determina por sí sola el volumen eyectado.',
 'Depende sólo del color.':'Permanece máxima aunque los filamentos dejen de solaparse.',
 'La masa de la pantalla.':'La separación de las rendijas, sin influencia de su anchura individual.',
 'Sólo cambiando el color del agua.':'Sí, siempre que coincida Reynolds, aunque cambien la dimensionalidad y las fronteras.',
 'La temperatura del monitor.':'La inversa de la variación de velocidad.',
 'Mayor masa del voltímetro.':'Mayor espesor, aun manteniendo fijo el espesor especificado del ensayo.',
 'Sí, por el color del metal.':'Sí, la magnitud positiva de |VH| implica siempre portadores positivos.',
 'El color del cardán.':'Un torque paralelo a L que sólo aumenta su magnitud.',
 'El número de tornillos.':'Conservación de la dirección de L en ausencia de torque externo.',
 'El área de pantalla.':'El cuadrado de la norma de la normal.',
 'Cambiar el color del tanque.':'Redondear la solución continua sin volver a comprobar los recursos.',
 'La suma de colores.':'La suma de residuos sin elevarlos al cuadrado.',
 'Los de control los fija el color de la pieza.':'Los límites de control se obtienen siempre dividiendo las especificaciones entre dos.',
 'Sí, con color verde.':'Sí, siempre que la última iteración tenga menor costo que la anterior.',
 'Sólo el mismo número de colores.':'Sólo el mismo número de iteraciones, aunque los pasos sean diferentes.',
 'La masa del detector.':'El tiempo de elución del analito más retenido.',
 'El ancho de la pantalla.':'El tiempo total de retención de cualquier compuesto, independientemente de k.',
 'Sólo color superficial.':'Potencial aplicado, sin considerar corriente ni tiempo.',
 'La frecuencia del monitor.':'Sólo el tiempo, sin masa molar ni estado de oxidación.',
 'Sí, sólo viendo el color.':'Sí, porque toda corrosión localizada puede reemplazarse por una pérdida media.',
 'El color de las burbujas.':'La corriente por sí sola, aun con tensión fija y rendimiento ideal.',
 'El número de controles.':'La masa total de solución, manteniendo el resultado en kJ/mol.',
 'La longitud del vaso.':'La temperatura final absoluta, sin considerar los moles reaccionados.',
 'El ángulo de la pantalla del ordenador.':'El doble adicional de la lectura 2θ.',
 'Sí, por el color azul.':'Sí, porque los sólidos de magnesio no pueden coexistir con los de cobre.',
 'La masa del vaso.':'La concentración del sólido puro como un reactivo disuelto.',
 'El color del precipitado.':'Sólo la concentración inicial total, aunque cambie el pH.',
 'El tamaño de pantalla.':'La suma de concentraciones iónicas sin exponentes estequiométricos.',
 'Número de colores.':'Promediar directamente las temperaturas de solidus y liquidus.',
 'Velocidad del ratón.':'Suponer iguales las dos fracciones para cualquier composición global.',
 'La raíz del tiempo de clase.':'El tiempo de cierre al cuadrado en el límite de cierre rápido.',
 'La frecuencia del láser.':'La intensidad del láser, independientemente de λ y d.',
};
const directory=new URL('../../src/components/ciencias/definiciones/',import.meta.url);let changed=0;
for(const file of (await readdir(directory)).filter(f=>f.endsWith('.ts'))){const url=new URL(file,directory),text=await readFile(url,'utf8'),{default:d}=await import(url),{model,...data}=d;for(const q of data.quiz||[])q.opciones=q.opciones.map((o,i)=>{if(i===q.respuestaCorrecta)return o;if(d.id==='fisica-16'&&o==='Depende sólo del color.'){changed++;return 'La capa más conductora transporta mayor flujo que la otra, aun estando en serie.';}if(replacements[o]){changed++;return replacements[o];}return o;});
 const imports=text.split(/\r?\n/).filter(line=>line.startsWith('import ')).join('\n');let json=JSON.stringify(data,null,2);for(const [a,b]of [['rotorc8','rotor c8'],['PDB2XND','PDB 2XND'],['PDB1LYZ','PDB 1LYZ'],['bovino2XND','bovino 2XND'],['enzima1LYZ','enzima 1LYZ'],['yVmax','y Vmax'],['yCpk','y Cpk'],['y270°','y 270°'],['yel','y el']])json=json.split(a).join(b);
 await writeFile(url,imports+'\nconst definition:PracticaCiencia={...'+json+',model:'+model.name+'};\nexport default definition;\n');
}console.log(changed+' distractores corregidos; las respuestas correctas permanecen iguales.');
