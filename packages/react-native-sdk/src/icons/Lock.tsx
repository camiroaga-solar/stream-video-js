import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

export const Lock = ({ color, size }: Props) => {
  return (
    <Svg viewBox={'0 0 23 25'} width={size} height={size}>
      <Path
        fill={color}
        d="M15.1992 23.5273C15.2852 23.3164 15.3281 23.1055 15.3281 22.8945C15.3281 22.3633 15.1836 21.8438 14.8945 21.3359L9.82031 12.2539C9.53125 11.7305 9.13672 11.332 8.63672 11.0586C8.14453 10.7773 7.625 10.6367 7.07812 10.6367C6.96094 10.6367 6.86719 10.6406 6.79688 10.6484C6.96875 10.4531 7.17188 10.293 7.40625 10.168C7.64844 10.043 7.92578 9.96484 8.23828 9.93359V7.08594C8.23828 5.98438 8.39844 5.02344 8.71875 4.20312C9.04688 3.38281 9.49219 2.70312 10.0547 2.16406C10.6172 1.61719 11.2539 1.21094 11.9648 0.945312C12.6758 0.671875 13.4141 0.535156 14.1797 0.535156C14.9453 0.535156 15.6836 0.671875 16.3945 0.945312C17.1055 1.21094 17.7422 1.61719 18.3047 2.16406C18.8672 2.70312 19.3125 3.38281 19.6406 4.20312C19.9688 5.02344 20.1328 5.98438 20.1328 7.08594V9.93359C20.7969 10.0273 21.3008 10.3047 21.6445 10.7656C21.9961 11.2188 22.1719 11.8516 22.1719 12.6641V20.7383C22.1719 21.6602 21.9492 22.3555 21.5039 22.8242C21.0586 23.293 20.4062 23.5273 19.5469 23.5273H15.1992ZM10.0898 9.88672H18.2695V6.82812C18.2695 5.84375 18.0781 5.01562 17.6953 4.34375C17.3203 3.67188 16.8203 3.16406 16.1953 2.82031C15.5781 2.47656 14.9062 2.30469 14.1797 2.30469C13.4453 2.30469 12.7695 2.47656 12.1523 2.82031C11.5352 3.16406 11.0352 3.67188 10.6523 4.34375C10.2773 5.01562 10.0898 5.84375 10.0898 6.82812V9.88672ZM1.98047 24.4648C1.49609 24.4648 1.11328 24.3125 0.832031 24.0078C0.542969 23.7031 0.398438 23.332 0.398438 22.8945C0.398438 22.6211 0.46875 22.3633 0.609375 22.1211L5.68359 13.0391C5.83203 12.7734 6.03125 12.5742 6.28125 12.4414C6.53125 12.3008 6.78906 12.2305 7.05469 12.2305C7.32031 12.2305 7.57422 12.3008 7.81641 12.4414C8.05859 12.5742 8.25781 12.7734 8.41406 13.0391L13.5 22.1094C13.6406 22.3594 13.7109 22.6211 13.7109 22.8945C13.7109 23.332 13.5664 23.7031 13.2773 24.0078C12.9961 24.3125 12.6133 24.4648 12.1289 24.4648H1.98047ZM7.05469 22.6836C7.32812 22.6836 7.55859 22.5859 7.74609 22.3906C7.94141 22.1953 8.04297 21.9609 8.05078 21.6875C8.05078 21.4219 7.95312 21.1914 7.75781 20.9961C7.5625 20.8008 7.32812 20.7031 7.05469 20.7031C6.78906 20.7031 6.55859 20.8008 6.36328 20.9961C6.16797 21.1914 6.07031 21.4219 6.07031 21.6875C6.07031 21.9609 6.16797 22.1953 6.36328 22.3906C6.55859 22.5859 6.78906 22.6836 7.05469 22.6836ZM7.05469 19.8828C7.26562 19.8828 7.43359 19.8203 7.55859 19.6953C7.69141 19.5703 7.76172 19.4062 7.76953 19.2031L7.86328 15.8516C7.87109 15.6172 7.80078 15.4258 7.65234 15.2773C7.50391 15.1211 7.30469 15.043 7.05469 15.043C6.8125 15.043 6.61719 15.1211 6.46875 15.2773C6.32031 15.4258 6.25 15.6172 6.25781 15.8516L6.35156 19.2031C6.35156 19.4062 6.41797 19.5703 6.55078 19.6953C6.68359 19.8203 6.85156 19.8828 7.05469 19.8828Z"
      />
    </Svg>
  );
};
