interface Env { TWELVEDATA_API_KEY?: string; }
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*'}});
export const onRequest: PagesFunction<Env> = async ({request,env})=>{
 const u=new URL(request.url); const symbol=(u.searchParams.get('symbol')||'XAUUSD').toUpperCase(); const interval=u.searchParams.get('interval')||'1h';
 const allowed=['XAUUSD','BTCUSD','EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','NZDUSD','ETHUSD','SOLUSD'];
 if(!allowed.includes(symbol)) return json({error:'Unsupported symbol',allowed},400);
 try {
  if(symbol==='BTCUSD'||symbol==='ETHUSD'||symbol==='SOLUSD'){
   const pair=symbol.replace('USD','USDT'); const r=await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${encodeURIComponent(interval)}&limit=100`);
   if(!r.ok) return json({error:'Crypto market provider error',provider:'Binance',status:r.status},502);
   const rows:any[]=await r.json(); const candles=rows.map(x=>({time:Math.floor(Number(x[0])/1000),open:Number(x[1]),high:Number(x[2]),low:Number(x[3]),close:Number(x[4]),volume:Number(x[5])}));
   return json({symbol,provider:'Binance Spot',kind:'ohlc',candles,last:candles.at(-1)?.close,updatedAt:new Date().toISOString()});
  }
  if(!env.TWELVEDATA_API_KEY) return json({error:'TWELVEDATA_API_KEY secret is not configured',symbol,setup:'Add TWELVEDATA_API_KEY in Cloudflare Pages > Settings > Variables and Secrets'},503);
  const tdSymbol=symbol==='XAUUSD'?'XAU/USD':symbol==='EURUSD'?'EUR/USD':symbol==='GBPUSD'?'GBP/USD':symbol==='USDJPY'?'USD/JPY':symbol==='AUDUSD'?'AUD/USD':symbol==='USDCAD'?'USD/CAD':'NZD/USD';
  const endpoint=new URL('https://api.twelvedata.com/time_series'); endpoint.searchParams.set('symbol',tdSymbol); endpoint.searchParams.set('interval',interval); endpoint.searchParams.set('outputsize','100'); endpoint.searchParams.set('apikey',env.TWELVEDATA_API_KEY);
  const r=await fetch(endpoint); const data:any=await r.json(); if(!r.ok||data.status==='error'||!Array.isArray(data.values)) return json({error:data.message||'Market data provider did not return candle history',symbol,provider:'Twelve Data'},502);
  const candles=data.values.slice().reverse().map((x:any)=>({time:Math.floor(new Date(x.datetime.replace(' ','T')+'Z').getTime()/1000),open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close),volume:Number(x.volume||0)})).filter((x:any)=>[x.time,x.open,x.high,x.low,x.close].every(Number.isFinite));
  if(!candles.length) return json({error:'No valid candles returned',symbol},502);
  return json({symbol,provider:'Twelve Data',kind:'ohlc',candles,last:candles.at(-1)?.close,updatedAt:new Date().toISOString()});
 }catch(e){return json({error:'Market data request failed',detail:String(e),symbol},502)}
};
