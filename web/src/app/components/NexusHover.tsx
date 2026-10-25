"use client";
import {useState,type HTMLAttributes,type ReactNode} from "react";
type Props=HTMLAttributes<HTMLSpanElement>&{children:ReactNode;disabled?:boolean};
/** Keep layout intact without painting a full-width hover panel. */
export default function NexusHover({children,className="",disabled=false,style,...rest}:Props){
 const [active,setActive]=useState(false);
 return <span {...rest} className={`nexus-pointer-feedback block transition duration-200 ${className}`}
  style={{...style,filter:active&&!disabled?"brightness(1.12)":style?.filter}}
  onPointerEnter={()=>setActive(true)} onPointerLeave={()=>setActive(false)} onPointerCancel={()=>setActive(false)}
  onFocusCapture={()=>setActive(true)} onBlurCapture={()=>setActive(false)}>{children}</span>;
}
