import { Dashboard } from "@/components/dashboard";

export const metadata = {
//index false and follow false
    robots: {
    index: false,
    follow: true,
  },
}

export default async function Home() {

  return (
    <main className="min-h-screen bg-background text-foreground">

      <Dashboard />
    </main>
  );
}
