# WASM Point/Filtration Pipeline

This folder contains the native C++ implementation for the browser-side Vietoris-Rips filtration and 3D point projection used by the `TML_Demo` web demo.

The full end-to-end pipeline is:

1. The React app selects a point cloud sample and a filtration radius (`epsilon`).
2. The browser projects the 3D points into 2D screen space with WASM using `tml_project_points`.
3. The browser computes the Vietoris-Rips edge/triangle complex with WASM using `tml_build_filtration`.
4. The worker reads the returned edge and triangle buffers from WASM memory.
5. The React UI renders the projected points, the visible edges, and the accepted triangles in SVG.

## Files

- `tml_filtration.cpp` — C++ implementation of both the point projection and the Vietoris-Rips filtration.
- `tml-wasm-loader.worker.ts` — WASM loader, worker caching, seed triangle reuse, and result serialization.
- `vietoris-rips-wasm.ts` — point projection helper that calls `tml_project_points` from WASM.
- `../app/vietoris-rips-demo.tsx` — React UI that renders the result, spawns the worker, and displays the SVG scene.

## WASM exports

The native module exports two primary functions:

- `tml_project_points` — rotates and projects 3D points into 2D screen coordinates.
- `tml_build_filtration` — builds the Vietoris-Rips complex at a given `epsilon`, returning edges, accepted triangles, and metadata.

It also exports `tml_free_filtration` to free the result buffer returned by `tml_build_filtration`.

## Point projection flow

### Web side

The function `projectPointsWithWasm(...)` in `src/wasm/vietoris-rips-wasm.ts` does the following:

- Loads the WASM instance once via `WebAssembly.instantiateStreaming(fetch("/tml-filtration.wasm"), imports)`.
- Allocates WASM memory for the raw point buffer and the output buffer.
- Writes the `points: [x, y, z][]` array into a `Float64Array` view over WASM memory.
- Calls the exported `tml_project_points(...)` function.
- Reads back `points.length * 6` double values from WASM memory:
  - `x`, `y`, `z`, `sx`, `sy`, `depth` for each point.
- Returns a typed `ProjectedPoint[]` array with fields:
  - `id`, `x`, `y`, `z`, `sx`, `sy`, `depth`.
- Frees the allocated WASM buffers.

### Native side

The `tml_project_points(...)` implementation in `tml_filtration.cpp` does:

- Read the raw 3D points into a `std::vector<Point3>`.
- Compute the point cloud center and radius.
- Rotate every point by `rotationX` and `rotationY` using an explicit 3D rotation.
- Compute a screen-space transform that centers the rotated cloud and scales it to the viewport.
- Store for each point:
  - 3D rotated coordinates: `x`, `y`, `z`
  - screen coordinates: `sx`, `sy`
  - depth value: normalized depth used for painter-sort rendering.

This result is used by the UI to position circles and sort points by depth.

## Filtration flow

### Web loader and worker

The browser worker is implemented in `tml-wasm-loader.worker.ts`.

It performs these responsibilities:

- Lazily instantiate the WASM module once using `WebAssembly.instantiateStreaming`.
- Provide `buildFiltration(points, epsilon, maxEdges, maxTriangles, seedTriangles)`.
- Cache completed filtrations keyed by `sampleId|maxEdges|maxTriangles|epsilon`.
- Reuse the nearest lower-epsilon filtered result as a seed set.
- Support `calculate` and `preload` worker message kinds.

The worker message flow is:

- `calculate` requests the current filtration for one epsilon.
- `preload` requests additional nearby epsilon values for background caching.

### Writing input to WASM

Inside `tml-wasm-loader.worker.ts`:

- `writePoints(memory, malloc, points)` allocates space and writes the raw point positions into WASM memory.
- If seed triangles are available, they are serialized into a contiguous `Int32Array` buffer of triangle vertex indices.
- The worker calls the native function as:
  - `buildFiltration(pointPtr, points.length, epsilon, maxEdges, maxTriangles, seedPtr, seedCount)`.

### Reading output from WASM

The native function returns a pointer to a `FiltrationHeader` struct.

The loader reads this header from WASM memory as an `Int32Array` of length 11:

- edge pointer
- edge count
- triangle pointer
- triangle count
- accepted triangle pointer
- accepted triangle count
- total triangle count
- non-intersecting triangle count
- seeded triangle count
- components
- cycles

Then it reads:

- `edges` from the edge pointer as pairs of indices.
- `triangles` from the triangle pointer as triples of indices.
- `acceptedTriangles` from the accepted triangle pointer as triples.

Finally it frees the native filtration result and any temporary buffers.

### Seed triangle reuse

The worker caches previous filtrations and uses the nearest lower-epsilon result to seed later computations.

- `getLowerFiltrationSeed(...)` finds the largest cached epsilon below the current one.
- `seedTriangles` is set to `lowerSeed.acceptedTriangles ?? lowerSeed.triangles`.
- The seed count is passed into `tml_build_filtration`.

This makes the browser filtration more responsive when scrubbing epsilon values.

## Native Vietoris-Rips algorithm

The core filtration implementation is in `tml_filtration.cpp` inside `tml_build_filtration(...)`.

The algorithm does:

