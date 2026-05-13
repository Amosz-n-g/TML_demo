export {};

type Point3Tuple = [number, number, number];
type Edge = [number, number];
type Triangle = [number, number, number];

type FiltrationResult = {
  edges: Edge[];
  triangles: Triangle[];
  acceptedTriangles: Triangle[];
  triangleCount: number;
  nonIntersectingTriangleCount: number;
  seededTriangleCount: number;
  components: number;
  cycles: number;
  cached: boolean;
};

type PublicFiltrationResult = Omit<FiltrationResult, "acceptedTriangles">;

type CacheEntry = {
  epsilon: number;
  cacheKey: string;
};

type WorkerRequest =
  | {
      id: number;
      kind: "calculate";
      sampleId: string;
      points: Point3Tuple[];
      epsilon: number;
      maxEdges: number;
      maxTriangles: number;
    }
  | {
      id: number;
      kind: "preload";
      sampleId: string;
      points: Point3Tuple[];
      epsilons: number[];
      maxEdges: number;
      maxTriangles: number;
    };

type TmlWasmExports = WebAssembly.Exports & {
  memory: WebAssembly.Memory;
  malloc?: (size: number) => number;
  _malloc?: (size: number) => number;
  free?: (ptr: number) => void;
  _free?: (ptr: number) => void;
  tml_build_filtration?: (
    pointsPtr: number,
    pointCount: number,
    epsilon: number,
    maxEdges: number,
    maxTriangles: number,
    seedPtr: number,
    seedCount: number,
  ) => number;
  _tml_build_filtration?: (
    pointsPtr: number,
    pointCount: number,
    epsilon: number,
    maxEdges: number,
    maxTriangles: number,
    seedPtr: number,
    seedCount: number,
  ) => number;
  tml_free_filtration?: (resultPtr: number) => void;
  _tml_free_filtration?: (resultPtr: number) => void;
};

type TmlWasmModule = {
  buildFiltration(
    points: Point3Tuple[],
    epsilon: number,
    maxEdges: number,
    maxTriangles: number,
    seedTriangles: Triangle[],
  ): FiltrationResult;
};

type WorkerScope = {
  createTmlWasmModule: () => Promise<TmlWasmModule>;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void | Promise<void>) | null;
  postMessage(message: unknown): void;
};

const workerScope = self as unknown as WorkerScope;

let modulePromise: Promise<WebAssembly.WebAssemblyInstantiatedSource> | null = null;
const cache = new Map<string, FiltrationResult>();
const cacheIndex = new Map<string, CacheEntry[]>();

function getExport<T>(instance: WebAssembly.Instance, primary: string, fallback: string): T {
  const exports = instance.exports as TmlWasmExports;
  const value = exports[primary] ?? exports[fallback];
  if (!value) {
    throw new Error(`Missing WASM export: ${primary}`);
  }
  return value as T;
}

function writePoints(
  memory: WebAssembly.Memory,
  malloc: (size: number) => number,
  points: Point3Tuple[],
) {
  const ptr = malloc(points.length * 3 * Float64Array.BYTES_PER_ELEMENT);
  const view = new Float64Array(memory.buffer, ptr, points.length * 3);
  for (let i = 0; i < points.length; i += 1) {
    view[i * 3] = points[i][0];
    view[i * 3 + 1] = points[i][1];
    view[i * 3 + 2] = points[i][2];
  }
  return ptr;
}

function readPairs(memory: WebAssembly.Memory, ptr: number, count: number): Edge[] {
  if (!ptr || !count) return [];
  const data = new Int32Array(memory.buffer, ptr, count * 2);
  const pairs: Edge[] = [];
  for (let i = 0; i < count; i += 1) {
    pairs.push([data[i * 2], data[i * 2 + 1]]);
  }
  return pairs;
}

function readTriangles(memory: WebAssembly.Memory, ptr: number, count: number): Triangle[] {
  if (!ptr || !count) return [];
  const data = new Int32Array(memory.buffer, ptr, count * 3);
  const triangles: Triangle[] = [];
  for (let i = 0; i < count; i += 1) {
    triangles.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]);
  }
  return triangles;
}

