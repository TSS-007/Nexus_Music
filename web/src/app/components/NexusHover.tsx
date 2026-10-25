"use client";
import {useState,type CSSProperties,type HTMLAttributes,type ReactNode} from "react";
type Props=HTMLAttributes<HTMLSpanElement>&{children:ReactNode;className?:string;disabled?:boolean};
/** Pointer events work with iPadOS trackpads even when Safari reports hover:none. */
export default function NexusHover({children,className="",disabled=false,...rest}:Props){
 const [active,setActive]=useState(false);
 const style:CSSProperties=active&&!disabled?{
  backgroundColor:"rgba(139,92,246,.26)",
  color:"#fff",
  boxShadow:"inset 0 0 0 1px rgba(196,181,253,.5),0 0 22px rgba(139,92,246,.28)",
  borderRadius:"inherit",
  filter:"brightness(1.12)",
 }: {};
 return <span {...rest} className={`nexus-pointer-feedback block rounded-xl transition duration-200 ${className}`} style={style}
  onPointerEnter={()=>setActive(true)} onPointerLeave={()=>setActive(false)} onPointerCancel={()=>setActive(false)}
  onFocusCapture={()=>setActive(true)} onBlurCapture={()=>setActive(false)}>{children}</span>;
}
