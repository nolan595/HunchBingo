import type { Config } from "@netlify/functions";

export const handler = async () => {
  const siteUrl = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl || !cronSecret) {
    console.error("Missing URL or CRON_SECRET env vars");
    return;
  }

  const res = await fetch(`${siteUrl}/api/advance-games`, {
    method: "POST",
    headers: { authorization: `Bearer ${cronSecret}` },
  });

  const data = await res.json();
  console.log("advance-games:", JSON.stringify(data));
};

export const config: Config = {
  schedule: "* * * * *", // every minute
};