1. Read raw points into a `std::vector<Point3>`.
2. Build a symmetric neighbor matrix `neigh` where `neigh[i * pointCount + j] = 1` when `distance(points[i], points[j]) <= epsilon`.
3. Build an `edges` list for every connected pair `(i, j)` with distance `<= epsilon`.
4. If the edge count exceeds `maxEdges`, sort edges by length and keep only the shortest `maxEdges`.
5. Create the initial `acceptedTriangles` list from `seedTriangles` passed from JS.
6. Initialize `renderedTriangles` with up to `maxTriangles` seed triangles.
7. Enumerate triangle candidates:
   - For each vertex `i`, gather neighbors `j` with `j > i` and `neigh[i * pointCount + j]`.
   - For every pair `(j, k)` in that neighbor list, if `neigh[j * pointCount + k]` is also true, then `(i,j,k)` is a triangle candidate.
   - Increment `totalTriangleCount` for every candidate.
   - Skip the candidate if it already exists in `acceptedTriangles`.
8. Check geometric intersection with previously accepted triangles:
   - `trianglesIntersect(candidate, accepted, points, 1e-8)` tests true if two triangles cross in 3D space.
   - If they share two vertices, they are allowed and not considered intersecting.
   - If the candidate intersects any accepted triangle, it is rejected.
9. If the triangle is valid, increment `nonIntersectingTriangleCount`, append it to `acceptedTriangles`, and optionally append it to `renderedTriangles` if under `maxTriangles`.

The function also computes graph metadata:

- connected components count using a DFS over `neigh`
- cycle count as `max(edges.size() - pointCount + components, 0)`

Then it packs all data into a `FiltrationHeader` and returns a native pointer.

### Triangle geometry helpers

The C++ code includes helper functions for:

- `distance(...)` — Euclidean point distance.
- `segmentTriangleIntersection(...)` — segment/triangle intersection test.
- `trianglesIntersect(...)` — triangle intersection detection, excluding shared edges.
- `sharesTwoVertices(...)` — allow adjacent triangles to share an edge.
- `hasTriangle(...)` — avoid duplicate accepted triangles.

## Rendering in React

The UI integration is implemented in `app/vietoris-rips-demo.tsx`.

### Point selection and epsilon control

- Point cloud samples are loaded from `src/data/point-cloud-samples.ts`.
- Diagram epsilon steps and homology counts are loaded from `src/data/diagram-samples.ts`.
- `sampleId`, `stepIndex`, and `rotation` are stored in React state.
- The current epsilon is taken from the matched `DIAGRAM_SAMPLES` homology step.

### Projection effect

- A `useEffect(...)` hook calls `projectPointsWithWasm(points, rotation, WIDTH, HEIGHT)` whenever the point cloud or rotation changes.
- The resulting `ProjectedPoint[]` values are stored in state as `projected`.
- Rotation is updated by pointer drag and animated when `playing` is enabled.

### Filtration worker effect

- A `Worker` is created from `/tml-wasm-loader.js`.
- The worker posts a `calculate` message with:
  - `sampleId`, `points`, `epsilon`, `maxEdges`, `maxTriangles`.
- The worker also sends a background `preload` for nearby epsilon values.
- The worker response updates the `filtration` state with edges, triangles, and metadata.

### SVG rendering order

The UI renders the scene in an SVG with the following order:

1. A translucent triangle group (`<polygon>`) from `filtration.triangles`.
2. A line group (`<line>`) for the first `MAX_EDGES` edges from `filtration.edges`.
3. Circles for every projected point.

Point circles are sorted by `depth` before rendering, so points farther back are drawn first.

### Render details

- Triangles are drawn with fill `#8aa197`, stroke `#62776f`, and `opacity=0.4`.
- Edges are drawn with `stroke-opacity=0.28` and width scaled by viewport zoom.
- Points are drawn as filled circles with radius based on depth and zoom.

## What is rendered

The rendered output is:

- `points` — raw 3D point samples projected into 2D screen coordinates.
- `edges` — Vietoris-Rips 1-simplices discovered by `tml_build_filtration` and capped at `maxEdges`.
- `triangles` — non-intersecting 2-simplices selected from the accepted triangle set and capped at `maxTriangles`.

The browser UI reports counts for:

- `triangleCount` — rendered triangle count.
- `nonIntersectingTriangleCount` — number of non-intersecting triangles discovered.
- `seededTriangleCount` — count of triangles seeded from a lower-epsilon cached result.

## Implementation map

- `TML_Demo/src/wasm/tml_filtration.cpp`
  - `tml_project_points(...)`
  - `tml_build_filtration(...)`
  - `tml_free_filtration(...)`
  - triangle intersection helpers

- `TML_Demo/src/wasm/vietoris-rips-wasm.ts`
  - `projectPointsWithWasm(...)`
  - WASM instantiation and memory management

- `TML_Demo/src/wasm/tml-wasm-loader.worker.ts`
  - worker message handling
  - `buildFiltration(...)`
  - seed triangle caching
  - header parsing and array conversion

- `TML_Demo/app/vietoris-rips-demo.tsx`
  - React state for sample/epsilon/rotation
  - point projection effect
  - filtration worker effect
  - SVG rendering of triangles, edges, and points

## Notes

- The heavy filtration work runs in a web worker so the UI stays responsive.
- The WASM module is used both for point projection and for the graph/triangle search.
- The eventual visualization is a lightweight browser translation of the notebook's Vietoris-Rips scene.
