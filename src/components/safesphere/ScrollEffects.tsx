import { useEffect, useRef } from "react";

/** Native scrolling stays untouched, especially during emergency interactions. */
export function ScrollEffects() {
  const marker = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = marker.current;
    const root = element?.closest("main");
    if (!element || !root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let observer: IntersectionObserver | undefined;
    const observed = new Set<HTMLElement>();

    const reveal = (target: HTMLElement) => {
      target.classList.add("scroll-visible");
      observer?.unobserve(target);
    };
    const collect = () => {
      root.querySelectorAll<HTMLElement>("[data-scroll-reveal], article.glass-panel, footer").forEach((target) => {
        if (observed.has(target)) return;
        observed.add(target);
        if (motion.matches || !observer) return;
        // Only animate content approaching the viewport; never hide active controls.
        if (target.getBoundingClientRect().top < window.innerHeight * 0.94) return;
        target.classList.add("scroll-pending");
        observer.observe(target);
      });
    };
    const update = () => {
      frame = 0;
      const extent = document.documentElement.scrollHeight - window.innerHeight;
      element.style.setProperty("--scroll-progress", String(extent > 0 ? Math.min(1, Math.max(0, window.scrollY / extent)) : 0));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        const target = event.target.closest<HTMLElement>(".scroll-pending");
        if (target) reveal(target);
      }
    };
    const configure = () => {
      observer?.disconnect();
      observed.forEach((target) => target.classList.remove("scroll-pending", "scroll-visible"));
      observed.clear();
      if (!motion.matches && "IntersectionObserver" in window) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => { if (entry.isIntersecting && entry.target instanceof HTMLElement) reveal(entry.target); });
        }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
      } else observer = undefined;
      collect();
      update();
    };
    configure();
    const changes = new MutationObserver(() => { collect(); onScroll(); });
    changes.observe(root, { childList: true, subtree: true });
    const resize = new ResizeObserver(onScroll);
    resize.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    root.addEventListener("focusin", onFocus);
    motion.addEventListener("change", configure);
    return () => {
      observer?.disconnect(); changes.disconnect(); resize.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.removeEventListener("focusin", onFocus);
      motion.removeEventListener("change", configure);
      observed.forEach((target) => target.classList.remove("scroll-pending", "scroll-visible"));
    };
  }, []);

  return <div ref={marker} aria-hidden="true" className="campus-scroll-progress" />;
}