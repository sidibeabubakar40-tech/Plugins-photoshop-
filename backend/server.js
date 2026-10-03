import http from "node:http";

const PORT=Number(process.env.PORT||8787);
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
  if(req.method==="GET"&&req.url==="/health") return send(res,200,{ok:true,service:"SIDIBE Photoshop Backend",version:"1.1.0"});
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
      let raw=""; for await(const chunk of req) raw+=chunk;
      const body=JSON.parse(raw||"{}");
      if(!body.imageUrl) throw new Error("imageUrl is required");
      const result=await adobePost("/v2/remove-background",{image:{source:{url:body.imageUrl}},mode:body.mode||"cutout",trim:body.trim!==false,output:{mediaType:"image/png"}});
      return send(res,200,result);
    }catch(e){return send(res,502,{ok:false,error:e.message});}
  }
  return send(res,404,{ok:false,error:"Not found"});
});
server.listen(PORT,()=>console.log("SIDIBE Photoshop Backend listening on "+PORT));