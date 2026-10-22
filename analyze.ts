interface Env { GEMINI_API_KEY?: string; }
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export const onRequest: PagesFunction<Env> = async ({request,env})=>{
 if(request.method!=='POST') return json({error:'Use POST'},405);
 if(!env.GEMINI_API_KEY) return json({error:'GEMINI_API_KEY secret is not configured. Add it in Cloudflare Pages settings.'},503);
 try{
  const body:any=await request.json(); const symbol=String(body.symbol||'').toUpperCase(); const candles=body.candles;
  if(!Array.isArray(candles)||candles.length<20||candles.some((c:any)=>![c.open,c.high,c.low,c.close].every((v:any)=>Number.isFinite(Number(v))))) return json({error:'Send at least 20 real OHLC candles.'},400);
  const compact=candles.slice(-80).map((c:any)=>({time:c.time,open:c.open,high:c.high,low:c.low,close:c.close,volume:c.volume}));
  const prompt=`You are a cautious technical-market analyst. Analyze ${symbol} using only the provided OHLC candle data. Never claim certainty or invent news/fundamentals. Compute trend, structure, momentum, nearby support/resistance, and risk/reward. Return ONLY valid JSON with keys: bias (BUY|SELL|WAIT), confidence (integer 0-100), entry (number|null), stopLoss (number|null), takeProfits (array of 3 numbers), timeframe (string), reasons (array of strings), invalidation (string), riskNote (string). If data is insufficient or conditions are mixed, choose WAIT and null entry/SL. Confidence is an analytical estimate, not a win probability. Candles: ${JSON.stringify(compact)}`;
  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+encodeURIComponent(env.GEMINI_API_KEY),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.2,responseMimeType:'application/json'}})});
  const out:any=await r.json(); if(!r.ok) return json({error:'Gemini API request failed',status:r.status,detail:out?.error?.message||'Check API key, billing and model access'},502);
  const raw=out?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||'').join(''); if(!raw) return json({error:'AI returned no analysis'},502);
  let analysis; try{analysis=JSON.parse(raw)}catch{return json({error:'AI response was not valid JSON',raw},502)};
  if(!['BUY','SELL','WAIT'].includes(analysis.bias)||!Number.isFinite(Number(analysis.confidence))) return json({error:'AI response schema validation failed'},502);
  return json({symbol,provider:'Google Gemini 2.5 Flash',analysis,generatedAt:new Date().toISOString(),disclaimer:'AI-generated technical analysis is uncertain and is not financial advice.'});
 }catch(e){return json({error:'Analysis request failed',detail:String(e)},502)}
};
