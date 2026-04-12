import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import Svg, { G, Path, Rect, Circle, Line, Ellipse } from 'react-native-svg';

const SC = '#1e293b';
const SW = 3.5;

const AnimatedG = Animated.createAnimatedComponent(G);

export default function ArchitectSvg({ isWalking, isAction1, isAction2, size = 110 }) {
  const width = (150 / 450) * size;

  const legAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let legLoop, bobLoop;
    if (isWalking) {
      legLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(legAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(legAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        ])
      );
      legLoop.start();
      bobLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bobAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(bobAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        ])
      );
      bobLoop.start();
    } else {
      legAnim.stopAnimation(); legAnim.setValue(0);
      bobAnim.stopAnimation(); bobAnim.setValue(0);
    }
    return () => {
      legLoop?.stop();
      bobLoop?.stop();
    };
  }, [isWalking]);

  const leg1R = legAnim.interpolate({ inputRange: [0, 1], outputRange: ['-20deg', '20deg'] });
  const leg2R = legAnim.interpolate({ inputRange: [0, 1], outputRange: ['20deg', '-20deg'] });
  const bobY  = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  const legTransform1 = (r) => [{
    translateX: -(150 * 0.5) * 0,
  }];

  return (
    <Svg viewBox="0 0 150 450" width={width} height={size}>
      <G transform="translate(30,10)">
        {/* Leg 1 */}
        <G>
          <Path d="M40,240 L30,370 L25,380 L50,380 L50,240 Z" fill="#6a784c" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M25,380 L25,415 L50,415 L50,380 Z" fill="#845136" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M25,415 L15,415 L15,425 L50,425 L50,415 Z" fill="#845136" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
        </G>
        {/* Leg 2 */}
        <G>
          <Path d="M50,240 L45,370 L40,380 L65,380 L65,240 Z" fill="#7d8c58" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Rect x="35" y="365" width="35" height="15" rx="3" fill="#93a36c" stroke={SC} strokeWidth={SW}/>
          <Path d="M40,380 L40,415 L65,415 L65,380 Z" fill="#955b3e" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M40,415 L30,415 L30,425 L65,425 L65,415 Z" fill="#955b3e" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
        </G>
        {/* Body */}
        <G>
          {/* Right arm holding ruler */}
          <Path d="M60,130 L95,170 L115,145" fill="none" stroke="#6a784c" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M60,130 L95,170 L115,145" fill="none" stroke={SC} strokeWidth="23" strokeLinecap="round" strokeLinejoin="round"/>
          <Circle cx="115" cy="145" r="8" fill="#f3ac87" stroke={SC} strokeWidth={SW}/>
          {/* Torso */}
          <Path d="M35,115 L25,165 L35,260 L65,260 L75,165 L65,115 Z" fill="#7d8c58" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Path d="M40,115 L50,140 L60,115" fill="none" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
          <Line x1="50" y1="140" x2="50" y2="260" stroke={SC} strokeWidth={SW}/>
          <Rect x="32" y="225" width="36" height="10" fill="#7d8c58" stroke={SC} strokeWidth={SW} rx="2"/>
          {/* Neck */}
          <Rect x="42" y="95" width="16" height="25" fill="#f3ac87" stroke={SC} strokeWidth={SW}/>
          {/* Head */}
          <Circle cx="50" cy="75" r="22" fill="#f3ac87" stroke={SC} strokeWidth={SW}/>
          {/* Glasses */}
          <Circle cx="45" cy="70" r="7" fill="none" stroke={SC} strokeWidth="2.5"/>
          <Circle cx="65" cy="70" r="7" fill="none" stroke={SC} strokeWidth="2.5"/>
          <Line x1="52" y1="70" x2="58" y2="70" stroke={SC} strokeWidth="2.5"/>
          <Line x1="72" y1="70" x2="80" y2="65" stroke={SC} strokeWidth="2.5"/>
          {/* Hard hat */}
          <Circle cx="35" cy="50" r="14" fill="#efc849" stroke={SC} strokeWidth={SW}/>
          <Circle cx="55" cy="42" r="16" fill="#efc849" stroke={SC} strokeWidth={SW}/>
          <Circle cx="70" cy="55" r="13" fill="#efc849" stroke={SC} strokeWidth={SW}/>
          <Circle cx="30" cy="70" r="12" fill="#efc849" stroke={SC} strokeWidth={SW}/>
          <Circle cx="72" cy="75" r="11" fill="#efc849" stroke={SC} strokeWidth={SW}/>
          <Circle cx="48" cy="35" r="12" fill="#efc849" stroke={SC} strokeWidth={SW}/>
          {/* Left arm */}
          <Path d="M45,130 L20,175 L40,195" fill="none" stroke="#7d8c58" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M45,130 L20,175 L40,195" fill="none" stroke={SC} strokeWidth="23" strokeLinecap="round" strokeLinejoin="round"/>
          <Circle cx="45" cy="200" r="7" fill="#f3ac87" stroke={SC} strokeWidth={SW}/>
          {/* Ruler in hand */}
          <G transform="translate(-15,155) rotate(-20)">
            <Rect x="0" y="0" width="85" height="18" fill="#fff" stroke={SC} strokeWidth={SW} rx="2"/>
            <Path d="M75,0 L85,9 L75,18 Z" fill="#cbd5e1" stroke={SC} strokeWidth={SW} strokeLinejoin="round"/>
            <Line x1="15" y1="0" x2="15" y2="18" stroke={SC} strokeWidth="2"/>
            <Line x1="65" y1="0" x2="65" y2="18" stroke={SC} strokeWidth="2"/>
          </G>
        </G>
      </G>
    </Svg>
  );
}
