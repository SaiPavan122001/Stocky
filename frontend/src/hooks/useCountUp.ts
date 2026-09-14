import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

/** Animates a number from its previous value to `target` whenever it changes. */
export function useCountUp(target: number, duration = 0.8): number {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);

  useEffect(() => {
    const controls = animate(prevTarget.current, target, {
      duration,
      ease: "easeOut",
      onUpdate: setValue,
    });
    prevTarget.current = target;
    return () => controls.stop();
  }, [target, duration]);

  return value;
}
