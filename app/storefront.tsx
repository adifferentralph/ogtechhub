"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight, Gamepad2, Headphones, Laptop, Menu, Minus, Plus, Search, ShieldCheck, ShoppingCart, Smartphone, Truck, Watch, X, Zap } from "lucide-react";

export type Product = { id:number; name:string; category:string; description:string; price:number; oldPrice:number|null; stock:number; condition:string; images:string[]; imageUrl:string|null; emoji:string; inStock:boolean };
type Cart = Record<number, number>;
const WA = "2348144645205";
export const money = (value:number) => `₦${value.toLocaleString("en-NG")}`;
const CATEGORY_ITEMS = [
  ["Phones & Tablets", Smartphone], ["Laptops & Computers", Laptop], ["Smart Watches", Watch],
  ["Power Banks", Zap], ["Chargers & Cables", Zap], ["Audio & Music", Headphones], ["Gaming", Gamepad2], ["Accessories", Menu],
] as const;

export default function Storefront() {
  const [products,setProducts]=useState<Product[]>([]); const [loading,setLoading]=useState(true); const [query,setQuery]=useState("");
  const [category,setCategory]=useState("All"); const [cart,setCart]=useState<Cart>({}); const [cartOpen,setCartOpen]=useState(false); const [toast,setToast]=useState(""); const [error,setError]=useState("");
  useEffect(()=>{ fetch("/api/products").then(r=>r.json() as Promise<{products?:Product[]}>).then(d=>setProducts(d.products??[])).finally(()=>setLoading(false)); try{setCart(JSON.parse(localStorage.getItem("mth-cart")||"{}"))}catch{} },[]);
  useEffect(()=>{localStorage.setItem("mth-cart",JSON.stringify(cart))},[cart]);
  const visible=useMemo(()=>products.filter(p=>(category==="All"||p.category===category)&&`${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())),[products,category,query]);
  const lines=products.filter(p=>cart[p.id]); const count=Object.values(cart).reduce((a,b)=>a+b,0); const total=lines.reduce((s,p)=>s+p.price*cart[p.id],0);
  const add=(id:number)=>{setCart(c=>({...c,[id]:(c[id]||0)+1}));setToast("Added to cart");window.setTimeout(()=>setToast(""),1600)};
  const change=(id:number,d:number)=>setCart(c=>{const n={...c,[id]:(c[id]||0)+d};if(n[id]<=0)delete n[id];return n});
  const checkout=(form:FormData)=>{const name=String(form.get("name")||"").trim(),location=String(form.get("location")||"").trim(),phone=String(form.get("phone")||"").trim();if(!lines.length||!name||!location){setError("Enter your name and delivery location.");return}const items=lines.map(p=>`• ${cart[p.id]} × ${p.name} — ${money(p.price*cart[p.id])}`).join("\n");window.open(`https://wa.me/${WA}?text=${encodeURIComponent(`Hello Mayor Tech Hub 👋\n\nI would like to order:\n${items}\n\nTotal: ${money(total)}\nName: ${name}\nPhone: ${phone||"Not provided"}\nDelivery location: ${location}\n\nPlease confirm availability and delivery.`)}`,"_blank","noopener,noreferrer")};

  return <>
    <div className="top-strip">Trusted gadgets • Easy WhatsApp ordering • Nationwide delivery</div>
    <header className="commerce-header">
      <a className="commerce-logo" href="#top"><img src="/mayor-logo.png" alt="Mayor Tech Hub"/></a>
      <label className="header-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search phones, laptops, watches and gadgets"/><a href="#shop">Search</a></label>
      <button className="header-cart" onClick={()=>setCartOpen(true)}><ShoppingCart/><span>Cart</span><b>{count}</b></button>
    </header>
    <nav className="commerce-nav"><a href="#top">Home</a><a href="#shop">Shop</a><a href="#categories">Categories</a><a href="#services">Swap & inspection</a><a href={`https://wa.me/${WA}`} target="_blank">Contact</a></nav>

    <main id="top" className="store-main">
      <section className="hero-layout">
        <aside className="category-sidebar" id="categories"><h3>Shop categories</h3>{CATEGORY_ITEMS.map(([label,Icon])=><button key={label} onClick={()=>{setCategory(label);location.hash="shop"}}><Icon/><span>{label}</span><ChevronRight/></button>)}</aside>
        <div className="commerce-hero">
          <img src="/hero-gadgets.png" alt="A collection of premium phones, audio accessories and smart gadgets"/>
          <div className="commerce-hero-copy"><span>PREMIUM TECH. BETTER PRICES.</span><h1>Your next gadget<br/>starts here.</h1><p>Shop phones, laptops, gaming gear and everyday accessories—all in one trusted place.</p><a href="#shop">Shop gadgets <ArrowRight/></a></div>
        </div>
        <aside className="promo-stack"><div className="promo-card bright"><small>DEVICE SWAP</small><h3>Ready for an upgrade?</h3><p>Trade in your current device.</p><a href="#services">Book a swap <ArrowRight/></a></div><div className="promo-card dark"><small>NEED HELP?</small><h3>Talk to a real person.</h3><p>Get quick advice on WhatsApp.</p><a href={`https://wa.me/${WA}`} target="_blank">Chat now <ArrowRight/></a></div></aside>
      </section>

      <section className="trust-strip"><div><Truck/><span><b>Fast delivery</b><small>Available nationwide</small></span></div><div><ShieldCheck/><span><b>Quality checked</b><small>Carefully selected gadgets</small></span></div><div><Check/><span><b>Simple checkout</b><small>Order directly on WhatsApp</small></span></div><div><Headphones/><span><b>Human support</b><small>We are here to help</small></span></div></section>

      <section className="catalog" id="shop">
        <div className="catalog-head"><div><span>OUR COLLECTION</span><h2>Latest phones & gadgets</h2><p>Browse what is available right now.</p></div><label className="mobile-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search gadgets"/></label></div>
        <div className="filter-row"><button className={category==="All"?"active":""} onClick={()=>setCategory("All")}>All products</button>{CATEGORY_ITEMS.map(([label])=><button key={label} className={category===label?"active":""} onClick={()=>setCategory(label)}>{label}</button>)}</div>
        {loading?<div className="catalog-empty">Loading products…</div>:visible.length?<div className="commerce-grid">{visible.map(p=><article className="commerce-card" key={p.id}>
          <a className="card-image" href={`/product/${p.id}`}>{p.imageUrl?<img src={p.imageUrl} alt={p.name}/>:<span>{p.emoji}</span>}{p.oldPrice&&p.oldPrice>p.price?<b>-{Math.round((1-p.price/p.oldPrice)*100)}%</b>:null}</a>
          <div className="card-copy"><small>{p.category}</small><a href={`/product/${p.id}`}><h3>{p.name}</h3></a><p className="condition">{p.condition} · {p.stock} available</p><div className="card-prices"><strong>{money(p.price)}</strong>{p.oldPrice?<del>{money(p.oldPrice)}</del>:null}</div><div className="card-actions"><a href={`/product/${p.id}`}>View details</a><button disabled={!p.inStock||p.stock<1} onClick={()=>add(p.id)}>{p.inStock&&p.stock>0?"Add to cart":"Out of stock"}</button></div></div>
        </article>)}</div>:<div className="catalog-empty"><Smartphone/><h3>{query||category!=="All"?"No matching products":"New gadgets are coming soon"}</h3><p>{query||category!=="All"?"Try another search or category.":"Check back shortly, or message us on WhatsApp for what you need."}</p></div>}
      </section>

      <section className="service-banner" id="services"><div><span>SWAP OR INSPECT</span><h2>Make your next upgrade with confidence.</h2><p>Tell us what you own and what you want. We will continue on WhatsApp.</p></div><a href={`https://wa.me/${WA}?text=${encodeURIComponent("Hello Mayor Tech Hub 👋 I would like to book a device swap or inspection.")}`} target="_blank">Book on WhatsApp <ArrowRight/></a></section>
    </main>
    <footer className="store-footer"><img src="/mayor-logo.png" alt="Mayor Tech Hub"/><p>Phones, gadgets and accessories that simply impress.</p><a href={`https://wa.me/${WA}`}>0814 464 5205</a><span>© {new Date().getFullYear()} Mayor Tech Hub</span></footer>

    {toast&&<div className="toast"><Check/>{toast}</div>}<div className={`scrim ${cartOpen?"show":""}`} onClick={()=>setCartOpen(false)}/>
    <aside className={`cart-drawer ${cartOpen?"show":""}`}><div className="cart-head"><div><small>YOUR CART</small><h2>{count} item{count===1?"":"s"}</h2></div><button onClick={()=>setCartOpen(false)} aria-label="Close cart"><X/></button></div><div className="cart-lines">{lines.length?lines.map(p=><div className="cart-line" key={p.id}><div className="mini-image">{p.imageUrl?<img src={p.imageUrl} alt=""/>:<span>{p.emoji}</span>}</div><div><b>{p.name}</b><span>{money(p.price)}</span><div className="quantity"><button onClick={()=>change(p.id,-1)}><Minus/></button><strong>{cart[p.id]}</strong><button onClick={()=>change(p.id,1)}><Plus/></button></div></div></div>):<div className="cart-empty"><ShoppingCart/><h3>Your cart is empty</h3><p>Add a gadget to get started.</p></div>}</div><form className="cart-checkout" action={checkout}><div className="cart-total"><span>Total</span><b>{money(total)}</b></div><label>Name<input name="name" placeholder="Your name"/></label><label>Phone<input name="phone" type="tel" placeholder="0800 000 0000"/></label><label>Delivery location<textarea name="location" rows={2} placeholder="City and area"/></label>{error&&<p className="form-error">{error}</p>}<button className="checkout-button" disabled={!lines.length}>Checkout on WhatsApp <ArrowRight/></button><small>No signup or online payment required.</small></form></aside>
  </>;
}
