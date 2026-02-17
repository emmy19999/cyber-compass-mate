import { useEffect, useState } from "react";

interface RiskGaugeProps {
  score: number; // 0-100
  size?: number;
}

export function RiskGauge({ score, size = 160 }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1500;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // half circle
  const filled = (animatedScore / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2 + 10;

  const getColor = () => {
    if (score >= 75) return "hsl(var(--destructive))";
    if (score >= 50) return "hsl(var(--warning))";
    if (score >= 25) return "hsl(var(--primary))";
    return "hsl(var(--success))";
  };

  const getLabel = () => {
    if (score >= 75) return "High Risk";
    if (score >= 50) return "Elevated";
    if (score >= 25) return "Moderate";
    return "Low Risk";
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc */}
        <path
          d={`M 10 ${cy} A ${radius} ${radius} 0 0 1 ${size - 10} ${cy}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M 10 ${cy} A ${radius} ${radius} 0 0 1 ${size - 10} ${cy}`}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()})`,
            transition: "stroke-dasharray 0.3s ease",
          }}
        />
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          className="fill-foreground font-mono"
          fontSize="28"
          fontWeight="bold"
        >
          {animatedScore}
        </text>
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="11"
        >
          / 100
        </text>
      </svg>
      <span
        className="text-sm font-semibold mt-1 font-mono"
        style={{ color: getColor() }}
      >
        {getLabel()}
      </span>
    </div>
  );
}
