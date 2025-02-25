import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { type ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

export const PinVertical = ({ color, size }: Props) => (
  <Svg viewBox="0 0 21 20" width={size} height={size}>
    <Path
      fill={color}
      d="M12.0682 3.45222V7.46363C12.0682 8.36218 12.365 9.19656 12.8705 9.87047H8.05678C8.57827 9.18051 8.85906 8.34614 8.85906 7.46363V3.45222H12.0682ZM14.475 1.84766H6.45222C6.01096 1.84766 5.64994 2.20868 5.64994 2.64994C5.64994 3.09119 6.01096 3.45222 6.45222 3.45222H7.2545V7.46363C7.2545 8.79541 6.17944 9.87047 4.84766 9.87047V11.475H9.63728V17.091L10.4396 17.8933L11.2418 17.091V11.475H16.0796V9.87047C14.7478 9.87047 13.6728 8.79541 13.6728 7.46363V3.45222H14.475C14.9163 3.45222 15.2773 3.09119 15.2773 2.64994C15.2773 2.20868 14.9163 1.84766 14.475 1.84766Z"
    />
  </Svg>
);
