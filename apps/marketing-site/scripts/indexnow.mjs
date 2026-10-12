// Tells IndexNow (Bing, Yandex, Seznam, Naver; Bing feeds ChatGPT search and
// Copilot) that every URL in the live sitemap may have changed. Run after a
// production deploy: npm run indexnow --workspace @kyprewards/marketing-site
//
// The key is public by design: IndexNow proves ownership by fetching
// https://kyprewards.com/<key>.txt and comparing it with the key sent here.
const KEY = "dd37981676f3d35d0bb384021177785d";
const SITE = process.env.SITE_URL ?? "https://kyprewards.com";

const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (urlList.length === 0) throw new Error(`no URLs in ${SITE}/sitemap.xml`);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE).host,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList,
  }),
});
// 200 and 202 both mean accepted; 403 means the key file is not live yet.
console.log(`IndexNow: ${response.status} for ${urlList.length} URLs`);
if (!response.ok) process.exit(1);
