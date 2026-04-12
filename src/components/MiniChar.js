import React from 'react';
import ArchitectSvg from '../characters/ArchitectSvg';
import PilotSvg from '../characters/PilotSvg';
import CyclistSvg from '../characters/CyclistSvg';

const MAP = { architect: ArchitectSvg, pilot: PilotSvg, cyclist: CyclistSvg };

export default function MiniChar({ type, size = 48 }) {
  const C = MAP[type] || CyclistSvg;
  return <C isWalking={false} isAction1={false} isAction2={false} size={size} />;
}
