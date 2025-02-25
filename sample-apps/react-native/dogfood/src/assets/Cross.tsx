import React from 'react';
import { Svg, Path, SvgProps } from 'react-native-svg';
import { type ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
} & Pick<SvgProps, 'style'>;

export const Cross = ({ color, style }: Props) => (
  <Svg viewBox="0 0 12 13" style={style}>
    <Path
      d="M 0.322153 11.8408 C 0.700083 12.2188 1.34168 12.21 1.71083 11.8408 L 5.99989 7.56055 L 10.2802 11.8408 C 10.6493 12.21 11.2909 12.2188 11.6688 11.8408 C 12.0468 11.4629 12.038 10.8213 11.6688 10.4521 L 7.38856 6.16309 L 11.6688 1.88281 C 12.038 1.51367 12.0468 0.87207 11.6688 0.494141 C 11.2909 0.116211 10.6493 0.125 10.2802 0.494141 L 5.99989 4.77441 L 1.71083 0.485352 C 1.34168 0.125 0.700083 0.116211 0.322153 0.494141 C -0.0557764 0.87207 -0.0469874 1.51367 0.322153 1.88281 L 4.60243 6.16309 L 0.322153 10.4521 C -0.0469874 10.8213 -0.0557764 11.4629 0.322153 11.8408 Z"
      fill={color}
    />
  </Svg>
);
