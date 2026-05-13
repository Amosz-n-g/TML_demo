(function () {
  let modulePromise = null;
  const cache = new Map();
  const cacheIndex = new Map();

  function makeLoader() {
    function getExport(instance, primary, fallback) {
      return instance.exports[primary] ?? instance.exports[fallback];
    }

    function writePoints(memory, malloc, points) {
      const ptr = malloc(points.length * 3 * Float64Array.BYTES_PER_ELEMENT);
      const view = new Float64Array(memory.buffer, ptr, points.length * 3);
      for (let i = 0; i < points.length; i += 1) {
        view[i * 3] = points[i][0];
        view[i * 3 + 1] = points[i][1];
        view[i * 3 + 2] = points[i][2];
      }
      return ptr;
    }

    function readPairs(memory, ptr, count) {
      if (!ptr || !count) return [];
      const data = new Int32Array(memory.buffer, ptr, count * 2);
      const pairs = [];
      for (let i = 0; i < count; i += 1) {
        pairs.push([data[i * 2], data[i * 2 + 1]]);
      }
      return pairs;
    }

    function readTriangles(memory, ptr, count) {
      if (!ptr || !count) return [];
      const data = new Int32Array(memory.buffer, ptr, count * 3);
      const triangles = [];
      for (let i = 0; i < count; i += 1) {
        triangles.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]);
      }
      return triangles;
    }

    return async function createTmlWasmModule() {
      if (!modulePromise) {
        modulePromise = WebAssembly.instantiateStreaming(fetch("/tml-filtration.wasm"), {
          env: {
            emscripten_notify_memory_growth() {},
          },
          wasi_snapshot_preview1: {
            proc_exit() {},
          },
        }).catch(async () => {
          const response = await fetch("/tml-filtration.wasm");
          const bytes = await response.arrayBuffer();
          return WebAssembly.instantiate(bytes, {
            env: {
              emscripten_notify_memory_growth() {},
            },
            wasi_snapshot_preview1: {
              proc_exit() {},
            },
          });
        });
      }

      const { instance } = await modulePromise;
      const memory = instance.exports.memory;
      const malloc = getExport(instance, "malloc", "_malloc");
      const free = getExport(instance, "free", "_free");
      const buildFiltration = getExport(instance, "tml_build_filtration", "_tml_build_filtration");
      const freeFiltration = getExport(instance, "tml_free_filtration", "_tml_free_filtration");

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
          const result = {
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
  }

  self.createTmlWasmModule = makeLoader();

  function makeCacheGroupKey(sampleId, maxEdges, maxTriangles) {
    return `${sampleId}|${maxEdges}|${maxTriangles}`;
  }

  function makeCacheKey(sampleId, epsilon, maxEdges, maxTriangles) {
    return `${makeCacheGroupKey(sampleId, maxEdges, maxTriangles)}|${epsilon.toFixed(3)}`;
  }

  function getLowerFiltrationSeed(sampleId, epsilon, maxEdges, maxTriangles) {
    const groupKey = makeCacheGroupKey(sampleId, maxEdges, maxTriangles);
    const entries = cacheIndex.get(groupKey) ?? [];
    let best = null;

    for (const entry of entries) {
      if (entry.epsilon < epsilon && (!best || entry.epsilon > best.epsilon)) {
        best = entry;
      }
    }

    return best ? cache.get(best.cacheKey) : null;
  }

  function rememberFiltration(sampleId, epsilon, maxEdges, maxTriangles, result) {
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

  function toPublicResult(result) {
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

  async function buildFiltration(sampleId, points, epsilon, maxEdges, maxTriangles) {
    const cacheKey = makeCacheKey(sampleId, epsilon, maxEdges, maxTriangles);
    if (cache.has(cacheKey)) {
      return { ...cache.get(cacheKey), cached: true };
    }

    const lowerSeed = getLowerFiltrationSeed(sampleId, epsilon, maxEdges, maxTriangles);
    const seedTriangles = lowerSeed ? lowerSeed.acceptedTriangles ?? lowerSeed.triangles : [];
    const wasm = await self.createTmlWasmModule();
    const result = wasm.buildFiltration(points, epsilon, maxEdges, maxTriangles, seedTriangles);

    rememberFiltration(sampleId, epsilon, maxEdges, maxTriangles, result);
    return result;
  }

  self.onmessage = async (event) => {
    const { id, kind, sampleId, points, epsilon, epsilons, maxEdges, maxTriangles } = event.data;

    try {
      if (kind === "preload") {
        for (const eps of epsilons) {
          await buildFiltration(sampleId, points, eps, maxEdges, maxTriangles);
        }
        self.postMessage({ id, kind, cachedCount: epsilons.length });
        return;
      }

      const result = await buildFiltration(sampleId, points, epsilon, maxEdges, maxTriangles);
      self.postMessage({ id, kind, ...toPublicResult(result) });
    } catch (error) {
      self.postMessage({
        id,
        kind,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
})();
