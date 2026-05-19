# TML Filtration Demo
This is a brief demo of my exploration of topological machine learning and using it to classify point cloud objects. It uses a V-R filtration to generate persistence diagrams, and combines a 3 hidden-layer MLP to process the homology with a traditional CNN. It benchmarks at around 85% on 40 classes using the ModelNet40 dataset.

## Project Structure

- `app/page.tsx` mounts the demo.
- `app/vietoris-rips-demo.tsx` contains the client-side controls and calls WASM for projection and filtration work.
- `src/wasm/tml-wasm-loader.worker.ts` loads the WASM module, exposes the worker message handler, and caches computed filtrations.
- `src/wasm/tml_filtration.cpp` contains the C++ point projection and Vietoris-Rips filtration implementation.
- `src/data/point-cloud-samples.ts` stores the processed point-cloud subset exported from the notebook cache.
- `src/data/diagram-samples.ts` stores matched H1/H2 diagram-derived homology counts for topology-aware diagram epsilon steps.
- `app/globals.css` loads Tailwind CSS, local system font stacks, and global theme variables.

## Data Notes

The committed web data is fetched from `../data/processed/train_points.npy`, which has shape `(9843, 1024, 3)`. Each selected training sample is thinned to 200 points for web-processed filtration, while the homology data is derived from the full point cloud.

## To Run

```bash
npm run dev
npm run build
npm run lint
```

### TODOS
- Add a notebook/web toggle for viewing every exported graph side by side.

+ add ML prediction

+ add server side processing (maybe)
