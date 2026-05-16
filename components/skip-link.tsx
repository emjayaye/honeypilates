import React from 'react';
import { Platform } from 'react-native';

// Web-only skip-to-main-content link. Renders as a real <a href="#main">
// that's offscreen by default and becomes visible when keyboard-focused.
// Native platforms render nothing (the OS-level accessibility nav handles
// screen-reader skip-around).
export function SkipLink() {
  if (Platform.OS !== 'web') return null;
  return React.createElement(
    'a' as any,
    { href: '#main-content', className: 'ros-skip-link' },
    'Skip to main content',
  );
}

// Pair with the SkipLink target — wraps the page in a focusable element
// with id="main-content" so the skip-link's anchor resolves.
export function MainLandmark({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return React.createElement(
    'main' as any,
    { id: 'main-content', tabIndex: -1, style: { display: 'contents' } },
    children,
  );
}
