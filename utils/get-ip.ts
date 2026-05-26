import dns from "dns/promises"
import os from "os";

async function getPingLikeIP(domain: string) {
  const result = await dns.lookup(domain);
  return result.address;
}

export async function getIP(domain: string) {
    try {
        const result = await dns.lookup(domain);
        return result;
    } catch (error) {
        console.log(error);
        return error;
    }
}


export function getInternetIPs() {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const name in interfaces) {
    for (const net of interfaces[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  return ips;
}