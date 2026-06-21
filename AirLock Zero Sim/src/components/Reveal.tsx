import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

type RevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  y?: number;
};

/**
 * SSR-safe mount-based reveal. Renders at final state on the server (so content
 * is visible if JS never hydrates / is slow), then re-mounts animating after
 * hydration on the client. Composes inside <Stagger> via variants.
 */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
  ...rest
}: RevealProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (reduced || !mounted) {
    // SSR + first paint: render visible, no animation
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1], delay }}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] } },
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  delay = 0,
  step = 0.07,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  step?: number;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (reduced || !mounted) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: step, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
