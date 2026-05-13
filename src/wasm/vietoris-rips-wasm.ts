type Point3Tuple = [number, number, number];

export type ProjectedPoint = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  depth: number;
  id: number;
};

type TmlWasmExports = WebAssembly.Exports & {
  memory: WebAssembly.Memory;
  malloc?: (size: number) => number;
  _malloc?: (size: number) => number;
  free?: (ptr: number) => void;
  _free?: (ptr: number) => void;
  tml_project_points?: (
    pointsPtr: number,
    pointCount: number,
    rotationX: number,
    rotationY: number,
    width: number,
    height: number,
    outPtr: number,
  ) => void;
  _tml_project_points?: (
    pointsPtr: number,
    pointCount: number,
    rotationX: number,
    rotationY: number,
    width: number,
    height: number,
    outPtr: number,
  ) => void;
};

let instancePromise: Promise<WebAssembly.Instance> | null = null;

async function getInstance() {
  if (!instancePromise) {
    const imports = {
      env: {
        emscripten_notify_memory_growth() {},
      },
      wasi_snapshot_preview1: {
        proc_exit() {},
      },
    };

    instancePromise = WebAssembly.instantiateStreaming(fetch("/tml-filtration.wasm"), imports)
      .then((result) => result.instance)
      .catch(async () => {
        const response = await fetch("/tml-filtration.wasm");
        const bytes = await response.arrayBuffer();
        const result = await WebAssembly.instantiate(bytes, imports);
        return result.instance;
      });
  }

  return instancePromise;
}

function getExport<T>(exports: TmlWasmExports, primary: keyof TmlWasmExports, fallback: keyof TmlWasmExports) {
  const value = exports[primary] ?? exports[fallback];
  if (!value) {
    throw new Error(`Missing WASM export: ${String(primary)}`);
  }
  return value as T;
}

export async function projectPointsWithWasm(
  points: Point3Tuple[],
  rotation: { x: number; y: number },
  width: number,
  height: number,
): Promise<ProjectedPoint[]> {
  const instance = await getInstance();
  const exports = instance.exports as TmlWasmExports;
  const { memory } = exports;
  const malloc = getExport<(size: number) => number>(exports, "malloc", "_malloc");
  const free = getExport<(ptr: number) => void>(exports, "free", "_free");
  const projectPoints = getExport<NonNullable<TmlWasmExports["tml_project_points"]>>(
    exports,
    "tml_project_points",
    "_tml_project_points",
  );

  const pointsPtr = malloc(points.length * 3 * Float64Array.BYTES_PER_ELEMENT);
  const outPtr = malloc(points.length * 6 * Float64Array.BYTES_PER_ELEMENT);

  try {
    const pointView = new Float64Array(memory.buffer, pointsPtr, points.length * 3);
    for (let i = 0; i < points.length; i += 1) {
      pointView[i * 3] = points[i][0];
      pointView[i * 3 + 1] = points[i][1];
      pointView[i * 3 + 2] = points[i][2];
    }

    projectPoints(pointsPtr, points.length, rotation.x, rotation.y, width, height, outPtr);

    const output = new Float64Array(memory.buffer, outPtr, points.length * 6);
    return points.map((_, id) => ({
      id,
      x: output[id * 6],
      y: output[id * 6 + 1],
      z: output[id * 6 + 2],
      sx: output[id * 6 + 3],
      sy: output[id * 6 + 4],
      depth: output[id * 6 + 5],
    }));
  } finally {
    free(outPtr);
    free(pointsPtr);
  }
}
