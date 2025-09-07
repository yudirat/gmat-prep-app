// This component dynamically loads the KaTeX CSS and JavaScript files.
import React, { useEffect } from 'react';

/**
 * KaTeXLoader component dynamically loads the KaTeX CSS and JavaScript files into the document head.
 * This ensures that mathematical expressions rendered with KaTeX are styled and functional.
 * It only loads the files once and cleans them up when the component unmounts.
 */
export default function KaTeXLoader() {
  useEffect(() => {
    // Check if KaTeX CSS is already loaded to prevent duplicates
    if (document.getElementById('katex-css')) return;
    const cssLink = document.createElement('link');
    cssLink.id = 'katex-css';
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(cssLink);

    // Check if KaTeX JavaScript is already loaded to prevent duplicates
    if (document.getElementById('katex-js')) return;
    const script = document.createElement('script');
    script.id = 'katex-js';
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    script.async = true; // Load asynchronously
    document.head.appendChild(script);

    // Cleanup function: remove the added CSS and JS when the component unmounts
    return () => {
      const css = document.getElementById('katex-css');
      const js = document.getElementById('katex-js');
      if (css) document.head.removeChild(css);
      if (js) document.head.removeChild(js);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // This component does not render anything to the DOM directly
  return null;
};