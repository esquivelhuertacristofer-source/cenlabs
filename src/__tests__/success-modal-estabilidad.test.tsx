import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import SuccessModal from '@/components/simulador/SuccessModal';
import {useSimuladorStore} from '@/store/simuladorStore';
jest.mock('next/navigation',()=>({useRouter:()=>({push:jest.fn()})}));
jest.mock('framer-motion',()=>{const React=jest.requireActual('react');return {motion:{div:({children}:{children:React.ReactNode})=>React.createElement('div',null,children)}};});
(globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
it.each([['fisica-13','Revisar Bitácora'],['matematicas-4','Seguir']])('%s conserva el botón y su foco al avanzar el temporizador',(id,label)=>{
 const close=jest.fn(),container=document.createElement('div');document.body.append(container);const root=createRoot(container);
 try{act(()=>root.render(<SuccessModal normalizedId={id} data={{titulo:'Laboratorio'}} hubPath="/alumno/laboratorio/fisica" resetPractica={jest.fn()} onClose={close}/>));
 const find=()=>[...container.querySelectorAll('button')].find(b=>b.textContent===label)!,button=find();expect(button).toBeDefined();button.focus();
 act(()=>useSimuladorStore.setState(s=>({timer:s.timer+1})));
 expect(find()).toBe(button);expect(document.activeElement).toBe(button);act(()=>button.click());expect(close).toHaveBeenCalledTimes(1);
 }finally{act(()=>root.unmount());container.remove();}
});
