import React from 'react';
import Svg, { G, Path, Rect, Circle, Line, Ellipse } from 'react-native-svg';

const SC = '#1e293b';
const SW = 3.5;

export default function CyclistSvg({ isWalking, isAction1, isAction2, size = 110 }) {
  const width = (240 / 400) * size;

  return (
    <Svg viewBox="-40 50 320 400" width={width} height={size}>
      <G transform="translate(50,200)">
        {/* Rear wheel */}
        <Circle cx="0" cy="100" r="45" fill="none" stroke={SC} strokeWidth="6"/>
        <Circle cx="0" cy="100" r="40" fill="none" stroke="#2a2a2a" strokeWidth="2"/>
        <Line x1="0" y1="55" x2="0" y2="145" stroke="#555" strokeWidth="1.5"/>
        <Line x1="-45" y1="100" x2="45" y2="100" stroke="#555" strokeWidth="1.5"/>
        <Circle cx="0" cy="100" r="6" fill={SC}/>
        {/* Front wheel */}
        <Circle cx="170" cy="100" r="45" fill="none" stroke={SC} strokeWidth="6"/>
        <Circle cx="170" cy="100" r="40" fill="none" stroke="#2a2a2a" strokeWidth="2"/>
        <Line x1="170" y1="55" x2="170" y2="145" stroke="#555" strokeWidth="1.5"/>
        <Line x1="125" y1="100" x2="215" y2="100" stroke="#555" strokeWidth="1.5"/>
        <Circle cx="170" cy="100" r="6" fill={SC}/>
        {/* Frame */}
        <Path d="M0,100 L70,15 L145,15 L170,100 M70,15 L95,100 L0,100" fill="none" stroke="#f1f5f9" strokeWidth="7" strokeLinejoin="round"/>
        <Path d="M0,100 L70,15 L145,15 L170,100 M70,15 L95,100 L0,100" fill="none" stroke={SC} strokeWidth="11" strokeLinejoin="round"/>
        {/* Handlebars */}
        <Path d="M145,15 L150,-15 C150,-25 130,-25 130,-15 L135,10" fill="none" stroke={SC} strokeWidth="7" strokeLinecap="round"/>
        {/* Seat post */}
        <Line x1="70" y1="15" x2="65" y2="-10" stroke={SC} strokeWidth="6"/>
        <Path d="M50,-10 L85,-10 L80,-18 L55,-18 Z" fill={SC}/>
        {/* Rider body */}
        <G>
          {/* Right leg */}
          <Path d="M75,10 L95,60 L110,55 L85,5 Z" fill="#1b3d28" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M95,60 L95,105 L110,105 L110,55 Z" fill="#754b2f" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Rect x="95" y="85" width="15" height="15" fill="#f8fafc" stroke={SC} strokeWidth={SW}/>
          <Path d="M90,100 L115,100 L120,110 L90,110 Z" fill="#2c364f" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          {/* Right arm */}
          <Path d="M70,-50 L95,-10 L125,-15" fill="none" stroke="#8d5a3a" strokeWidth="14" strokeLinecap="round"/>
          <Path d="M70,-50 L95,-10 L125,-15" fill="none" stroke={SC} strokeWidth="19" strokeLinecap="round"/>
          {/* Jersey */}
          <Path d="M65,-10 L50,-80 L105,-70 L85,-10 Z" fill="#f2ead1" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M55,-65 L102,-55 M58,-50 L98,-40 M60,-35 L93,-25" stroke="#2c364f" strokeWidth="5" strokeLinecap="round"/>
          {/* Head + helmet */}
          <G transform="translate(90,-95)">
            <Rect x="0" y="20" width="15" height="15" fill="#8d5a3a" stroke={SC} strokeWidth={SW}/>
            <Circle cx="10" cy="5" r="20" fill="#8d5a3a" stroke={SC} strokeWidth={SW}/>
            <Path d="M-5,10 C-5,25 5,35 15,35 C25,35 30,25 32,10 L-5,10 Z" fill="#c8cdce" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
            <Circle cx="15" cy="0" r="6" fill="none" stroke={SC} strokeWidth="2.5"/>
            <Line x1="21" y1="0" x2="30" y2="0" stroke={SC} strokeWidth="2.5"/>
            <Path d="M-15,-5 C-15,-25 5,-35 20,-35 C35,-35 45,-25 45,-5 C45,0 35,5 25,5 L-5,5 C-15,5 -15,-5 -15,-5 Z" fill="#2c364f" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          </G>
          {/* Left leg */}
          <Path d="M75,10 L105,45 L120,35 L85,5 Z" fill="#285a3b" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M105,45 L105,95 L120,95 L120,35 Z" fill="#8d5a3a" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Rect x="105" y="75" width="15" height="15" fill="#f8fafc" stroke={SC} strokeWidth={SW}/>
          <Path d="M100,90 L125,90 L130,100 L100,100 Z" fill="#2c364f" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          {/* Left arm */}
          <Path d="M90,-65 L135,-15" fill="none" stroke="#8d5a3a" strokeWidth="14" strokeLinecap="round"/>
          <Path d="M90,-65 L135,-15" fill="none" stroke={SC} strokeWidth="19" strokeLinecap="round"/>
          <Path d="M90,-65 L105,-45" fill="none" stroke="#f2ead1" strokeWidth="16" strokeLinecap="round"/>
          <Path d="M90,-65 L105,-45" fill="none" stroke={SC} strokeWidth="21" strokeLinecap="round"/>
        </G>
        {/* Bottom bracket */}
        <Circle cx="95" cy="100" r="18" fill="#e2e8f0" stroke={SC} strokeWidth={SW}/>
        <Circle cx="95" cy="100" r="6" fill={SC}/>
        <Circle cx="95" cy="100" r="2" fill="#fff"/>
      </G>
    </Svg>
  );
}
