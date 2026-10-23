"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, MessageCircle, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import type { Product } from "../../storefront";
import { money } from "../../storefront";

const WA="2348144645205";

export default function ProductPage(){
  const {id}=useParams<{id:string}>();const [product,setProduct]=useState<Product|null>(null);const [loading,setLoading]=useState(true);const [active,setActive]=useState(0);const [quantity,setQuantity]=useState(1);const [added,setAdded]=useState(false);
  useEffect(()=>{fetch("/api/products").then(r=>r.json() as Promise<{products?:Product[]}>).then(d=>setProduct((d.products??[]).find(p=>String(p.id)===id)??null)).finally(()=>setLoading(false))},[id]);
  function add(){if(!product)return;let cart:Record<number,number>={};try{cart=JSON.parse(localStorage.getItem("mth-cart")||"{}")}catch{}cart[product.id]=(cart[product.id]||0)+quantity;localStorage.setItem("mth-cart",JSON.stringify(cart));setAdded(true)}
  if(loading)return <main className="product-status">Loading product…</main>;if(!product)return <main className="product-status"><h1>Product not found</h1><a href="/"><ArrowLeft/>Back to shop</a></main>;
  const message=`Hello Mayor Tech Hub 👋\n\nI am interested in:\n${quantity} × ${product.name}\nPrice: ${money(product.price*quantity)}\n\nPlease confirm availability and delivery.`;
  return <><div className="top-strip">Trusted gadgets • Easy WhatsApp ordering • Nationwide delivery</div><header className="detail-header"><a href="/"><img src="/mayor-logo.png" alt="Mayor Tech Hub"/></a><a href="/"><ArrowLeft/>Back to shop</a><a className="detail-contact" href={`https://wa.me/${WA}`}><MessageCircle/>Contact us</a></header><main className="product-detail"><section className="gallery"><div className="gallery-main"><img src={product.images[active]||product.imageUrl||""} alt={`${product.name} view ${active+1}`}/></div>{product.images.length>1&&<div className="gallery-thumbs">{product.images.map((image,index)=><button key={image} className={active===index?"active":""} onClick={()=>setActive(index)}><img src={image} alt={`${product.name} thumbnail ${index+1}`}/></button>)}</div>}</section><section className="product-info"><span className="detail-category">{product.category}</span><h1>{product.name}</h1><div className="detail-meta"><span><Check/> {product.condition}</span><span>{product.stock} available</span></div><div className="detail-price"><strong>{money(product.price)}</strong>{product.oldPrice?<del>{money(product.oldPrice)}</del>:null}</div><div className="detail-specs"><h2>Specifications & details</h2><p>{product.description||"A quality gadget selected by Mayor Tech Hub. Contact us for more information."}</p></div><div className="buy-row"><div className="detail-quantity"><button onClick={()=>setQuantity(q=>Math.max(1,q-1))}><Minus/></button><b>{quantity}</b><button onClick={()=>setQuantity(q=>Math.min(product.stock,q+1))}><Plus/></button></div><button className="add-big" disabled={!product.inStock||product.stock<1} onClick={add}><ShoppingCart/>{added?"Added to cart":"Add to cart"}</button></div><a className="whatsapp-buy" href={`https://wa.me/${WA}?text=${encodeURIComponent(message)}`} target="_blank"><MessageCircle/>Order this product on WhatsApp</a><div className="detail-trust"><span><ShieldCheck/><b>Quality checked</b></span><span><Truck/><b>Delivery available</b></span></div></section></main></>;
}
