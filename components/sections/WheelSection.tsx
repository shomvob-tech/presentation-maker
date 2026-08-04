"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  ClipboardCheck,
  Handshake,
  RadioTower,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { FadeInView } from "@/components/ui/FadeInView";

type Pillar = {
  id: string;
  number: string;
  shortLabel: string;
  title: string;
  points: string[];
  fillHex: string;
  lightText?: boolean;
  Icon: LucideIcon;
};

const PILLARS: Pillar[] = [
  {
    id: "pillar-1",
    number: "01",
    shortLabel: "Pillar 1",
    title: "Pillar 1 Title",
    points: ["Pillar 1 point A", "Pillar 1 point B", "Pillar 1 point C"],
    fillHex: "#1d3068",
    Icon: Briefcase,
  },
  {
    id: "pillar-2",
    number: "02",
    shortLabel: "Pillar 2",
    title: "Pillar 2 Title",
    points: ["Pillar 2 point A", "Pillar 2 point B", "Pillar 2 point C"],
    fillHex: "#234058",
    Icon: ClipboardCheck,
  },
  {
    id: "pillar-3",
    number: "03",
    shortLabel: "Pillar 3",
    title: "Pillar 3 Title",
    points: ["Pillar 3 point A", "Pillar 3 point B", "Pillar 3 point C"],
    fillHex: "#2153ac",
    Icon: TriangleAlert,
  },
  {
    id: "pillar-4",
    number: "04",
    shortLabel: "Pillar 4",
    title: "Pillar 4 Title",
    points: ["Pillar 4 point A", "Pillar 4 point B", "Pillar 4 point C"],
    fillHex: "#274c66",
    Icon: Target,
  },
  {
    id: "pillar-5",
    number: "05",
    shortLabel: "Pillar 5",
    title: "Pillar 5 Title",
    points: ["Pillar 5 point A", "Pillar 5 point B", "Pillar 5 point C"],
    fillHex: "#2577c0",
    Icon: Users,
  },
  {
    id: "pillar-6",
    number: "06",
    shortLabel: "Pillar 6",
    title: "Pillar 6 Title",
    points: ["Pillar 6 point A", "Pillar 6 point B", "Pillar 6 point C"],
    fillHex: "#28a7ce",
    lightText: true,
    Icon: Handshake,
  },
];

const CYCLE: (string | null)[] = [null, ...PILLARS.map((p) => p.id)];
const NORMAL_DWELL_MS = 3500;
const EXTENDED_DWELL_MS = 9000;

const VIEW_SIZE = 400;
const CENTER = VIEW_SIZE / 2;
const OUTER_R = 194;
const INNER_R = 98;
const SECTOR_ANGLE = 360 / PILLARS.length;
const LABEL_RADIUS = (OUTER_R + INNER_R) / 2;

const GLOW_OFF =
  "drop-shadow(0 0 0px rgba(40,167,206,0)) drop-shadow(0 0 0px rgba(40,167,206,0))";
const GLOW_ON =
  "drop-shadow(0 0 5px rgba(40,167,206,0.9)) drop-shadow(0 0 16px rgba(40,167,206,0.75))";

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: round(cx + r * Math.cos(angleRad)),
    y: round(cy + r * Math.sin(angleRad)),
  };
}

function describeSectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

function useHasHoverCapability() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

function DetailIconBadge({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-wheel_accent/15">
      <Icon className="h-5 w-5 text-wheel_accent" aria-hidden="true" />
    </div>
  );
}

function CenterSummary() {
  return (
    <div>
      <div className="flex items-start gap-4">
        <DetailIconBadge Icon={RadioTower} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wheel_accent">
            Center Pillar
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Center overview title
          </h3>
        </div>
      </div>
      <p className="mt-5 text-base leading-7 text-slate-200">
        Center pillar description. Explore a pillar on the wheel — or a chip
        below — to see details.
      </p>
    </div>
  );
}

