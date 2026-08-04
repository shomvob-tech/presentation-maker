'use client';

/**
 * KnowledgeBaseExplorer
 * ------------------------------------------------------------------
 * Plain-React, dependency-free viewer for the Shomvob HRM knowledge
 * base + slide-points data. Purely presentational — pass the two
 * parsed JSON files in as props:
 *
 *   import knowledgeBase from './knowledge_base.json';
 *   import slidePoints from './slide_points.json';
 *   import { KnowledgeBaseExplorer } from './KnowledgeBaseExplorer';
 *
 *   <KnowledgeBaseExplorer knowledgeBase={knowledgeBase} slidePoints={slidePoints} />
 *
 * No new packages required (uses only React + Tailwind utility
 * classes, with one hand-rolled inline SVG chevron — no icon
 * library needed).
 *
 * Hierarchy shown: Module → (knowledge-base facts + slide content) →
 * Point Library (individual points, ranked by priority). Each module
 * is a collapsed row by default so you can scan all module names
 * first, then expand the ones you want to read; search auto-expands
 * whatever matches.
 */

import React, { useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Data shapes                                                        */
/* ------------------------------------------------------------------ */

export interface KBModule {
  id: string;
  name: string;
  slideType: string;
  description: string;
  businessProblems: string[];
  features: string[];
  benefits: string[];
  keywords: string[];
  screenshots: string[];
  workflowAvailable: boolean;
  relatedModules: string[];
}

export interface KnowledgeBase {
  version: string;
  product: { name: string; company: string };
  presentationDefaults: { defaultTheme: string; availableThemes: string[] };
  modules: KBModule[];
}

export interface SlidePoint {
  id: string;
  priority: number;
  title: string;
  description: string;
  businessBenefit: string;
  keywords: string[];
}

export interface GenerationRules {
  minimumPoints: number;
  maximumPoints: number;
  preferHighestPriority: boolean;
  avoidDuplicateKeywords: boolean;
  rewriteTone: string;
  useBusinessBenefitsWhenRelevant: boolean;
}

export interface SlideModulePoints {
  moduleId: string;
  moduleName: string;
  headline: string;
  subheadline: string;
  defaultSlideTitle: string;
  maxPointsPerSlide: number;
  pointLibrary: SlidePoint[];
  generationRules: GenerationRules;
}

interface KnowledgeBaseExplorerProps {
  knowledgeBase: KnowledgeBase;
  slidePoints: SlideModulePoints[];
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
        open ? 'rotate-90' : ''
      }`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 4l6 6-6 6"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chip({
  children,
  tone = 'default',
  onClick,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'accent';
  onClick?: () => void;
}) {
  const base =
    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs whitespace-nowrap';
  const toneClass =
    tone === 'accent'
      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
      : 'border-slate-200 bg-slate-50 text-slate-600';
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${toneClass} gap-1 transition-colors hover:bg-indigo-100`}
      >
        {children}
        <span aria-hidden="true">&rarr;</span>
      </button>
    );
  }
  return <span className={`${base} ${toneClass}`}>{children}</span>;
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</h4>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PriorityBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-medium tabular-nums text-slate-500">
        {value}/10
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search matching                                                     */
/* ------------------------------------------------------------------ */

