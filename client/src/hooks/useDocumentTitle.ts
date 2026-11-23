import { useEffect } from 'react';

// Sets the browser tab title for the current page, e.g. "Dashboard · JobTrack AI".
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · JobTrack AI` : 'JobTrack AI';
  }, [title]);
}
