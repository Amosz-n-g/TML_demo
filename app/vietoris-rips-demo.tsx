"use client";

import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { DIAGRAM_SAMPLES } from "@/src/data/diagram-samples";
import samplePredictions from "@/src/data/sample_predictions.json";
import { MODELNET40_CLASSES, POINT_CLOUD_SAMPLES } from "@/src/data/point-cloud-samples";
import { ProjectedPoint, projectPointsWithWasm } from "@/src/wasm/vietoris-rips-wasm";

type Filtration = {
  edges: [number, number][];
  triangles: [number, number, number][];
  triangleCount: number;
  nonIntersectingTriangleCount: number;
  seededTriangleCount: number;
  components: number;
  cycles: number;
  cached?: boolean;
};

type PredictionRecord = {
  index: number;
  pred: number;
  prob: number;
};

type SamplePredictions = {
  train: PredictionRecord[];
  test: PredictionRecord[];
};

const predictions = samplePredictions as SamplePredictions;

const WIDTH = 880;
const HEIGHT = 560;
const MAX_EDGES = 6000;
const MAX_TRIANGLES = 2600;
const ANIMATION_INTERVAL_MS = 180;
const MIN_ZOOM = 0.62;
const MAX_ZOOM = 3.2;
const INITIAL_STEP_INDEX = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function VietorisRipsDemo() {
  const [sampleId, setSampleId] = useState(POINT_CLOUD_SAMPLES[0].id);
  const [stepIndex, setStepIndex] = useState(INITIAL_STEP_INDEX);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [projected, setProjected] = useState<ProjectedPoint[]>([]);
  const [wasmError, setWasmError] = useState<string | null>(null);
  const [filtration, setFiltration] = useState<Filtration>({
    edges: [],
    triangles: [],
    triangleCount: 0,
    nonIntersectingTriangleCount: 0,
    seededTriangleCount: 0,
    components: POINT_CLOUD_SAMPLES[0].points.length,
    cycles: 0,
  });
  const [isFiltrationPending, setIsFiltrationPending] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const sample = useMemo(
    () => POINT_CLOUD_SAMPLES.find((item) => item.id === sampleId) ?? POINT_CLOUD_SAMPLES[0],
    [sampleId],
  );
  const diagram = useMemo(
    () => DIAGRAM_SAMPLES.find((item) => item.sampleId === sample.id) ?? DIAGRAM_SAMPLES[0],
    [sample.id],
  );
  const samplePrediction = useMemo(() => {
    const group = predictions[sample.split] ?? [];
    return group.find((item) => item.index === sample.sourceIndex);
  }, [sample]);

  const predictedClassName = samplePrediction
    ? MODELNET40_CLASSES[samplePrediction.pred].replaceAll("_", " ")
    : "unknown";
  const predictedConfidence = samplePrediction ? `${(samplePrediction.prob * 100).toFixed(1)}%` : "N/A";
  const predictionStatus = samplePrediction
    ? samplePrediction.pred === sample.label
      ? "correct"
      : "incorrect"
    : "unknown";
  const currentStepIndex = clamp(stepIndex, 0, diagram.epsilonSteps.length - 1);
  const currentHomology = diagram.homologySteps[currentStepIndex];
  const epsilon = currentHomology.epsilon;
  const points = useMemo(
    () => sample.points,
    [sample],
  );
  const visibleEdges = filtration.edges.slice(0, MAX_EDGES);
  const hasProjection = projected.length === points.length;

  useEffect(() => {
    let cancelled = false;

    projectPointsWithWasm(points, rotation, WIDTH, HEIGHT)
      .then((nextProjected) => {
        if (!cancelled) {
          setProjected(nextProjected);
          setWasmError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProjected([]);
          setWasmError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [points, rotation]);

  useEffect(() => {
    const worker = new Worker(new URL("../src/wasm/tml-wasm-loader.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<Filtration & { id: number; kind: string; error?: string }>) => {
      if (event.data.kind !== "calculate" || event.data.id !== requestIdRef.current) return;
      if (event.data.error) {
        setWasmError(event.data.error);
        setIsFiltrationPending(false);
        return;
      }
      setFiltration({
        edges: event.data.edges,
        triangles: event.data.triangles,
        triangleCount: event.data.triangleCount,
        nonIntersectingTriangleCount: event.data.nonIntersectingTriangleCount,
        seededTriangleCount: event.data.seededTriangleCount,
        components: event.data.components,
        cycles: event.data.cycles,
        cached: event.data.cached,
      });
      setIsFiltrationPending(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const id = requestIdRef.current + 1;
    requestIdRef.current = id;
    setIsFiltrationPending(true);
    worker.postMessage({
      id,
      kind: "calculate",
      sampleId: sample.id,
      points: sample.points,
      epsilon,
      maxEdges: MAX_EDGES,
      maxTriangles: MAX_TRIANGLES,
    });
    setIsFiltrationPending(true);
    setFiltration((current) => ({
      ...current,
      cached: false,
    }));

    const epsilons = [
      currentStepIndex - 2,
      currentStepIndex - 1,
      currentStepIndex + 1,
      currentStepIndex + 2,
    ]
      .filter((index) => index >= 0 && index < diagram.epsilonSteps.length)
      .map((index) => diagram.epsilonSteps[index])
      .filter((value, index, values) => value !== epsilon && values.indexOf(value) === index);

    worker.postMessage({
      id: id + 0.1,
      kind: "preload",
      sampleId: sample.id,
      points: sample.points,
      epsilons,
      maxEdges: MAX_EDGES,
      maxTriangles: MAX_TRIANGLES,
    });
  }, [currentStepIndex, diagram.epsilonSteps, epsilon, sample]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStepIndex((current) => (current >= diagram.epsilonSteps.length - 1 ? 0 : current + 1));
      setRotation((current) => ({ x: current.x, y: current.y + 0.01 }));
    }, ANIMATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [diagram.epsilonSteps.length, playing]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgElement = svg;

    function handleSvgWheel(event: globalThis.WheelEvent) {
      event.preventDefault();
      const bounds = svgElement.getBoundingClientRect();
      const mouseX = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
      const mouseY = ((event.clientY - bounds.top) / bounds.height) * HEIGHT;
      const zoomFactor = event.deltaY < 0 ? 1.12 : 0.89;

      setViewport((current) => {
        const nextScale = clamp(current.scale * zoomFactor, MIN_ZOOM, MAX_ZOOM);
        const ratio = nextScale / current.scale;
        return {
          scale: nextScale,
          x: mouseX - (mouseX - current.x) * ratio,
          y: mouseY - (mouseY - current.y) * ratio,
        };
      });
    }

    svgElement.addEventListener("wheel", handleSvgWheel, { passive: false });
    return () => svgElement.removeEventListener("wheel", handleSvgWheel);
  }, []);

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragStart) return;
    setRotation((current) => ({
      x: current.x - event.movementY * 0.008,
      y: current.y - event.movementX * 0.008,
    }));
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#17201b]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-6 md:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-[#d4d8cc] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#6b735d]">
              Topological Machine Learning
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Rotatable Vietoris-Rips Filtration
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:w-[360px]">
            <Metric label="epsilon" value={epsilon.toFixed(3)} />
            <Metric label="source" value={`${sample.split} #${sample.sourceIndex}`} />
          </div>
        </header>

        <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="aspect-[11/7] w-full overflow-hidden rounded-lg border border-[#d4d8cc] bg-[#fbfcf8] shadow-sm">
            <svg
              ref={svgRef}
              className="block h-full w-full touch-none"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="img"
              aria-label="Interactive rotatable Vietoris-Rips filtration scene"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragStart({ x: event.clientX, y: event.clientY });
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDragStart(null)}
              onPointerCancel={() => setDragStart(null)}
            >
              <rect width={WIDTH} height={HEIGHT} fill="#fbfcf8" />
              <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
                <g opacity="0.40">
                  {filtration.triangles.map(([a, b, c]) => (
                    <polygon
                      key={`${a}-${b}-${c}`}
                      points={`${projected[a]?.sx ?? 0},${projected[a]?.sy ?? 0} ${projected[b]?.sx ?? 0},${projected[b]?.sy ?? 0} ${projected[c]?.sx ?? 0},${projected[c]?.sy ?? 0}`}
                      fill="#8aa197"
                      stroke="#62776f"
                      strokeWidth="0.4"
                    />
                  ))}
                </g>
                <g>
                  {visibleEdges.map(([a, b]) => (
                    <line
                      key={`${a}-${b}`}
                      x1={projected[a]?.sx ?? 0}
                      y1={projected[a]?.sy ?? 0}
                      x2={projected[b]?.sx ?? 0}
                      y2={projected[b]?.sy ?? 0}
                      stroke="#2f675f"
                      strokeOpacity="0.28"
                      strokeWidth={1.15 / viewport.scale}
                    />
                  ))}
                </g>
                <g>
                  {hasProjection && [...projected]
                    .sort((a, b) => a.depth - b.depth)
                    .map((point) => (
                      <circle
                        key={point.id}
                        cx={point.sx}
                        cy={point.sy}
                        r={(3.9 + point.depth * 1.1) / viewport.scale}
                        fill="#f2784b"
                        stroke="#6d2f20"
                        strokeWidth={0.7 / viewport.scale}
                      />
                    ))}
                </g>
              </g>
            </svg>
          </div>

          <aside className="rounded-lg border border-[#d4d8cc] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Scene Controls</h2>
                <p className="mt-1 text-sm text-[#667060]">
                  Showing real processed ModelNet40 point clouds from the notebook cache.
                </p>
              </div>
              <button
                className="h-10 rounded-md bg-[#173b35] px-4 text-sm font-semibold text-white transition hover:bg-[#25564e]"
                onClick={() => setPlaying((value) => !value)}
              >
                {playing ? "Pause" : "Play"}
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-[#d4d8cc] bg-[#fbfcf8] px-3 py-2 text-sm">
              <span className="font-mono text-[#59645b]">zoom {viewport.scale.toFixed(2)}x</span>
              <span className="font-mono text-[#59645b]">
                {wasmError ? "wasm error" : isFiltrationPending ? "computing" : filtration.cached ? "cached" : "fresh"}
              </span>
              <button
                className="rounded-md border border-[#c7ccbf] px-3 py-1 font-semibold text-[#26302a] transition hover:border-[#87927f]"
                onClick={() => setViewport({ scale: 1, x: 0, y: 0 })}
              >
                Reset
              </button>
            </div>

            <label className="mt-6 block text-sm font-semibold" htmlFor="epsilon">
              Filtration epsilon
            </label>
            <div className="mt-2 flex items-center justify-between font-mono text-xs text-[#667060]">
              <span>{diagram.epsilonSteps[0].toFixed(2)}</span>
              <span className="rounded-md bg-[#f6f7f2] px-2 py-1 text-[#17201b]">
                step {currentStepIndex + 1}/{diagram.epsilonSteps.length} | {epsilon.toFixed(3)}
              </span>
              <span>{diagram.epsilonSteps[diagram.epsilonSteps.length - 1].toFixed(2)}</span>
            </div>
            <input
              id="epsilon"
              className="mt-3 w-full accent-[#f2784b]"
              type="range"
              min={0}
              max={diagram.epsilonSteps.length - 1}
              step={1}
              value={currentStepIndex}
              onChange={(event) => setStepIndex(Number(event.target.value))}
            />

            <div className="mt-6 grid grid-cols-2 gap-2">
              {POINT_CLOUD_SAMPLES.map((item) => (
                <button
                  key={item.id}
                  className={`min-h-12 rounded-md border px-2 text-sm font-semibold transition ${
                    sample.id === item.id
                      ? "border-[#173b35] bg-[#173b35] text-white"
                      : "border-[#d4d8cc] bg-[#fbfcf8] text-[#26302a] hover:border-[#87927f]"
                  }`}
                  onClick={() => setSampleId(item.id)}
                >
                  {item.className.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric label="class" value={sample.className.replaceAll("_", " ")} />
              <Metric label="0-simplices" value={points.length.toString()} />
              <Metric label="1-simplices rendered" value={ `${filtration.edges.length.toString()}/${MAX_EDGES}` } />
              <Metric label="2-simiplices rendered" value={`${filtration.triangles.length}/${MAX_TRIANGLES}`} />
              <Metric label="H1 homology" value={currentHomology.h1.toString()} />
              <Metric label="H2 homology" value={currentHomology.h2.toString()} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="predicted" value={predictedClassName} />
              <Metric label="confidence" value={predictedConfidence} />
              <Metric label="status" value={predictionStatus} />
            </div>

            <p className="mt-6 border-t border-[#e1e4db] pt-4 text-sm leading-6 text-[#536055]">
              {wasmError ? (
                <span className="font-semibold text-[#8a3320]">{wasmError}</span>
              ) : (
                <>These points come from <span className="font-mono">data/processed/train_points.npy</span>.</>
              )}
              {" "}
              The web data keeps a deterministic subset of each processed 1024-point cloud so
              the filtration can update interactively in the browser. H1/H2 counts are sampled
              from topology-aware persistence-diagram epsilon values.
            </p>
          </aside>
        </section>

        <section className="rounded-lg border border-[#d4d8cc] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">Classification Results</h2>
              <p className="mt-1 text-sm text-[#667060]">
                Hybrid TML + CNN predictions are loaded from the notebook pipeline and shown for the selected point cloud sample.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-[#d4d8cc] bg-[#fbfcf8] p-3">
                <p className="text-sm font-semibold text-[#17201b]">Confusion matrix</p>
                <img
                  src="/api/outputs/confusion_matrix"
                  alt="Confusion matrix for the hybrid classification model"
                  className="mt-3 h-44 w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="rounded-lg border border-[#d4d8cc] bg-[#fbfcf8] p-3">
                <p className="text-sm font-semibold text-[#17201b]">Per-class accuracy</p>
                <img
                  src="/api/outputs/per_class_accuracy"
                  alt="Per-class accuracy for the hybrid classification model"
                  className="mt-3 h-44 w-full object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d4d8cc] bg-[#fbfcf8] px-3 py-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6c7566]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#17201b]">{value}</p>
    </div>
  );
}
