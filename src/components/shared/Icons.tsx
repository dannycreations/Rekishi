import { memo } from 'react';

import type { FC, JSX, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

const createIcon = (Component: FC<IconProps>) => {
  const MemoizedComponent = memo(Component);
  MemoizedComponent.displayName = `${Component.name || 'Icon'}`;
  return MemoizedComponent;
};

export const ExportIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const BlacklistDomainIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export const CalendarIcon = createIcon((props: IconProps) => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const CheckIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export const ChevronLeftIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export const ChevronRightIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export const CloseIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export const DesktopIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M9 17.25v1.5m3-1.5v1.5m3-1.5v1.5M17.25 4.5h-10.5a2.25 2.25 0 00-2.25 2.25v7.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const DevicesIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const ExternalLinkIcon = createIcon((props: IconProps) => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 0V6.75A.75.75 0 0114.25 6h4.5m-4.5 0l4.5-4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const GlobeIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.004 9.004 0 013 12c0-1.612.448-3.113 1.284-4.418"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const LaptopIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const LoadingSpinnerIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
});

export const LogoIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export const RegexIcon = createIcon((props: IconProps) => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M8 3L4 21" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 3L16 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export const SearchIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export const SettingsIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const TrashIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.144-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.057-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const ArrowUpIcon = createIcon((props: IconProps): JSX.Element => {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 19.5v-15m-6.75 6.75L12 4.5l6.75 6.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});
