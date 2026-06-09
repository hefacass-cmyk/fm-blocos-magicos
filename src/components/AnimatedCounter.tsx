import { useEffect, useRef, useState } from 'react';

import { useInView } from 'framer-motion';

interface AnimatedCounterProps {

  target: number;

  duration?: number;

  suffix?: string;

}

export function AnimatedCounter({ target, duration = 1800, suffix = '' }: AnimatedCounterProps) {

  const ref = useRef<HTMLSpanElement>(null);

  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const [count, setCount] = useState(0);

  useEffect(() => {

    if (!isInView) return;

    const steps = 60;

    const stepDuration = duration / steps;

    let current = 0;

    const timer = setInterval(() => {

      current += 1;

      setCount(Math.round((current / steps) * target));

      if (current >= steps) clearInterval(timer);

    }, stepDuration);

    return () => clearInterval(timer);

  }, [isInView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;

}
