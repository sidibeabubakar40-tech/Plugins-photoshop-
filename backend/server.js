import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const PORT=Number(process.env.PORT||8787);
const PUBLIC_BASE_URL=(process.env.PUBLIC_BASE_URL||"").replace(/\/$/,"");
const UPLOAD_DIR=path.join(process.env.SIDIBE_UPLOAD_DIR||"/tmp","sidibe-photoshop-uploads");
const MAX_UPLOAD_BYTES=15*1024*1024;
await fs.mkdir(UPLOAD_DIR,{recursive:true});
const TOKEN_URL="https://ims-na1.adobelogin.com/ims/token/v3";
let cached={token:null,expiresAt:0};

async function getToken(){
  if(cached.token && Date.now()<cached.expiresAt-60000) return cached.token;
  if(!process.env.ADOBE_CLIENT_ID||!process.env.ADOBE_CLIENT_SECRET) throw new Error("Adobe credentials missing");
  const body=new URLSearchParams({grant_type:"client_credentials",client_id:process.env.ADOBE_CLIENT_ID,client_secret:process.env.ADOBE_CLIENT_SECRET,scope:process.env.ADOBE_SCOPES||"openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis"});
  const r=await fetch(TOKEN_URL,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
  if(!r.ok) throw new Error("Adobe token HTTP "+r.status);
  const data=await r.json();
  cached={token:data.access_token,expiresAt:Date.now()+Number(data.expires_in||86400)*1000};
  return cached.token;
}

async function readBody(req,maxBytes=MAX_UPLOAD_BYTES){
  let raw=""; let size=0;
  for await(const chunk of req){
    size+=Buffer.byteLength(chunk);
    if(size>maxBytes) throw new Error("Payload trop volumineux.");
    raw+=chunk;
  }
  return raw;
}

function send(res,status,payload){
  const body=JSON.stringify(payload);
  res.writeHead(status,{"Content-Type":"application/json","Access-Control-Allow-Origin":process.env.ALLOWED_ORIGIN||"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST,GET,OPTIONS"});
  res.end(body);
}

async function adobeGet(path){
  const token=await getToken();
  const r=await fetch("https://image.adobe.io"+path,{method:"GET",headers:{"Authorization":"Bearer "+token,"x-api-key":process.env.ADOBE_CLIENT_ID}});
  const text=await r.text();
  let data; try{data=JSON.parse(text);}catch{data={raw:text};}
  if(!r.ok) throw new Error("Adobe API HTTP "+r.status);
  return data;
}

async function adobePost(path,payload){
  const token=await getToken();
  const r=await fetch("https://image.adobe.io"+path,{method:"POST",headers:{"Authorization":"Bearer "+token,"x-api-key":process.env.ADOBE_CLIENT_ID,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const text=await r.text();
  let data; try{data=JSON.parse(text);}catch{data={raw:text};}
  if(!r.ok) throw new Error("Adobe API HTTP "+r.status);
  return data;
}

const server=http.createServer(async(req,res)=>{
  if(req.method==="OPTIONS"){res.writeHead(204);return res.end();}
  if(req.method==="GET"&&req.url==="/health") return send(res,200,{ok:true,service:"SIDIBE Photoshop Backend",version:"1.2.0"});
  if(req.method==="GET"&&req.url.startsWith("/files/")){
    try{
      const token=decodeURIComponent(req.url.slice("/files/".length)).split("?")[0];
      if(!/^[a-f0-9-]+\.png$/.test(token)) throw new Error("Fichier invalide");
      const file=path.join(UPLOAD_DIR,token);
      const data=await fs.readFile(file);
      res.writeHead(200,{"Content-Type":"image/png","Cache-Control":"private, max-age=900"});
      return res.end(data);
    }catch(e){return send(res,404,{ok:false,error:"Fichier introuvable"});}
  }
  if(req.method==="POST"&&req.url==="/v2/upload-image"){
    try{
      if(!PUBLIC_BASE_URL) throw new Error("PUBLIC_BASE_URL missing");
      const body=JSON.parse(await readBody(req));
      const base64=String(body.data||"");
      const mime=body.mime||"image/png";
      if(mime!=="image/png") throw new Error("Seul PNG est accepté pour cet upload.");
      if(!base64) throw new Error("data is required");
      const buffer=Buffer.from(base64,"base64");
      if(!buffer.length) throw new Error("Image vide.");
      if(buffer.length>MAX_UPLOAD_BYTES) throw new Error("Image trop volumineuse.");
      const id=crypto.randomUUID();
      const filename=id+".png";
      await fs.writeFile(path.join(UPLOAD_DIR,filename),buffer);
      setTimeout(()=>fs.unlink(path.join(UPLOAD_DIR,filename)).catch(()=>{}),30*60*1000).unref?.();
      return send(res,200,{ok:true,imageUrl:PUBLIC_BASE_URL+"/files/"+filename,expiresIn:1800});
    }catch(e){return send(res,400,{ok:false,error:e.message});}
  }
  if(req.method==="GET"&&req.url.startsWith("/v2/status/")){
    try{
      const jobId=decodeURIComponent(req.url.slice("/v2/status/".length)).split("?")[0];
      if(!jobId) throw new Error("jobId is required");
      const result=await adobeGet("/v2/status/"+encodeURIComponent(jobId));
      return send(res,200,result);
    }catch(e){return send(res,502,{ok:false,error:e.message});}
  }
  if(req.method==="POST"&&req.url==="/v2/remove-background"){
    try{
      const body=JSON.parse(await readBody(req)||"{}");
      if(!body.imageUrl) throw new Error("imageUrl is required");
      const result=await adobePost("/v2/remove-background",{image:{source:{url:body.imageUrl}},mode:body.mode||"cutout",trim:body.trim!==false,output:{mediaType:"image/png"}});
      return send(res,200,result);
    }catch(e){return send(res,502,{ok:false,error:e.message});}
  }
  return send(res,404,{ok:false,error:"Not found"});
});
server.listen(PORT,()=>console.log("SIDIBE Photoshop Backend listening on "+PORT));