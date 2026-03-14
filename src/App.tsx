import { useState, useCallback } from 'react';
import GravityCanvas from './components/GravityCanvas';
import Controls from './components/Controls';
import type { Body } from './types';
import { calculateRadius, generateColor, generateId } from './types';
import './index.css';

function App() {
  const [bodies, setBodies] = useState<Body[]>([]);
  const [gravityConstant, setGravityConstant] = useState<number>(1.0);
  const [trailsEnabled, setTrailsEnabled] = useState<boolean>(true);
  const [timeStep, setTimeStep] = useState<number>(1.0);

  const spawnGalaxy = useCallback(() => {
    const newBodies: Body[] = [];
    const numStars = 200;
    const galaxyRadius = Math.min(window.innerWidth, window.innerHeight) * 0.4;

    // Supermassive black hole at center
    newBodies.push({
      id: generateId(),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      mass: 5000,
      radius: calculateRadius(5000),
      color: '#fff',
      trail: []
    });

    for (let i = 0; i < numStars; i++) {
      const r = Math.random() * galaxyRadius;
      const theta = Math.random() * 2 * Math.PI;

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);

      // Calculate orbital velocity v = sqrt(G*M/r)
      // Perpendicular to radius vector
      const v = Math.sqrt((gravityConstant * 5000) / (r + 10)); // Softening to prevent extreme velocities near center
      const vx = -v * Math.sin(theta);
      const vy = v * Math.cos(theta);

      // Add some random variation
      const mass = Math.random() * 50 + 10;

      newBodies.push({
        id: generateId(),
        x,
        y,
        vx: vx + (Math.random() - 0.5) * 0.5,
        vy: vy + (Math.random() - 0.5) * 0.5,
        mass,
        radius: calculateRadius(mass),
        color: generateColor(),
        trail: []
      });
    }

    setBodies(newBodies);
    setGravityConstant(0.5); // Tune down gravity for stable galaxy
    setTimeStep(1.0);
  }, [gravityConstant]);

  const clearUniverse = () => {
    setBodies([]);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 font-sans">
      <GravityCanvas
        bodies={bodies}
        setBodies={setBodies}
        gravityConstant={gravityConstant}
        trailsEnabled={trailsEnabled}
        timeStep={timeStep}
      />

      {/* Intro Overlay */}
      {bodies.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-6 text-slate-300">
          <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter">
            Gravity Sandbox
          </h1>
          <p className="max-w-md text-lg text-slate-400 mb-8 opacity-80">
            Create your own universe. <br/>
            Tap and drag to launch planets. Pinch to zoom and pan.
          </p>
          <div className="animate-bounce mt-4">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      )}

      <Controls
        onSpawnGalaxy={spawnGalaxy}
        onClear={clearUniverse}
        gravityConstant={gravityConstant}
        setGravityConstant={setGravityConstant}
        trailsEnabled={trailsEnabled}
        setTrailsEnabled={setTrailsEnabled}
        timeStep={timeStep}
        setTimeStep={setTimeStep}
      />
    </div>
  );
}

export default App;