function PillarDetail({ pillar }: { pillar: Pillar }) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <DetailIconBadge Icon={pillar.Icon} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wheel_accent">
            {pillar.shortLabel}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {pillar.title}
          </h3>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {pillar.points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <span
              className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-wheel_accent"
              aria-hidden="true"
            />
            <span className="text-base leading-7 text-slate-200">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PillarChips({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PILLARS.map((pillar) => {
        const isActive = activeId === pillar.id;
        return (
          <button
            key={pillar.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(pillar.id)}
            className={[
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
              isActive
                ? "border-wheel_accent bg-wheel_accent text-wheel_dark1"
                : "border-white/15 bg-white/5 text-slate-200 hover:border-wheel_accent/60 hover:text-white",
            ].join(" ")}
          >
            {pillar.number} {pillar.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

type PillarWheelProps = {
  activeId: string | null;
  prefersReducedMotion: boolean;
  onSelect: (id: string) => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
};

function PillarWheel({
  activeId,
  prefersReducedMotion,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: PillarWheelProps) {
  const scaleTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 12 };

  const paintOrder = [...PILLARS.keys()].sort(
    (a, b) =>
      Number(PILLARS[a].id === activeId) - Number(PILLARS[b].id === activeId),
  );

  const hubActive = activeId === null;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px] sm:max-w-[500px] md:max-w-[560px]">
      <div
        className="absolute inset-6 rounded-full bg-wheel_accent/10 blur-3xl"
        aria-hidden="true"
      />

      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="relative h-full w-full select-none overflow-visible"
        role="group"
        aria-label="Six-pillar wheel"
      >
        <defs>
          <pattern
            id="wheelTexture"
            patternUnits="userSpaceOnUse"
            width={VIEW_SIZE}
            height={VIEW_SIZE}
          >
            <image
              href="/images/wheel-texture.jpeg"
              x="0"
              y="0"
              width={VIEW_SIZE}
              height={VIEW_SIZE}
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        </defs>

        {paintOrder.map((index) => {
          const pillar = PILLARS[index];
          const startAngle = index * SECTOR_ANGLE;
          const endAngle = startAngle + SECTOR_ANGLE;
          const path = describeSectorPath(
            CENTER,
            CENTER,
            INNER_R,
            OUTER_R,
            startAngle,
            endAngle,
          );
          const isActive = activeId === pillar.id;

          return (
            <g key={pillar.id}>
              <motion.path
                d={path}
                fill={pillar.fillHex}
                stroke={isActive ? "#ffffff" : "#182837"}
                strokeWidth={isActive ? 2.5 : 2}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`Pillar ${pillar.number}: ${pillar.title}`}
                className="cursor-pointer outline-none transition-[filter] duration-500 ease-out hover:brightness-110 focus-visible:brightness-125"
                style={{
                  transformOrigin: "200px 200px",
                  transformBox: "view-box",
                  filter: isActive ? GLOW_ON : GLOW_OFF,
                }}
                animate={{ scale: isActive ? 1.06 : 1 }}
                transition={scaleTransition}
                onClick={() => onSelect(pillar.id)}
                onKeyDown={(event: KeyboardEvent<SVGPathElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(pillar.id);
                  }
                }}
                onMouseEnter={() => onHoverStart(pillar.id)}
                onMouseLeave={onHoverEnd}
              >
                <title>
                  Pillar {pillar.number}: {pillar.title}
                </title>
              </motion.path>
              <motion.path
                d={path}
                fill="url(#wheelTexture)"
                pointerEvents="none"
                style={{
                  transformOrigin: "200px 200px",
                  transformBox: "view-box",
                }}
                animate={{
                  scale: isActive ? 1.06 : 1,
                  opacity: isActive ? 1 : 0,
                }}
                transition={scaleTransition}
              />
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0">
        {PILLARS.map((pillar, index) => {
          const startAngle = index * SECTOR_ANGLE;
          const midAngle = startAngle + SECTOR_ANGLE / 2;
          const pos = polarToCartesian(
            CENTER,
            CENTER,
            LABEL_RADIUS,
            midAngle,
          );
          const isActive = activeId === pillar.id;
          const inactiveDark = Boolean(pillar.lightText) && !isActive;

          return (
            <motion.div
              key={pillar.id}
              className="absolute flex flex-col items-center gap-1"
              style={{
                left: `${(pos.x / VIEW_SIZE) * 100}%`,
                top: `${(pos.y / VIEW_SIZE) * 100}%`,
                filter: isActive ? GLOW_ON : GLOW_OFF,
              }}
              animate={{
                scale: isActive ? 1.06 : 1,
                x: "-50%",
                y: "-50%",
              }}
              transition={scaleTransition}
            >
              <pillar.Icon
                size={18}
                aria-hidden="true"
                className={[
                  inactiveDark ? "text-wheel_dark1" : "text-white",
                  isActive ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "text-[13px] font-semibold uppercase tracking-wide",
                  inactiveDark ? "text-wheel_dark1" : "text-white",
                  isActive ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]" : "",
                ].join(" ")}
              >
                {pillar.shortLabel}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.button
          type="button"
          aria-label="Reset to center overview"
          aria-pressed={hubActive}
          className="pointer-events-auto relative aspect-square w-[41%] overflow-hidden rounded-full border border-wheel_accent/35 bg-wheel_dark2 shadow-[0_10px_40px_rgba(0,0,0,0.35)] outline-none"
          style={{ filter: hubActive ? GLOW_ON : GLOW_OFF }}
          animate={{ scale: hubActive ? 1.06 : 1 }}
          transition={scaleTransition}
          onClick={() => onSelect("")}
          onMouseEnter={() => onHoverStart("")}
          onMouseLeave={onHoverEnd}
        >
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/wheel-texture.jpeg)" }}
            animate={{ opacity: hubActive ? 1 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute inset-0 bg-black/35"
            animate={{ opacity: hubActive ? 1 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center">
            <RadioTower
              className="h-7 w-7 text-wheel_accent"
              aria-hidden="true"
            />
            <span className="text-[15px] font-bold text-white">Center</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-white/80">
              Center Pillar
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

export default function WheelSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.3 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasHover = useHasHoverCapability();

  const [cycleIndex, setCycleIndex] = useState(0);
  const [isExtended, setIsExtended] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);

  const isHovering = hasHover && hoveredId !== undefined;
  const cycleActiveId = CYCLE[cycleIndex];
  const activeId = isHovering ? hoveredId || null : cycleActiveId;
  const activePillar = PILLARS.find((p) => p.id === activeId) ?? null;

  useEffect(() => {
    if (!isInView || prefersReducedMotion || isHovering) return;

    const dwell = isExtended ? EXTENDED_DWELL_MS : NORMAL_DWELL_MS;
    const timer = window.setTimeout(() => {
      setCycleIndex((current) => (current + 1) % CYCLE.length);
      setIsExtended(false);
    }, dwell);

    return () => window.clearTimeout(timer);
  }, [cycleIndex, isExtended, isInView, prefersReducedMotion, isHovering]);

  function handleSelect(id: string) {
    const target = id || null;
    const nextIndex = CYCLE.findIndex((cycleId) => cycleId === target);
    if (nextIndex >= 0) {
      setCycleIndex(nextIndex);
      setIsExtended(true);
    }
  }

  function handleHoverStart(id: string) {
    if (!hasHover) return;
    setHoveredId(id);
  }

  function handleHoverEnd() {
    if (!hasHover) return;
    setHoveredId(undefined);
  }

  return (
    <section
      ref={sectionRef}
      id="wheel"
      className="w-full bg-wheel_dark1 py-20 text-white md:py-28"
    >
      <div className="mx-auto w-full max-w-[90rem] px-6 md:px-10">
        <FadeInView delay={0}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-wheel_accent">
            Section Label
          </p>
        </FadeInView>
        <FadeInView delay={0.1}>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl lg:text-6xl">
            Section Title
          </h2>
        </FadeInView>
        <FadeInView delay={0.2}>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            Section description goes here.
          </p>
        </FadeInView>

        <div className="mt-16 grid grid-cols-1 items-center gap-14 md:mt-20 md:grid-cols-2 md:gap-10 lg:gap-16">
          <FadeInView direction="left">
            <PillarWheel
              activeId={activeId}
              prefersReducedMotion={prefersReducedMotion}
              onSelect={handleSelect}
              onHoverStart={handleHoverStart}
              onHoverEnd={handleHoverEnd}
            />
            <p className="mt-6 text-center text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              {hasHover ? "Hover a pillar to explore" : "Tap a pillar to explore"}
            </p>
          </FadeInView>

          <FadeInView direction="right" className="space-y-6">
            <PillarChips activeId={activeId} onSelect={handleSelect} />
            <div className="min-h-[260px] rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId ?? "center"}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {activePillar ? (
                    <PillarDetail pillar={activePillar} />
                  ) : (
                    <CenterSummary />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
