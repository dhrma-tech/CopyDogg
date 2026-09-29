"use client";

import { useEffect, useRef, useState } from "react";

export function Reveal({
  children,
  className = "",
  pop = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  pop?: boolean;
  as?: "div" | "h2";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Comp = Tag as "div";
  return (
    <Comp ref={ref} className={`${pop ? "landing-pop" : "landing-reveal"} ${inView ? "is-in" : ""} ${className}`}>
      {children}
    </Comp>
  );
}
