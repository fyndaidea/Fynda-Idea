'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient as createStorageClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseClientKey } from '@/lib/supabase/env';
import { money, type Product } from '@/lib/store/policy';
const blank = { title: '', slug: '', summary: '', description: '', category: '', format: 'PDF', amount_cents: 1000, currency: 'usd', published: false, asset_path: '', file_name: '', file_bytes: 0 };
export default function StoreAdmin({ products }: { products: Product[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null), [form, setForm] = useState({ ...blank });
  const [price, setPrice] = useState('10.00'), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  function edit(p?: Product) { setEditing(p?.id ?? null); setForm(p ? { ...p } : { ...blank }); setPrice(((p?.amount_cents ?? 1000)/100).toFixed(2)); setError(''); setMessage(''); }
  async function upload(file?: File) {
    if (!file) return; setBusy(true); setError(''); setMessage('');
    try {
      if (!file.size || file.size > 50 * 1024 * 1024) throw new Error('Choose a file up to 50 MB.');
      const response = await fetch('/api/admin/store/upload', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name:file.name,size:file.size}) }); const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const storage = createStorageClient(getSupabaseUrl(), getSupabaseClientKey(), {auth:{persistSession:false,autoRefreshToken:false}});
      const uploaded = await storage.storage.from(data.bucket).uploadToSignedUrl(data.asset_path, data.token, file, {contentType:'application/octet-stream',upsert:false});
      if (uploaded.error) throw new Error('The file could not be uploaded. Please try again.');
      setForm(f=>({...f,asset_path:data.asset_path,file_name:data.file_name,file_bytes:data.file_bytes})); setMessage('Private download uploaded. Save the product to attach it.');
    } catch(e) { setError(e instanceof Error ? e.message : 'Upload failed.'); } finally { setBusy(false); }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (!/^\d+(\.\d{1,2})?$/.test(price)) throw new Error('Enter a price with up to two decimal places.');
      const response = await fetch(editing ? `/api/admin/store/products/${editing}` : '/api/admin/store/products', { method: editing ? 'PATCH' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...form,amount_cents:Math.round(Number(price)*100)}) }); const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setEditing(data.id); setMessage(form.published ? 'Product published.' : 'Draft saved.'); router.refresh();
    } catch(e) { setError(e instanceof Error ? e.message : 'Save failed.'); } finally { setBusy(false); }
  }
  return <div className="store-admin-grid"><section><div className="store-section-heading"><h2>Products ({products.length})</h2><button className="store-link" onClick={()=>edit()}>+ New product</button></div>{products.length ? products.map(p=><button key={p.id} onClick={()=>edit(p)} className={`store-product-row ${editing===p.id?'store-selected':''}`}><span><b>{p.title}</b><small>{p.category} · {p.published?'Published':'Draft'}</small></span><strong>{money(p.amount_cents,p.currency)}</strong></button>) : <p>No products yet. Create the first product for this app.</p>}<p className="store-note">Unpublish a product to remove it from the catalog. Existing purchases retain their original files. Keep old files in storage.</p></section>
    <form className="store-editor" onSubmit={save}><h2>{editing ? 'Edit product' : 'New digital product'}</h2><p className="store-note">This product belongs only to this app’s catalog.</p>
      {(['title','slug','summary','category','format'] as const).map(key=><label key={key}>{key==='slug'?'Product URL':key[0].toUpperCase()+key.slice(1)}<input required maxLength={key==='summary'?300:key==='title'?150:key==='slug'?100:key==='category'?80:40} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/></label>)}
      <label>Description<textarea required rows={6} maxLength={20000} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></label>
      <div className="store-two"><label>Price<input required inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)}/></label><label>Currency<select value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>{['usd','cad','eur','gbp','aud'].map(c=><option key={c} value={c}>{c.toUpperCase()}</option>)}</select></label></div>
      <label>Private download (up to 50 MB)<input type="file" disabled={busy} onChange={e=>upload(e.target.files?.[0])}/></label>{form.file_name && <p className="store-notice">Attached: {form.file_name} · {(form.file_bytes/1024/1024).toFixed(1)} MB</p>}
      <label className="store-checkbox"><input type="checkbox" checked={form.published} onChange={e=>setForm(f=>({...f,published:e.target.checked}))}/>Publish in the store</label>
      <button disabled={busy} className="store-button">{busy?'Working…':'Save product'}</button>{error && <p className="store-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}{editing && form.published && <Link className="store-link" href={`/store/${form.slug}`}>View product →</Link>}
    </form></div>;
}
