import React from 'react';
import Svg, { G, Path, Rect, Circle, Line, Ellipse } from 'react-native-svg';

const SC = '#1e293b';
const SW = 3.5;

export default function PilotSvg({ isWalking, isAction1, isAction2, size = 110 }) {
  const width = (140 / 450) * size;

  return (
    <Svg viewBox="-20 0 180 450" width={width} height={size}>
      <G transform="translate(20,10)">
        {/* Leg 1 */}
        <G>
          <Path d="M35,240 L20,380 L15,390 L40,390 L45,240 Z" fill="#262f44" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M15,390 L10,420 L40,420 L40,390 Z" fill="#202530" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M10,420 L0,420 L0,430 L40,430 L40,420 Z" fill="#202530" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
        </G>
        {/* Leg 2 */}
        <G>
          <Path d="M45,240 L45,380 L40,390 L65,390 L60,240 Z" fill="#35405a" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M40,390 L40,420 L65,420 L65,390 Z" fill="#2e3642" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M40,420 L30,420 L30,430 L65,430 L65,420 Z" fill="#2e3642" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
        </G>
        {/* Body */}
        <G>
          {/* Right arm */}
          <Path d="M60,130 L75,170 L65,190" fill="none" stroke="#c0c5c7" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M60,130 L75,170 L65,190" fill="none" stroke={SC} strokeWidth="23" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Neck */}
          <Rect x="35" y="95" width="15" height="20" fill="#f3ac87" stroke={SC} strokeWidth={SW}/>
          {/* Head */}
          <Circle cx="42" cy="70" r="22" fill="#f3ac87" stroke={SC} strokeWidth={SW}/>
          {/* Helmet */}
          <Path d="M20,70 C20,40 64,40 64,70 C64,60 55,48 42,48 C29,48 20,60 20,70 Z" fill="#6289b8" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Circle cx="25" cy="75" r="5" fill="#f3ac87" stroke={SC} strokeWidth={SW}/>
          {/* Jacket top */}
          <Path d="M20,110 L15,165 L70,165 L65,110 Z" fill="#d5d7d8" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          {/* Jacket body */}
          <Path d="M25,115 L20,250 L65,250 L60,115 L42,130 Z" fill="#555e63" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Line x1="42" y1="130" x2="42" y2="250" stroke={SC} strokeWidth={SW}/>
          {/* Left arm */}
          <Path d="M25,130 L15,170 L40,195" fill="none" stroke="#d5d7d8" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M25,130 L15,170 L40,195" fill="none" stroke={SC} strokeWidth="21" strokeLinecap="round" strokeLinejoin="round"/>
          <Circle cx="43" cy="195" r="6" fill="#f3ac87" stroke={SC} strokeWidth={SW}/>
          {/* Controller in hand */}
          <G transform="translate(45,185) rotate(-10)">
            <Rect x="-25" y="-5" width="50" height="25" rx="4" fill="#88929b" stroke={SC} strokeWidth={SW}/>
            <Rect x="-15" y="-2" width="30" height="12" rx="1" fill="#cbd5e1" stroke={SC} strokeWidth="2"/>
          </G>
        </G>
        {/* Drone floating above */}
        <G transform="translate(100,40)">
          <Ellipse cx="-35" cy="-8" rx="15" ry="3" fill="#cbd5e1" stroke={SC} strokeWidth="1.5"/>
          <Ellipse cx="35" cy="-8" rx="15" ry="3" fill="#cbd5e1" stroke={SC} strokeWidth="1.5"/>
          <Path d="M-25,0 L-35,-5 M25,0 L35,-5 M-15,10 L-25,25 M15,10 L25,25" stroke={SC} strokeWidth="3" strokeLinecap="round"/>
          <Ellipse cx="0" cy="0" rx="25" ry="8" fill="#88929b" stroke={SC} strokeWidth={SW}/>
          <Ellipse cx="0" cy="0" rx="12" ry="5" fill="#a3afb8" stroke={SC} strokeWidth="2"/>
          <Rect x="-6" y="8" width="12" height="8" rx="2" fill="#333" stroke={SC} strokeWidth="2"/>
          <Circle cx="0" cy="12" r="2" fill="#fff"/>
          <Circle cx="-25" cy="2" r="2.5" fill="#ef4444"/>
          <Circle cx="25" cy="2" r="2.5" fill="#22c55e"/>
        </G>
      </G>
    </Svg>
  );
}