workerScope.createTmlWasmModule = async function createTmlWasmModule() {
  if (!modulePromise) {
    const imports = {
      env: {
        emscripten_notify_memory_growth() {},
      },
      wasi_snapshot_preview1: {
        proc_exit() {},
      },
    };

    modulePromise = WebAssembly.instantiateStreaming(fetch("/tml-filtration.wasm"), imports).catch(
      async () => {
        const response = await fetch("/tml-filtration.wasm");
        const bytes = await response.arrayBuffer();
        return WebAssembly.instantiate(bytes, imports);
      },
    );
  }

  const { instance } = await modulePromise;
  const exports = instance.exports as TmlWasmExports;
  const { memory } = exports;
  const malloc = getExport<(size: number) => number>(instance, "malloc", "_malloc");
  const free = getExport<(ptr: number) => void>(instance, "free", "_free");
  const buildFiltration = getExport<NonNullable<TmlWasmExports["tml_build_filtration"]>>(
    instance,
    "tml_build_filtration",
    "_tml_build_filtration",
  );
  const freeFiltration = getExport<NonNullable<TmlWasmExports["tml_free_filtration"]>>(
    instance,
    "tml_free_filtration",
    "_tml_free_filtration",
  );

  return {
    buildFiltration(points, epsilon, maxEdges, maxTriangles, seedTriangles) {
      const pointPtr = writePoints(memory, malloc, points);
      const seedCount = seedTriangles.length;
      const seedPtr = seedCount ? malloc(seedCount * 3 * Int32Array.BYTES_PER_ELEMENT) : 0;
      if (seedPtr) {
        const seedView = new Int32Array(memory.buffer, seedPtr, seedCount * 3);
        for (let i = 0; i < seedCount; i += 1) {
          seedView[i * 3] = seedTriangles[i][0];
          seedView[i * 3 + 1] = seedTriangles[i][1];
          seedView[i * 3 + 2] = seedTriangles[i][2];
        }
      }

      const resultPtr = buildFiltration(
        pointPtr,
        points.length,
        epsilon,
        maxEdges,
        maxTriangles,
        seedPtr,
        seedCount,
      );

      const header = new Int32Array(memory.buffer, resultPtr, 11);
      const result: FiltrationResult = {
        edges: readPairs(memory, header[0], header[1]),
        triangles: readTriangles(memory, header[2], header[3]),
        acceptedTriangles: readTriangles(memory, header[4], header[5]),
        triangleCount: header[6],
        nonIntersectingTriangleCount: header[7],
        seededTriangleCount: header[8],
        components: header[9],
        cycles: header[10],
        cached: false,
      };

      freeFiltration(resultPtr);
      if (seedPtr) free(seedPtr);
      free(pointPtr);
      return result;
    },
  };
};

function makeCacheGroupKey(sampleId: string, maxEdges: number, maxTriangles: number) {
  return `${sampleId}|${maxEdges}|${maxTriangles}`;
}

function makeCacheKey(sampleId: string, epsilon: number, maxEdges: number, maxTriangles: number) {
  return `${makeCacheGroupKey(sampleId, maxEdges, maxTriangles)}|${epsilon.toFixed(3)}`;
}

function getLowerFiltrationSeed(
  sampleId: string,
  epsilon: number,
  maxEdges: number,
  maxTriangles: number,
) {
  const groupKey = makeCacheGroupKey(sampleId, maxEdges, maxTriangles);
  const entries = cacheIndex.get(groupKey) ?? [];
  let best: CacheEntry | null = null;

  for (const entry of entries) {
    if (entry.epsilon < epsilon && (!best || entry.epsilon > best.epsilon)) {
      best = entry;
    }
  }

  return best ? cache.get(best.cacheKey) ?? null : null;
}

function rememberFiltration(
  sampleId: string,
  epsilon: number,
  maxEdges: number,
  maxTriangles: number,
  result: FiltrationResult,
) {
  const cacheKey = makeCacheKey(sampleId, epsilon, maxEdges, maxTriangles);
  const groupKey = makeCacheGroupKey(sampleId, maxEdges, maxTriangles);
  cache.set(cacheKey, result);

  const entries = cacheIndex.get(groupKey) ?? [];
  if (!entries.some((entry) => entry.cacheKey === cacheKey)) {
    entries.push({ epsilon, cacheKey });
    entries.sort((a, b) => a.epsilon - b.epsilon);
    cacheIndex.set(groupKey, entries);
  }
}

function toPublicResult(result: FiltrationResult): PublicFiltrationResult {
  return {
    edges: result.edges,
    triangles: result.triangles,
    triangleCount: result.triangleCount,
    nonIntersectingTriangleCount: result.nonIntersectingTriangleCount,
    seededTriangleCount: result.seededTriangleCount,
    components: result.components,
    cycles: result.cycles,
    cached: result.cached,
  };
}

async function buildFiltration(
  sampleId: string,
  points: Point3Tuple[],
  epsilon: number,
  maxEdges: number,
  maxTriangles: number,
) {
  const cacheKey = makeCacheKey(sampleId, epsilon, maxEdges, maxTriangles);
  if (cache.has(cacheKey)) {
    return { ...cache.get(cacheKey), cached: true } as FiltrationResult;
  }

  const lowerSeed = getLowerFiltrationSeed(sampleId, epsilon, maxEdges, maxTriangles);
  const seedTriangles = lowerSeed ? lowerSeed.acceptedTriangles : [];
  const wasm = await workerScope.createTmlWasmModule();
  const result = wasm.buildFiltration(points, epsilon, maxEdges, maxTriangles, seedTriangles);

  rememberFiltration(sampleId, epsilon, maxEdges, maxTriangles, result);
  return result;
}

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, kind, sampleId, points, maxEdges, maxTriangles } = event.data;

  try {
    if (kind === "preload") {
      for (const eps of event.data.epsilons) {
        await buildFiltration(sampleId, points, eps, maxEdges, maxTriangles);
      }
      workerScope.postMessage({ id, kind, cachedCount: event.data.epsilons.length });
      return;
    }

    const result = await buildFiltration(
      sampleId,
      points,
      event.data.epsilon,
      maxEdges,
      maxTriangles,
    );
    workerScope.postMessage({ id, kind, ...toPublicResult(result) });
  } catch (error) {
    workerScope.postMessage({
      id,
      kind,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
