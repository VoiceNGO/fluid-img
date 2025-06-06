// @ts-expect-error - React is not a dependency of seams
import React, { useRef, useEffect } from 'react';

// Always available props
interface BaseSeamProps {
  src: string;
  carvingPriority?: number;
  visibleSeamRemoval?: boolean;
  seamRemovalTimeMS?: number;
  seamRemovalOverlapMS?: number;
  prepare?: 'load' | 'resize';
  onSeamReady?: (seam: any) => void;
}

// Pregenerated seams configuration (default case)
interface PregeneratedSeamConfig {
  generateSeamsInBrowser?: false;
  seamSrc?: string;
}

// Generated seams configuration
interface GeneratedSeamConfig {
  generateSeamsInBrowser: true;
  maxSeams?: number;
  percentSeams?: number;
  allowHorizontalResize?: boolean;
  allowVerticalResize?: boolean;
  stepSize?: number;
  mergeSize?: number;
  allowStraight?: boolean;
}

// Final discriminated union
type SeamProps = BaseSeamProps & (PregeneratedSeamConfig | GeneratedSeamConfig);

const SeamComponent: React.FC<SeamProps> = ({
  src,
  seamSrc,
  generateSeamsInBrowser = false,
  carvingPriority = 1,
  visibleSeamRemoval = false,
  seamRemovalTimeMS = 50,
  seamRemovalOverlapMS = 10,
  prepare = 'load',
  maxSeams = -1,
  percentSeams = 0.5,
  allowHorizontalResize = true,
  allowVerticalResize = true,
  stepSize = 1,
  mergeSize = 1,
  allowStraight = true,
  onSeamReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const seamInstanceRef = useRef<Seam | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const effectiveSeamSrc = generateSeamsInBrowser
    ? ''
    : seamSrc || src.replace(/\.[^/.]+$/, '') + '.seam';

  useEffect(() => {
    if (!containerRef.current) return;

    seamInstanceRef.current = new Seam(containerRef.current);

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (seamInstanceRef.current) {
          seamInstanceRef.current.setSize(width, height);
        }
      }
    });

    resizeObserverRef.current.observe(containerRef.current);

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      seamInstanceRef.current = null;
    };
  }, []);

  // Handle prop changes
  useEffect(() => {
    if (!seamInstanceRef.current) return;

    seamInstanceRef.current
      .setSrc(src)
      .setSeamSrc(effectiveSeamSrc)
      .setOptions({
        carvingPriority,
        visibleSeamRemoval,
        seamRemovalTimeMS,
        seamRemovalOverlapMS,
        // Seam generation options (only when generating seams in browser)
        ...(generateSeamsInBrowser === true && {
          maxSeams,
          percentSeams,
          allowHorizontalResize,
          allowVerticalResize,
          stepSize,
          mergeSize,
          allowStraight,
        }),
      });

    // Handle prepare option
    if (prepare === 'load') {
      seamInstanceRef.current.prepare();
    }

    // Expose seam instance to parent components
    if (onSeamReady) {
      onSeamReady(seamInstanceRef.current);
    }
  }, [
    src,
    effectiveSeamSrc,
    carvingPriority,
    visibleSeamRemoval,
    seamRemovalTimeMS,
    seamRemovalOverlapMS,
    generateSeamsInBrowser,
    maxSeams,
    percentSeams,
    allowHorizontalResize,
    allowVerticalResize,
    stepSize,
    mergeSize,
    allowStraight,
    prepare,
    onSeamReady,
  ]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default SeamComponent;
