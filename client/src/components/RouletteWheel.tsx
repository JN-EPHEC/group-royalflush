import { useEffect, useRef } from "react";
import { WHEEL_ORDER, getNumberColor, wheelAngleForNumber } from "../utils/roulette";

interface Props {
  spinning: boolean;
  winningNumber: number | null;
  onSpinEnd?: () => void;
}

const SECTOR_COUNT = WHEEL_ORDER.length; // 37
const SECTOR_ANGLE = (2 * Math.PI) / SECTOR_COUNT;
const SPIN_DURATION = 4500; // ms

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export default function RouletteWheel({ spinning, winningNumber, onSpinEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const startAngleRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);

  function drawWheel(ctx: CanvasRenderingContext2D, currentAngle: number) {
    const canvas = ctx.canvas;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const outerR = cx - 6;
    const innerR = outerR * 0.68;
    const textR = outerR * 0.82;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#8B6914";
    ctx.fill();

    // Draw sectors
    for (let i = 0; i < SECTOR_COUNT; i++) {
      const startA = currentAngle + i * SECTOR_ANGLE;
      const endA = startA + SECTOR_ANGLE;
      const num = WHEEL_ORDER[i];
      const color = getNumberColor(num);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startA, endA);
      ctx.closePath();
      ctx.fillStyle = color === "red" ? "#c0392b" : color === "black" ? "#1a1a1a" : "#27ae60";
      ctx.fill();
      ctx.strokeStyle = "#8B6914";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Number text
      const midA = startA + SECTOR_ANGLE / 2;
      const tx = cx + textR * Math.cos(midA);
      const ty = cy + textR * Math.sin(midA);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midA + Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(9, outerR * 0.065)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(num), 0, 0);
      ctx.restore();
    }

    // Inner circle (hub)
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = "#2c1810";
    ctx.fill();
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hub detail
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 0.18, 0, 2 * Math.PI);
    ctx.fillStyle = "#8B6914";
    ctx.fill();

    // Pointer (triangle at top)
    const pSize = outerR * 0.07;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR - 4);
    ctx.lineTo(cx - pSize, cy - outerR + pSize * 1.8);
    ctx.lineTo(cx + pSize, cy - outerR + pSize * 1.8);
    ctx.closePath();
    ctx.fillStyle = "#f1c40f";
    ctx.fill();
  }

  // Initial static draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawWheel(ctx, -Math.PI / 2); // default upright
  }, []);

  // Spin animation
  useEffect(() => {
    if (!spinning || winningNumber === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    cancelAnimationFrame(animRef.current);

    // Target angle in degrees → radians
    const targetDeg = wheelAngleForNumber(winningNumber, 6);
    const targetRad = (targetDeg * Math.PI) / 180;

    startRef.current = performance.now();
    startAngleRef.current = -Math.PI / 2; // current static position
    targetAngleRef.current = -Math.PI / 2 + targetRad;

    function animate(now: number) {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = easeOut(t);
      const angle = startAngleRef.current + eased * (targetAngleRef.current - startAngleRef.current);
      drawWheel(ctx!, angle);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        drawWheel(ctx!, targetAngleRef.current);
        onSpinEnd?.();
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [spinning, winningNumber]);

  return (
    <canvas
      ref={canvasRef}
      width={340}
      height={340}
      style={{ display: "block", margin: "0 auto" }}
    />
  );
}
