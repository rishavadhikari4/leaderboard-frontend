## Vercel IP restriction

Set the Vercel environment variable `ALLOWED_IP` to the public address or addresses of the Wi-Fi network that should access the site. Separate IPv4 and IPv6 values with commas, then redeploy. For example: `27.34.64.15,2400:1a00:4b29:5cf5::10`. Do not use the laptop's private address such as `192.168.1.138`; Vercel receives the public address assigned by the ISP.

The proxy denies all protected routes when `ALLOWED_IP` is missing and redirects requests from every other IP to `/not-authorized`. If the Wi-Fi provider changes the public IP, update `ALLOWED_IP` and redeploy.

# leaderboard-frontend
