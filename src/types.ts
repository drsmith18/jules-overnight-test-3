export interface Body {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  color: string;
  radius: number;
  trail: { x: number; y: number }[];
}

export interface Vector {
  x: number;
  y: number;
}

const MAX_RADIUS = 30;

export const calculateRadius = (mass: number) => {
  return Math.max(2, Math.min(MAX_RADIUS, Math.sqrt(mass)));
};

export const generateColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 60%)`;
};

export const generateId = () => Math.random().toString(36).substring(2, 9);
