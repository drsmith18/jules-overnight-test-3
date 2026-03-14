import React, { useState } from 'react';
import { Settings, Play, Pause, RefreshCw, Trash2, Crosshair, ChevronUp, ChevronDown } from 'lucide-react';

interface ControlsProps {
  onSpawnGalaxy: () => void;
  onClear: () => void;
  gravityConstant: number;
  setGravityConstant: (val: number) => void;
  trailsEnabled: boolean;
  setTrailsEnabled: (val: boolean) => void;
  timeStep: number;
  setTimeStep: (val: number) => void;
}

const Controls: React.FC<ControlsProps> = ({
  onSpawnGalaxy,
  onClear,
  gravityConstant,
  setGravityConstant,
  trailsEnabled,
  setTrailsEnabled,
  timeStep,
  setTimeStep
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
      {/* Expanded Menu */}
      <div
        className={`bg-slate-800/80 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-4 mb-4 text-slate-200 transition-all duration-300 ease-in-out origin-bottom w-80 shadow-2xl ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
          <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
            <Settings size={18} className="text-blue-400" />
            Universe Settings
          </h2>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex items-center gap-1 text-sm"
            title="Clear Universe"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Gravity Control */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Gravitational Constant</label>
              <span>{gravityConstant.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={gravityConstant}
              onChange={(e) => setGravityConstant(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Time Step (Speed) Control */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Simulation Speed</label>
              <span>{timeStep.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={timeStep}
              onChange={(e) => setTimeStep(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm">Orbital Trails</span>
            <button
              onClick={() => setTrailsEnabled(!trailsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                trailsEnabled ? 'bg-blue-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  trailsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              onSpawnGalaxy();
              setIsOpen(false);
            }}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Spawn Galaxy
          </button>
        </div>
      </div>

      {/* Main Control Bar */}
      <div className="flex gap-2 items-center bg-slate-800/90 backdrop-blur-md p-2 rounded-full border border-slate-700/50 shadow-xl">
        <button
          onClick={() => setTimeStep(timeStep === 0 ? 1 : 0)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          title={timeStep === 0 ? "Play" : "Pause"}
        >
          {timeStep === 0 ? <Play size={24} className="ml-1" /> : <Pause size={24} />}
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-6 h-12 flex items-center gap-2 rounded-full font-medium transition-all ${
            isOpen ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
        >
          <Crosshair size={20} />
          Controls
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
    </div>
  );
};

export default Controls;
