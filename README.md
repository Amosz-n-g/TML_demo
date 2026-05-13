# TML Demo

This Next.js app turns the notebook's Rotatable Vietoris-Rips Filtration scene into an interactive browser demo. The page renders real processed ModelNet40 point clouds from the notebook cache, lets the user rotate them, and rebuilds the Vietoris-Rips complex as the filtration radius changes.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the demo.

## Notebook-to-Web Pipeline

The source notebook is `../notebooks/tml_pointcloud_pipeline.ipynb`. Its filtration section builds normalized point clouds, computes Vietoris-Rips persistent homology with `giotto-tda`, and exports rotatable Plotly scenes. The web version follows the same conceptual stages in a lightweight Next.js format:

1. **Load processed notebook points**  
   The notebook samples mesh surfaces, normalizes each point cloud, and subsamples with FPS into `../data/processed/train_points.npy` and `../data/processed/train_labels.npy`. A compact web subset is stored in `src/data/point-cloud-samples.ts`.

2. **Represent the filtration state**  
   For a selected notebook epsilon step, `src/wasm/tml-wasm-loader.worker.ts` runs the C++/WASM filtration logic: it builds upper-triangle Vietoris-Rips edges, keeps the shortest edges when the cap is exceeded, searches full-neighborhood triangles, counts every detected 2-simplex, and displays rendered triangles whose interiors do not cross accepted triangles.

3. **Project the rotatable scene**  
   The notebook's Plotly scene is translated into a React/SVG renderer. Pointer drag updates X/Y rotation, the 3D points are projected into 2D, and edges/triangles are redrawn from the current filtration.

4. **Attach persistence diagram homology counts**  
   `src/data/diagram-samples.ts` exports matching H1/H2 persistence data from `../data/diagrams/tml_demo_homology_counts.json`, which is generated from the exact `train_diagram_items/*.npz` item IDs for the website examples. Each giotto-tda diagram row is interpreted as `[birth, death, homology_dimension]`. The UI reports alive H1/H2 classes at topology-aware diagram epsilon values sampled from H1/H2 birth-death critical events, while the browser scene uses matched visual epsilon values on the 200-point subset.

5. **Expose interactive controls**  
   The page includes a discrete matched-step slider, play/pause animation, sample selection, live simplex counts, visual epsilon, diagram epsilon, and changing H1/H2 counts. This mirrors scrubbing through the notebook's filtration frames without requiring Python, Plotly, or the full model pipeline in the browser.

6. **Refresh the web data**  
   Keep the expensive work in Python: preprocess meshes, normalize point clouds, compute diagrams, and save the `.npy` caches. Then regenerate `src/data/point-cloud-samples.ts` from selected cache rows so the Next.js bundle contains only the point clouds needed for the demo.

7. **Cache filtration work off the UI thread**  
   The `src/wasm/tml-wasm-loader.worker.ts` worker caches filtration results by sample/epsilon/caps. Larger filtrations seed their rendered triangle set from the nearest smaller cached epsilon before scanning new candidates, then nearby epsilon values are precomputed in the background to make slider scrubbing smoother.

## Project Structure

- `app/page.tsx` mounts the demo.
- `app/vietoris-rips-demo.tsx` contains the client-side controls and calls WASM for projection and filtration work.
- `src/wasm/tml-wasm-loader.worker.ts` loads the WASM module, exposes the worker message handler, and caches computed filtrations.
- `src/wasm/tml_filtration.cpp` contains the C++ point projection and Vietoris-Rips filtration implementation.
- `src/data/point-cloud-samples.ts` stores the processed point-cloud subset exported from the notebook cache.
- `src/data/diagram-samples.ts` stores matched H1/H2 diagram-derived homology counts for topology-aware diagram epsilon steps.
- `app/globals.css` loads Tailwind CSS, local system font stacks, and global theme variables.

## Data Notes

The committed web data is generated from `../data/processed/train_points.npy`, which has shape `(9843, 1024, 3)`. Each selected training sample is deterministically thinned to 200 points for responsive all-pairs filtration in the browser while preserving the normalized geometry produced by the notebook pipeline.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

### TODOS
- Add a notebook/web toggle for viewing every exported graph side by side.

+ add ML prediction

+ add server side processing (maybe)
