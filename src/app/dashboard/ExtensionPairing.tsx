'use client';

import { useEffect } from 'react';

type Props = { ss_uid?: string };

export default function ExtensionPairing({ ss_uid }: Props) {
  useEffect(() => {
    if (!ss_uid) return;

    // Send to content script running in this same page context
    window.postMessage({ type: 'SS_AUTH', ss_uid }, window.location.origin);
  }, [ss_uid]);

  return null;
}
