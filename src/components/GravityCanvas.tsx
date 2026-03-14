import { useEffect, useRef, useState, useCallback } from 'react';
import type { Body, Vector } from '../types';
import { calculateRadius, generateColor, generateId } from '../types';

interface GravityCanvasProps {
  bodies: Body[];
  setBodies: React.Dispatch<React.SetStateAction<Body[]>>;
  gravityConstant: number;
  trailsEnabled: boolean;
  timeStep: number;
}

const TRAIL_LENGTH = 100;
const MIN_MASS = 10;
const MAX_MASS = 1000;
const GravityCanvas: React.FC<GravityCanvasProps> = ({ bodies, setBodies, gravityConstant, trailsEnabled, timeStep }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  // Interaction state
  const [isInteracting, setIsInteracting] = useState(false);
  const [startPos, setStartPos] = useState<Vector | null>(null);
  const [currentPos, setCurrentPos] = useState<Vector | null>(null);
  const [creatingMass, setCreatingMass] = useState(100);

  // Camera state for pan/zoom
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const isDraggingCamera = useRef(false);
  const lastTouchPos = useRef<Vector | null>(null);
  const initialPinchDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(1);

  const bodiesRef = useRef(bodies);
  bodiesRef.current = bodies;
  const gravityRef = useRef(gravityConstant);
  gravityRef.current = gravityConstant;
  const timeStepRef = useRef(timeStep);
  timeStepRef.current = timeStep;

  // Physics Update Loop
  const updatePhysics = useCallback(() => {
    let currentBodies = [...bodiesRef.current];
    const newBodies: Body[] = [];
    const mergedIds = new Set<string>();

    for (let i = 0; i < currentBodies.length; i++) {
      if (mergedIds.has(currentBodies[i].id)) continue;

      let body1 = { ...currentBodies[i] };
      let fx = 0;
      let fy = 0;

      for (let j = 0; j < currentBodies.length; j++) {
        if (i === j || mergedIds.has(currentBodies[j].id)) continue;
        const body2 = currentBodies[j];

        const dx = body2.x - body1.x;
        const dy = body2.y - body1.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Collision Detection
        if (dist < body1.radius + body2.radius) {
          // Merge bodies
          mergedIds.add(body2.id);

          const newMass = body1.mass + body2.mass;
          // Inelastic collision momentum conservation: v_new = (m1*v1 + m2*v2) / (m1+m2)
          body1.vx = (body1.mass * body1.vx + body2.mass * body2.vx) / newMass;
          body1.vy = (body1.mass * body1.vy + body2.mass * body2.vy) / newMass;

          // Move center of mass
          body1.x = (body1.x * body1.mass + body2.x * body2.mass) / newMass;
          body1.y = (body1.y * body1.mass + body2.y * body2.mass) / newMass;

          body1.mass = newMass;
          body1.radius = calculateRadius(newMass);
          // Keep the color of the more massive body
          if (body2.mass > body1.mass) {
            body1.color = body2.color;
          }
          continue;
        }

        // F = G * (m1 * m2) / r^2
        // Prevent singularity with a softening factor
        const force = (gravityRef.current * body1.mass * body2.mass) / (distSq + 100);

        fx += force * (dx / dist);
        fy += force * (dy / dist);
      }

      // a = F / m
      const ax = fx / body1.mass;
      const ay = fy / body1.mass;

      body1.vx += ax * timeStepRef.current;
      body1.vy += ay * timeStepRef.current;

      body1.x += body1.vx * timeStepRef.current;
      body1.y += body1.vy * timeStepRef.current;

      // Update trail
      if (Math.random() < 0.2) { // Only sample occasionally to save memory/perf
        body1.trail = [...body1.trail, { x: body1.x, y: body1.y }];
        if (body1.trail.length > TRAIL_LENGTH) {
          body1.trail.shift();
        }
      }

      newBodies.push(body1);
    }

    if (mergedIds.size > 0 || currentBodies.some((b, i) => b.x !== newBodies[i]?.x)) {
      setBodies(newBodies);
    }
  }, [setBodies]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and fill background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply camera transform
    // Center of screen is (canvas.width/2, canvas.height/2)
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-canvas.width / 2 + camera.x, -canvas.height / 2 + camera.y);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1 / camera.zoom;
    const gridSize = 100;

    const startX = (-canvas.width/2 / camera.zoom) - camera.x;
    const startY = (-canvas.height/2 / camera.zoom) - camera.y;
    const endX = startX + (canvas.width / camera.zoom);
    const endY = startY + (canvas.height / camera.zoom);

    ctx.beginPath();
    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Draw trails
    if (trailsEnabled) {
      bodiesRef.current.forEach(body => {
        if (body.trail.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(body.trail[0].x, body.trail[0].y);
        for (let i = 1; i < body.trail.length; i++) {
          ctx.lineTo(body.trail[i].x, body.trail[i].y);
        }
        ctx.strokeStyle = body.color;
        ctx.lineWidth = 1.5 / camera.zoom;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });
    }

    // Draw bodies
    bodiesRef.current.forEach(body => {
      // Glow effect
      const gradient = ctx.createRadialGradient(body.x, body.y, 0, body.x, body.y, body.radius * 2);
      gradient.addColorStop(0, body.color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Solid core
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fillStyle = body.color;
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.arc(body.x - body.radius * 0.3, body.y - body.radius * 0.3, body.radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    });

    // Draw interaction slingshot
    if (isInteracting && startPos && currentPos) {
      // Draw creating body
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, calculateRadius(creatingMass), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();

      // Draw vector line
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2 / camera.zoom;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Velocity indicator
      const vx = (startPos.x - currentPos.x) * 0.05;
      const vy = (startPos.y - currentPos.y) * 0.05;
      const speed = Math.sqrt(vx*vx + vy*vy).toFixed(1);

      ctx.fillStyle = 'white';
      ctx.font = `${14 / camera.zoom}px sans-serif`;
      ctx.fillText(`v: ${speed}`, currentPos.x + 10/camera.zoom, currentPos.y);
    }

    ctx.restore();
  }, [camera, isInteracting, startPos, currentPos, creatingMass, trailsEnabled]);

  const loop = useCallback(() => {
    updatePhysics();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [updatePhysics, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Coordinate conversion helper
  const screenToWorld = (clientX: number, clientY: number): Vector => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Reverse the camera transform
    const worldX = (x - canvasRef.current.width / 2) / camera.zoom + canvasRef.current.width / 2 - camera.x;
    const worldY = (y - canvasRef.current.height / 2) / camera.zoom + canvasRef.current.height / 2 - camera.y;

    return { x: worldX, y: worldY };
  };

  // Interactions (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or Shift+click to pan
    if (e.button === 1 || e.shiftKey) {
      isDraggingCamera.current = true;
      lastTouchPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 0) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setIsInteracting(true);
      setStartPos(worldPos);
      setCurrentPos(worldPos);
      setCreatingMass(MIN_MASS);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCamera.current && lastTouchPos.current) {
      const dx = (e.clientX - lastTouchPos.current.x) / camera.zoom;
      const dy = (e.clientY - lastTouchPos.current.y) / camera.zoom;
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastTouchPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (isInteracting) {
      setCurrentPos(screenToWorld(e.clientX, e.clientY));
      // Increase mass while dragging (optional, but fun)
      setCreatingMass(prev => Math.min(MAX_MASS, prev + 2));
    }
  };

  const handleMouseUp = () => {
    if (isDraggingCamera.current) {
      isDraggingCamera.current = false;
      return;
    }

    if (isInteracting && startPos && currentPos) {
      const vx = (startPos.x - currentPos.x) * 0.05;
      const vy = (startPos.y - currentPos.y) * 0.05;

      const newBody: Body = {
        id: generateId(),
        x: startPos.x,
        y: startPos.y,
        vx,
        vy,
        mass: creatingMass,
        radius: calculateRadius(creatingMass),
        color: generateColor(),
        trail: []
      };

      setBodies(prev => [...prev, newBody]);
      setIsInteracting(false);
      setStartPos(null);
      setCurrentPos(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default to stop scrolling, although canvas may already do this
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, prev.zoom * zoomFactor))
    }));
  };

  // Interactions (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling

    if (e.touches.length === 2) {
      // Pinch to zoom start
      setIsInteracting(false);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      initialPinchDistance.current = dist;
      initialZoom.current = camera.zoom;

      // Calculate center point for panning during pinch
      lastTouchPos.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      isDraggingCamera.current = true;
    } else if (e.touches.length === 1) {
      // Single touch to create
      const touch = e.touches[0];
      const worldPos = screenToWorld(touch.clientX, touch.clientY);
      setIsInteracting(true);
      setStartPos(worldPos);
      setCurrentPos(worldPos);
      setCreatingMass(MIN_MASS);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2 && initialPinchDistance.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

      const newZoom = initialZoom.current * (dist / initialPinchDistance.current);

      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      let dx = 0, dy = 0;
      if (lastTouchPos.current) {
        dx = (centerX - lastTouchPos.current.x) / camera.zoom;
        dy = (centerY - lastTouchPos.current.y) / camera.zoom;
      }

      setCamera(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
        zoom: Math.max(0.1, Math.min(5, newZoom))
      }));

      lastTouchPos.current = { x: centerX, y: centerY };
    } else if (e.touches.length === 1 && isInteracting) {
      const touch = e.touches[0];
      setCurrentPos(screenToWorld(touch.clientX, touch.clientY));
      setCreatingMass(prev => Math.min(MAX_MASS, prev + 2));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();

    if (isDraggingCamera.current && e.touches.length < 2) {
      isDraggingCamera.current = false;
      initialPinchDistance.current = null;
    }

    if (isInteracting && e.touches.length === 0 && startPos && currentPos) {
      const vx = (startPos.x - currentPos.x) * 0.05;
      const vy = (startPos.y - currentPos.y) * 0.05;

      const newBody: Body = {
        id: generateId(),
        x: startPos.x,
        y: startPos.y,
        vx,
        vy,
        mass: creatingMass,
        radius: calculateRadius(creatingMass),
        color: generateColor(),
        trail: []
      };

      setBodies(prev => [...prev, newBody]);
      setIsInteracting(false);
      setStartPos(null);
      setCurrentPos(null);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ touchAction: 'none' }}
    />
  );
};

export default GravityCanvas;
