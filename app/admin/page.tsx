"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LogOut, PackagePlus, Save, Trash2 } from "lucide-react";

type Product = { id:number; name:string; category:string; description:string; price:number; imageUrl:string|null; emoji:string; inStock:boolean };

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/products");
    const data = await response.json();
    setProducts(data.products ?? []);
  }
  useEffect(() => { load(); const saved = sessionStorage.getItem("mth-admin"); if (saved) setKey(saved); }, []);
  async function login(e: FormEvent) {
    e.preventDefault();
    if (!draftKey) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/products", { method:"HEAD", headers:{"x-admin-key":draftKey} });
    setBusy(false);
    if (!response.ok) { setMessage("That admin password is not correct."); return; }
    sessionStorage.setItem("mth-admin", draftKey); setKey(draftKey);
  }

  async function addProduct(form: FormData) {
    setBusy(true); setMessage("");
    const response = await fetch("/api/products", { method:"POST", headers:{"x-admin-key":key}, body:form });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Could not add product");
    else { setMessage("Product published successfully."); (document.getElementById("product-form") as HTMLFormElement)?.reset(); await load(); }
    setBusy(false);
  }
  async function update(product: Product, changes: Partial<Product>) {
    setBusy(true); setMessage("");
    const response = await fetch("/api/products", { method:"PATCH", headers:{"content-type":"application/json","x-admin-key":key}, body:JSON.stringify({id:product.id,...changes}) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Could not update product"); else { setMessage("Product updated."); await load(); }
    setBusy(false);
  }
  async function remove(product: Product) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    setBusy(true); setMessage("");
    const response = await fetch(`/api/products?id=${product.id}`, { method:"DELETE", headers:{"x-admin-key":key} });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Could not delete product"); else { setMessage("Product deleted."); await load(); }
    setBusy(false);
  }

  if (!key) return <main className="admin-login"><a href="/" className="back"><ArrowLeft/> Back to shop</a><form onSubmit={login}><img src="/mayor-logo.png" alt="Mayor Tech Hub"/><p>PRIVATE CATALOG</p><h1>Admin sign in</h1><span>Enter the shop password to manage products.</span><label>Password<div className="password-field"><input autoFocus type={showKey?"text":"password"} value={draftKey} onChange={(e)=>setDraftKey(e.target.value)} placeholder="Admin password"/><button type="button" onClick={()=>setShowKey(!showKey)}>{showKey?<EyeOff/>:<Eye/>}</button></div></label>{message&&<p className="form-error">{message}</p>}<button className="admin-primary" disabled={busy}>{busy?<LoaderCircle className="spin"/>:null} Open dashboard</button></form></main>;

  return <main className="admin-shell">
    <aside className="admin-sidebar"><img src="/mayor-logo.png" alt="Mayor Tech Hub"/><div><b>Catalog admin</b><span>{products.length} products</span></div><a href="/"><ArrowLeft/> View storefront</a><button onClick={()=>{sessionStorage.removeItem("mth-admin");setKey("")}}><LogOut/> Sign out</button></aside>
    <section className="admin-main"><header><div><p>STORE MANAGEMENT</p><h1>Your catalog</h1></div><span className="status-dot"><i/> Store is live</span></header>
      {message && <div className="admin-message">{message}</div>}
      <div className="admin-grid">
        <form id="product-form" className="new-product" action={addProduct}><div className="admin-title"><PackagePlus/><div><h2>Add a product</h2><p>Publish a new gadget to the storefront.</p></div></div><label>Product name<input name="name" required placeholder="e.g. iPhone 15 Pro Max 256GB"/></label><div className="field-grid"><label>Category<input name="category" required placeholder="e.g. Apple"/></label><label>Price (₦)<input name="price" required inputMode="numeric" placeholder="1650000"/></label></div><label>Description<textarea name="description" rows={3} placeholder="Condition, storage, colour or highlights"/></label><div className="field-grid"><label>Product photo<input name="image" type="file" accept="image/*"/></label><label>Fallback emoji<input name="emoji" defaultValue="📱"/></label></div><button className="admin-primary" disabled={busy}>{busy?<LoaderCircle className="spin"/>:<PackagePlus/>} Publish product</button></form>
        <div className="product-list"><div className="admin-title"><Save/><div><h2>Live products</h2><p>Edit stock, pricing and details.</p></div></div>{products.length ? products.map((p)=><ProductRow key={p.id} product={p} busy={busy} update={update} remove={remove}/>) : <div className="admin-empty">No products yet. Add your first product.</div>}</div>
      </div>
    </section>
  </main>;
}

function ProductRow({product,busy,update,remove}:{product:Product;busy:boolean;update:(p:Product,c:Partial<Product>)=>void;remove:(p:Product)=>void}) {
  const [editing,setEditing]=useState(false); const [name,setName]=useState(product.name); const [category,setCategory]=useState(product.category); const [price,setPrice]=useState(String(product.price)); const [description,setDescription]=useState(product.description);
  return <article className="admin-product"><div className="admin-thumb">{product.imageUrl?<img src={product.imageUrl} alt=""/>:<span>{product.emoji}</span>}</div>{editing?<div className="edit-fields"><input value={name} onChange={e=>setName(e.target.value)}/><div><input value={category} onChange={e=>setCategory(e.target.value)}/><input value={price} onChange={e=>setPrice(e.target.value)}/></div><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2}/></div>:<div className="admin-product-copy"><small>{product.category}</small><b>{product.name}</b><span>₦{product.price.toLocaleString("en-NG")}</span></div>}<div className="admin-actions"><button className={product.inStock?"stock on":"stock"} disabled={busy} onClick={()=>update(product,{inStock:!product.inStock})}>{product.inStock?"In stock":"Hidden"}</button>{editing?<button disabled={busy} onClick={()=>{update(product,{name,category,price:Number(price),description});setEditing(false)}}>Save</button>:<button onClick={()=>setEditing(true)}>Edit</button>}<button className="delete" disabled={busy} onClick={()=>remove(product)} aria-label={`Delete ${product.name}`}><Trash2/></button></div></article>;
}
