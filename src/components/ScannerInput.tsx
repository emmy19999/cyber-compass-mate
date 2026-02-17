import { useState } from "react";
import { Shield, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ScannerInputProps {
  onScan: (target: string) => void;
  isScanning: boolean;
}

const DOMAIN_REGEX = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
const IP_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|\d\d|\d)(\.(25[0-5]|2[0-4]\d|1\d\d|\d\d|\d)){3}$/;

function isValidTarget(input: string): boolean {
  return DOMAIN_REGEX.test(input) || IP_REGEX.test(input);
}

export function ScannerInput({ onScan, isScanning }: ScannerInputProps) {
  const [target, setTarget] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = target.trim();
    if (!trimmed || isScanning) return;
    if (!isValidTarget(trimmed)) {
      toast.error("Please enter a valid IP address or domain name");
      return;
    }
    onScan(trimmed);
  };

  const trimmed = target.trim();
  const isValid = trimmed.length > 0 && isValidTarget(trimmed);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="cyber-card p-1.5 cyber-glow">
          <div className="flex items-center gap-2 bg-background/50 rounded-md p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-mono hidden sm:inline">TARGET://</span>
            </div>
            <Input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Enter IP address or domain (e.g., 192.168.1.1 or example.com)"
              className="flex-1 border-0 bg-transparent font-mono text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isScanning}
              maxLength={255}
            />
            <Button
              type="submit"
              disabled={!isValid || isScanning}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 transition-all duration-300 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Analyze</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        {isScanning && (
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div className="scan-line" />
          </div>
        )}
      </div>
      
      <p className="text-center text-muted-foreground text-xs mt-4 font-mono opacity-70">
        ⚠️ Only scan systems you own or have permission to test
      </p>
    </form>
  );
}
