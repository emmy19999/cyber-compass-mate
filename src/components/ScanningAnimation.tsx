import { Shield, Radio, Wifi, Lock } from "lucide-react";

export function ScanningAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-primary/30 animate-pulse-ring" />
        <div className="absolute inset-2 w-28 h-28 rounded-full border border-primary/20 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
        
        {/* Center shield */}
        <div className="relative w-32 h-32 rounded-full bg-card border border-border flex items-center justify-center cyber-glow">
          <Shield className="w-12 h-12 text-primary animate-pulse" />
        </div>
        
        {/* Orbiting icons */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s" }}>
          <Radio className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 text-primary/70" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s", animationDelay: "2s" }}>
          <Wifi className="absolute top-1/2 -right-2 -translate-y-1/2 w-5 h-5 text-primary/70" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s", animationDelay: "4s" }}>
          <Lock className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 text-primary/70" />
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Analyzing Security...
        </h3>
        <p className="text-muted-foreground font-mono text-sm">
          Scanning for vulnerabilities and misconfigurations
        </p>
        
        <div className="flex items-center justify-center gap-1 mt-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