function moduleMatches(kb: KBModule, slide: SlideModulePoints | undefined, query: string) {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  const haystack = [
    kb.name,
    kb.id,
    kb.description,
    ...kb.businessProblems,
    ...kb.features,
    ...kb.benefits,
    ...kb.keywords,
    slide?.headline ?? '',
    slide?.subheadline ?? '',
    ...(slide?.pointLibrary.flatMap((p) => [p.title, p.description, p.businessBenefit, ...p.keywords]) ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function KnowledgeBaseExplorer({ knowledgeBase, slidePoints }: KnowledgeBaseExplorerProps) {
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [rawOpenIds, setRawOpenIds] = useState<Set<string>>(new Set());
  const moduleRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const kbById = useMemo(() => new Map(knowledgeBase.modules.map((m) => [m.id, m])), [knowledgeBase]);

  const merged = useMemo(
    () =>
      knowledgeBase.modules.map((kb) => ({
        kb,
        slide: slidePoints.find((s) => s.moduleId === kb.id),
      })),
    [knowledgeBase, slidePoints],
  );

  const filtered = useMemo(
    () => merged.filter(({ kb, slide }) => moduleMatches(kb, slide, query)),
    [merged, query],
  );

  const totalPoints = useMemo(
    () => slidePoints.reduce((sum, s) => sum + s.pointLibrary.length, 0),
    [slidePoints],
  );
  const workflowCount = useMemo(
    () => knowledgeBase.modules.filter((m) => m.workflowAvailable).length,
    [knowledgeBase],
  );

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRaw = (id: string) => {
    setRawOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(knowledgeBase.modules.map((m) => m.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const goToModule = (id: string) => {
    setQuery('');
    setExpandedIds((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      moduleRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            {knowledgeBase.product.company}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {knowledgeBase.product.name} — Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {knowledgeBase.modules.length} modules · {totalPoints} slide points · {workflowCount} with
            workflows · v{knowledgeBase.version}
          </p>
        </header>

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, features, points…"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 sm:max-w-xs"
          />
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              {filtered.length} of {knowledgeBase.modules.length} shown
            </span>
            <button
              type="button"
              onClick={expandAll}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-100"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-100"
            >
              Collapse all
            </button>
          </div>
        </div>

        {/* Module list */}
        <div className="mt-6 space-y-3">
          {filtered.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-400">
              No modules match &ldquo;{query}&rdquo;.
            </p>
          )}

          {filtered.map(({ kb, slide }) => {
            const isOpen = query.trim().length > 0 || expandedIds.has(kb.id);
            const isRawOpen = rawOpenIds.has(kb.id);
            const sortedPoints = slide
              ? [...slide.pointLibrary].sort((a, b) => b.priority - a.priority)
              : [];

            return (
              <div
                key={kb.id}
                ref={(el) => {
                  moduleRefs.current[kb.id] = el;
                }}
                className="scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Module header row */}
                <button
                  type="button"
                  onClick={() => toggle(kb.id)}
                  aria-expanded={isOpen}
                  aria-controls={`module-panel-${kb.id}`}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Chevron open={isOpen} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{kb.name}</h3>
                        {kb.workflowAvailable && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            Workflow
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {kb.id} · {kb.slideType}
                      </p>
                    </div>
                  </div>
                  {slide && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {slide.pointLibrary.length} points
                    </span>
                  )}
                </button>

                {/* Module body */}
                {isOpen && (
                  <div id={`module-panel-${kb.id}`} className="border-t border-slate-100 px-4 py-5 sm:px-5">
                    <p className="text-sm text-slate-600">{kb.description}</p>

                    <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
                      <ListBlock label="Business Problems" items={kb.businessProblems} />
                      <ListBlock label="Features" items={kb.features} />
                      <ListBlock label="Benefits" items={kb.benefits} />
                    </div>

                    {kb.keywords.length > 0 && (
                      <div className="mt-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Keywords
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {kb.keywords.map((k) => (
                            <Chip key={k}>{k}</Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {kb.relatedModules.length > 0 && (
                      <div className="mt-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Related Modules
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {kb.relatedModules.map((relId) => (
                            <Chip key={relId} tone="accent" onClick={() => goToModule(relId)}>
                              {kbById.get(relId)?.name ?? relId}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Slide content + point library */}
                    {slide && (
                      <div className="mt-6 rounded-lg bg-slate-50 p-4 sm:p-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Slide Content
                        </h4>

                        <p className="mt-2 text-sm font-medium text-slate-800">{slide.headline}</p>
                        <p className="mt-1 text-sm text-slate-500">{slide.subheadline}</p>

                        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 sm:grid-cols-4">
                          <div>
                            <dt className="inline font-medium text-slate-600">Slide title: </dt>
                            <dd className="inline">{slide.defaultSlideTitle}</dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-slate-600">Max points/slide: </dt>
                            <dd className="inline">{slide.maxPointsPerSlide}</dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-slate-600">Tone: </dt>
                            <dd className="inline">{slide.generationRules.rewriteTone}</dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-slate-600">Point range: </dt>
                            <dd className="inline">
                              {slide.generationRules.minimumPoints}–{slide.generationRules.maximumPoints}
                            </dd>
                          </div>
                        </dl>

                        <h5 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Point Library ({sortedPoints.length}, ranked by priority)
                        </h5>
                        <div className="mt-2 space-y-2 border-l-2 border-slate-200 pl-4">
                          {sortedPoints.map((point, i) => (
                            <div key={point.id} className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-mono text-xs text-slate-400">
                                    {String(i + 1).padStart(2, '0')}
                                  </span>
                                  <h6 className="text-sm font-semibold text-slate-800">{point.title}</h6>
                                </div>
                                <PriorityBar value={point.priority} />
                              </div>
                              <p className="mt-1.5 text-sm text-slate-600">{point.description}</p>
                              <p className="mt-1.5 text-sm text-slate-500">
                                <span className="font-medium text-slate-600">Benefit: </span>
                                {point.businessBenefit}
                              </p>
                              {point.keywords.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {point.keywords.map((k) => (
                                    <Chip key={k}>{k}</Chip>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON */}
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => toggleRaw(kb.id)}
                        className="text-xs font-medium text-slate-400 underline decoration-dotted hover:text-slate-600"
                      >
                        {isRawOpen ? 'Hide raw JSON' : 'View raw JSON'}
                      </button>
                      {isRawOpen && (
                        <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-200">
                          {JSON.stringify({ knowledgeBase: kb, slidePoints: slide ?? null }, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default KnowledgeBaseExplorer;