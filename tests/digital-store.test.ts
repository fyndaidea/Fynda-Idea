import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canDownload, assertAssetPath, assertPrivateBucket, assertOrigin, validSiteUrl, productInput, publicProduct, type Order, type Product } from '../lib/store/policy';
import { isStorePublicPath } from '../lib/store/access';
const app = 'fynda.idea';
const order: Order = { id: 'order-1', app_key: app, user_id:'buyer-1', product_id:'product-1', title:'Resource', amount_cents:2500, currency:'usd', asset_path:`${app}/uuid/resource.pdf`, file_name:'resource.pdf', status:'pending', created_at:new Date().toISOString() };
test('only the buyer with a paid order can download',()=>{
  assert.equal(canDownload({...order,status:'paid'},order.user_id,app),true);
  assert.equal(canDownload({...order,status:'paid'},'another-buyer',app),false);
  for (const status of ['pending','failed','expired','refunded','disputed'] as const) assert.equal(canDownload({...order,status},order.user_id,app),false);
});
test('private assets are app scoped and reject traversal or external URLs',()=>{
  assertAssetPath(`${app}/uuid/file.zip`,app);
  for(const path of ['fynda.other/id/file.pdf',`${app}/../file.pdf`,'https://example.com/file',`${app}/file?download=1`,`${app}/id\\file`]) assert.throws(()=>assertAssetPath(path,app));
});
test('downloads never use public buckets or the public media proxy bucket',()=>{
  assertPrivateBucket('private-downloads',false,'documents');
  assert.throws(()=>assertPrivateBucket('downloads',true,'documents'));
  assert.throws(()=>assertPrivateBucket('documents',false,'documents'));
});
test('checkout URLs must be configured HTTPS origins; development allows loopback',()=>{
  assert.equal(validSiteUrl('https://robotics.example.com',true),'https://robotics.example.com');
  assert.equal(validSiteUrl('http://localhost:3000',false),'http://localhost:3000');
  for(const url of ['http://localhost:3000','http://example.com','https://example.com/path','https://user:password@example.com','javascript:alert(1)','']) assert.throws(()=>validSiteUrl(url,true));
});
test('admin and checkout writes reject missing or cross origin requests',()=>{
  assertOrigin('https://robotics.example.com','https://robotics.example.com');
  assert.throws(()=>assertOrigin(null,'https://robotics.example.com'));
  assert.throws(()=>assertOrigin('https://other.example.com','https://robotics.example.com'));
});
const product = { title:'Resource',slug:'my-resource',summary:'Useful resource',description:'Complete documentation',category:'Guides',format:'PDF',amount_cents:2500,currency:'usd',published:true,asset_path:`${app}/uuid/file.pdf`,file_name:'file.pdf',file_bytes:123 };
test('publishing requires a valid app-specific file and supported price',()=>{
  assert.equal(productInput(product,app).published,true);
  for(const bad of [{asset_path:''},{file_bytes:0},{amount_cents:99},{amount_cents:100.5},{currency:'jpy'},{slug:'../admin'},{slug:'purchases'},{file_name:'../../file'},{asset_path:'fynda.other/file.pdf'}]) assert.throws(()=>productInput({...product,...bad},app));
});
test('public product data excludes all private asset paths and normalizes Postgres bigint',()=>{
  const dto = publicProduct({...product,id:'product-1',app_key:app,created_at:'',updated_at:'',file_bytes:'123' as unknown as number} as Product);
  assert.equal('asset_path' in dto,false); assert.equal('app_key' in dto,false); assert.equal('published' in dto,false); assert.equal(dto.file_bytes,123);
});
test('launch gate exemptions are narrow and never cover admin writes',()=>{
  assert.equal(isStorePublicPath('/store/my-resource'),true);
  assert.equal(isStorePublicPath('/api/store/webhook','POST'),false);
  assert.equal(isStorePublicPath('/api/store/checkout','POST'),false);
  for(const path of ['/admin/store','/api/admin/store/products','/api/admin/store/upload','/api/store/other','/store/../admin','/store/my-resource/edit']) assert.equal(isStorePublicPath(path,'POST'),false);
  assert.equal(isStorePublicPath('/api/store/webhook','GET'),false);
});
