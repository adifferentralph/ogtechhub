"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Minus, Plus, Search, ShoppingBag, Smartphone, Sparkles, X } from "lucide-react";

type Product = { id: number; name: string; category: string; description: string; price: number; imageUrl: string | null; emoji: string; inStock: boolean };
type Cart = Record<number, number>;

const WA = "2348144645205";
const money = (value: number) => `₦${value.toLocaleString("en-NG")}`;

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [service, setService] = useState<"inspection" | "swap">("inspection");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((data) => setProducts(data.products ?? [])).finally(() => setLoading(false));
    try { setCart(JSON.parse(localStorage.getItem("mth-cart") || "{}")); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("mth-cart", JSON.stringify(cart)); }, [cart]);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const visible = products.filter((p) => (category === "All" || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()));
  const lines = products.filter((p) => cart[p.id]);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = lines.reduce((sum, p) => sum + p.price * cart[p.id], 0);

  function add(id: number) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    setToast("Added to your cart");
    window.setTimeout(() => setToast(""), 1500);
  }
  function change(id: number, delta: number) {
    setCart((current) => {
      const next = { ...current, [id]: (current[id] || 0) + delta };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }
  function openWhatsApp(text: string) { window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer"); }
  function checkout(form: FormData) {
    const name = String(form.get("name") || "").trim();
    const location = String(form.get("location") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    if (!lines.length || !name || !location) { setError("Add an item, then enter your name and delivery location."); return; }
    const items = lines.map((p) => `• ${cart[p.id]} × ${p.name} — ${money(p.price * cart[p.id])}`).join("\n");
    openWhatsApp(`Hello Mayor Tech Hub 👋\n\nI’d like to order:\n${items}\n\n*Total: ${money(total)}*\nName: ${name}\nPhone: ${phone || "Not provided"}\nDelivery location: ${location}\n\nPlease confirm availability and delivery.`);
  }
  function book(form: FormData) {
    const v = (key: string) => String(form.get(key) || "").trim();
    if (!v("name") || !v("phone") || !v("device") || !v("date") || !v("time") || (service === "swap" && !v("wanted"))) { setError("Please complete all required booking details."); return; }
    let text = `Hello Mayor Tech Hub 👋\n\nI’d like to book a device ${service}.\nName: ${v("name")}\nPhone: ${v("phone")}\nMy device: ${v("device")}`;
    if (service === "swap") text += `\nDevice I want: ${v("wanted")}`;
    text += `\nPreferred date: ${v("date")}\nPreferred time: ${v("time")}`;
    if (v("notes")) text += `\nNotes: ${v("notes")}`;
    openWhatsApp(text);
  }

  return <>
    <header className="site-header">
      <a className="brand" href="#top"><img src="/mayor-logo.png" alt="Mayor Tech Hub" /></a>
      <nav><a href="#shop">Shop</a><a href="#services">Services</a><a href="#about">Why us</a></nav>
      <button className="cart-pill" onClick={() => setCartOpen(true)}><ShoppingBag size={18}/><span>Cart</span><b>{count}</b></button>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={15}/> Curated tech. Real value.</p>
          <h1>Gadgets that<br/>simply <em>impress.</em></h1>
          <p className="lead">From iPhone to PS5, explore premium gadgets tailored to your lifestyle—carefully sourced and ready for you.</p>
          <div className="hero-actions"><a className="button primary" href="#shop">Shop gadgets <ArrowRight size={18}/></a><a className="button ghost" href="#services">Book a swap or inspection</a></div>
          <div className="trust-row"><span><Check/> Quality checked</span><span><Check/> WhatsApp support</span><span><Check/> Fast delivery</span></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="phone"><div className="camera"><i/><i/><i/></div><div className="phone-glow"/><span>M</span></div><div className="float-card float-a"><span>Premium picks</span><b>Quality first</b></div><div className="float-card float-b"><span>Quick ordering</span><b>Via WhatsApp</b></div></div>
      </section>

      <section className="shop-section" id="shop">
        <div className="section-head"><div><p className="kicker">THE COLLECTION</p><h2>Find your next upgrade.</h2><p>Fresh devices, fair prices, and zero guesswork.</p></div><div className="search"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search gadgets" aria-label="Search gadgets"/></div></div>
        <div className="chips">{categories.map((c)=><button key={c} className={c===category?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        {loading ? <div className="empty-state">Loading the latest gadgets…</div> : visible.length ? <div className="product-grid">{visible.map((p)=><article className="product-card" key={p.id}>
          <div className="product-photo">{p.imageUrl ? <img src={p.imageUrl} alt={p.name}/> : <span>{p.emoji || "📱"}</span>}<small>{p.inStock ? "In stock" : "Out of stock"}</small></div>
          <div className="product-body"><p>{p.category}</p><h3>{p.name}</h3><div className="desc">{p.description || "Premium device from Mayor Tech Hub."}</div><div className="product-bottom"><strong>{money(p.price)}</strong><button disabled={!p.inStock} onClick={()=>add(p.id)} aria-label={`Add ${p.name} to cart`}><Plus size={19}/></button></div></div>
        </article>)}</div> : <div className="empty-state"><Smartphone/><h3>No gadgets found</h3><p>Try another search or category.</p></div>}
      </section>

      <section className="services" id="services">
        <div className="service-copy"><p className="kicker">MORE THAN A STORE</p><h2>Inspect it. Swap it.<br/><em>Love your next device.</em></h2><p>Not ready to buy outright? Book a professional device inspection or tell us what you’d like to swap. We’ll continue with you on WhatsApp.</p><div className="service-points"><span><b>01</b> Choose a service</span><span><b>02</b> Pick a convenient time</span><span><b>03</b> Get confirmation on WhatsApp</span></div></div>
        <form className="booking-card" action={book}><div className="form-tabs"><button type="button" className={service==="inspection"?"active":""} onClick={()=>setService("inspection")}>Inspection</button><button type="button" className={service==="swap"?"active":""} onClick={()=>setService("swap")}>Device swap</button></div><div className="field-grid"><label>Name<input name="name" placeholder="Your name"/></label><label>Phone<input name="phone" type="tel" placeholder="0800 000 0000"/></label></div><label>Your device<input name="device" placeholder="e.g. iPhone 13 Pro, 128GB"/></label>{service === "swap" && <label>Device you want<input name="wanted" placeholder="e.g. iPhone 15 Pro Max"/></label>}<div className="field-grid"><label>Date<input name="date" type="date" min={new Date().toISOString().split("T")[0]}/></label><label>Time<input name="time" type="time"/></label></div><label>Notes <small>(optional)</small><textarea name="notes" rows={3} placeholder="Anything we should know?"/></label><button className="button primary submit">Continue on WhatsApp <ArrowRight size={18}/></button></form>
      </section>

      <section className="about" id="about"><p className="kicker">WHY MAYOR TECH HUB</p><h2>Tech shopping, without the stress.</h2><div className="benefit-grid"><div><b>01</b><h3>Curated quality</h3><p>Every listing is selected for value, condition and everyday performance.</p></div><div><b>02</b><h3>Human support</h3><p>Ask a question, confirm stock, or arrange delivery directly on WhatsApp.</p></div><div><b>03</b><h3>Flexible upgrades</h3><p>Shop outright, inspect before you commit, or swap your current device.</p></div></div></section>
    </main>

    <footer><div className="footer-brand"><img src="/mayor-logo.png" alt="Mayor Tech Hub"/><p>Gadgets that simply impress.</p></div><div><p>Quick links</p><a href="#shop">Shop</a><a href="#services">Book a service</a><a href="/admin">Admin</a></div><div><p>Need help?</p><a href={`https://wa.me/${WA}`} target="_blank">Chat on WhatsApp</a><span>0814 464 5205</span></div><small>© {new Date().getFullYear()} Mayor Tech Hub. All rights reserved.</small></footer>

    {toast && <div className="toast"><Check size={17}/>{toast}</div>}
    <div className={`scrim ${cartOpen?"show":""}`} onClick={()=>setCartOpen(false)}/>
    <aside className={`cart-drawer ${cartOpen?"show":""}`} aria-hidden={!cartOpen}><div className="cart-head"><div><p>YOUR CART</p><h2>{count ? `${count} item${count===1?"":"s"}` : "Ready when you are"}</h2></div><button onClick={()=>setCartOpen(false)} aria-label="Close cart"><X/></button></div><div className="cart-lines">{lines.length ? lines.map((p)=><div className="cart-line" key={p.id}><div className="mini-image">{p.imageUrl?<img src={p.imageUrl} alt=""/>:<span>{p.emoji}</span>}</div><div className="line-info"><b>{p.name}</b><span>{money(p.price)}</span><div className="quantity"><button onClick={()=>change(p.id,-1)}><Minus/></button><strong>{cart[p.id]}</strong><button onClick={()=>change(p.id,1)}><Plus/></button></div></div></div>) : <div className="cart-empty"><ShoppingBag/><h3>Your cart is empty</h3><p>Add a gadget and it’ll show up here.</p><button onClick={()=>setCartOpen(false)}>Keep shopping</button></div>}</div><form className="cart-checkout" action={checkout}><div className="cart-total"><span>Total</span><b>{money(total)}</b></div><label>Name<input name="name" placeholder="Your name"/></label><label>Phone <small>(optional)</small><input name="phone" type="tel" placeholder="0800 000 0000"/></label><label>Delivery location<textarea name="location" rows={2} placeholder="City and area"/></label>{error&&<p className="form-error">{error}</p>}<button className="checkout-button" disabled={!lines.length}>Order on WhatsApp <ArrowRight/></button><small className="checkout-note">No payment is taken here. We’ll confirm stock and delivery with you.</small></form></aside>
  </>;
}
