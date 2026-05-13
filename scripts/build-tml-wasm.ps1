$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot "wasm/tml_filtration.cpp"
$output = Join-Path $repoRoot "public/tml-filtration.wasm"

docker run --rm `
  -v "${repoRoot}:/src" `
  -w /src `
  emscripten/emsdk:latest `
  emcc wasm/tml_filtration.cpp `
    -O3 `
    -std=c++17 `
    -s STANDALONE_WASM=1 `
    -s ALLOW_MEMORY_GROWTH=1 `
    "-Wl,--no-entry" `
    "-Wl,--export=malloc" `
    "-Wl,--export=free" `
    "-Wl,--export=tml_project_points" `
    "-Wl,--export=tml_build_filtration" `
    "-Wl,--export=tml_free_filtration" `
    -o public/tml-filtration.wasm

if (!(Test-Path $output)) {
  throw "WASM build failed: $output was not created."
}

Write-Host "Built $output from $source"
