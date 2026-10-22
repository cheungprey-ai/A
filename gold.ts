interface Env {}
export const onRequest: PagesFunction<Env> = async () => {
  try {
    const upstream = await fetch("https://xaus.com/api/v1/spot", {headers: {"Accept":"application/json"}});
    const text = await upstream.text();
    return new Response(text, {status: upstream.status, headers: {"Content-Type":upstream.headers.get("content-type") || "application/json","Cache-Control":"public, max-age=30","Access-Control-Allow-Origin":"*"}});
  } catch { return Response.json({error:"Gold provider unavailable"},{status:502}); }
};