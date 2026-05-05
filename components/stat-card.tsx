import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: "up" | "down";
  icon: ReactNode;
  gradient: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  gradient,
}: StatCardProps) {
  return (
    <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden relative group">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition duration-300`} />

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {value}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
