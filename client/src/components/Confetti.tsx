import { useEffect, useState } from "react";

interface ConfettiProps {
  isVisible: boolean;
  duration?: number;
}

export default function Confetti({ isVisible, duration = 3000 }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    delay: number;
    angle: number;
    distance: number;
    color: string;
    offsetX: number;
    offsetY: number;
  }>>([]);

  useEffect(() => {
    if (isVisible) {
      // 生成150个粒子，从同一个中心发射，但每个粒子有微小偏移
      const newParticles = Array.from({ length: 150 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2; // 随机角度
        const distance = 300 + Math.random() * 500; // 更远的距离
        const offsetX = (Math.random() - 0.5) * 30; // 每个粒子起始X偏移（-15px到15px）
        const offsetY = (Math.random() - 0.5) * 30; // 每个粒子起始Y偏移（-15px到15px）
        return {
          id: i,
          delay: Math.random() * 500, // 随机延迟
          angle,
          distance,
          color: ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0000', '#ff6b00', '#9400ff', '#00ffaa'][Math.floor(Math.random() * 8)],
          offsetX,
          offsetY
        };
      });
      setParticles(newParticles);

      // 清理粒子
      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => {
        const finalOffsetX = Math.cos(particle.angle) * particle.distance;
        const finalOffsetY = Math.sin(particle.angle) * particle.distance;
        return (
          <div
            key={particle.id}
            className="confetti-particle"
            style={{
              left: `50%`,
              top: `50%`,
              animationDelay: `${particle.delay}ms`,
              backgroundColor: particle.color,
              '--offset-x': `${finalOffsetX + particle.offsetX}px`,
              '--offset-y': `${finalOffsetY + particle.offsetY}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
