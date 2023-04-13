import { FC } from 'react';
import classnames from 'classnames';

import { Props } from './types';

import styles from './Icons.module.css';

export const Latency: FC<Props> = ({ className }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <svg
      width="18"
      height="19"
      viewBox="0 0 18 19"
      fill="none"
      className={rootClassName}
    >
      <path
        d="M8.25 13.25C8.25 13.6625 8.5875 14 9 14C9.4125 14 9.75 13.6625 9.75 13.25C9.75 12.8375 9.4125 12.5 9 12.5C8.5875 12.5 8.25 12.8375 8.25 13.25ZM8.25 2.75V5.75H9.75V4.31C12.2925 4.6775 14.25 6.8525 14.25 9.5C14.25 12.4025 11.9025 14.75 9 14.75C6.0975 14.75 3.75 12.4025 3.75 9.5C3.75 8.24 4.1925 7.085 4.935 6.185L9 10.25L10.0575 9.1925L4.9575 4.0925V4.1075C3.315 5.3375 2.25 7.2875 2.25 9.5C2.25 13.2275 5.265 16.25 9 16.25C12.7275 16.25 15.75 13.2275 15.75 9.5C15.75 5.7725 12.7275 2.75 9 2.75H8.25ZM13.5 9.5C13.5 9.0875 13.1625 8.75 12.75 8.75C12.3375 8.75 12 9.0875 12 9.5C12 9.9125 12.3375 10.25 12.75 10.25C13.1625 10.25 13.5 9.9125 13.5 9.5ZM4.5 9.5C4.5 9.9125 4.8375 10.25 5.25 10.25C5.6625 10.25 6 9.9125 6 9.5C6 9.0875 5.6625 8.75 5.25 8.75C4.8375 8.75 4.5 9.0875 4.5 9.5Z"
        fill="white"
      />
    </svg>
  );
};
