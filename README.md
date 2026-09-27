## Vercel IP restriction

Set the Vercel environment variable `ALLOWED_IP` to the public IPv4 address of the Wi-Fi network that should access the site. Use the production environment, then redeploy. Do not use the laptop's private address such as `192.168.1.138`; Vercel receives the public address assigned by the ISP.

The proxy denies all protected routes when `ALLOWED_IP` is missing and redirects requests from every other IP to `/not-authorized`. If the Wi-Fi provider changes the public IP, update `ALLOWED_IP` and redeploy.

# leaderboard-frontend
