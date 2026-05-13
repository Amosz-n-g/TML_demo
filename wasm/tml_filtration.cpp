#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <vector>

namespace {

struct Point3 {
  double x;
  double y;
  double z;
};

struct Edge {
  int32_t a;
  int32_t b;
  double length;
};

struct Triangle {
  int32_t a;
  int32_t b;
  int32_t c;
};

struct FiltrationHeader {
  int32_t edgePtr;
  int32_t edgeCount;
  int32_t trianglePtr;
  int32_t triangleCount;
  int32_t acceptedTrianglePtr;
  int32_t acceptedTriangleCount;
  int32_t totalTriangleCount;
  int32_t nonIntersectingTriangleCount;
  int32_t seededTriangleCount;
  int32_t components;
  int32_t cycles;
};

double clamp(double value, double min, double max) {
  return std::min(max, std::max(min, value));
}

Point3 rotatePoint(const Point3& point, double rotationX, double rotationY) {
  const double cosX = std::cos(rotationX);
  const double sinX = std::sin(rotationX);
  const double cosY = std::cos(rotationY);
  const double sinY = std::sin(rotationY);
  const double y = point.y * cosX - point.z * sinX;
  const double z = point.y * sinX + point.z * cosX;
  const double x = point.x * cosY + z * sinY;
  return {x, y, -point.x * sinY + z * cosY};
}

double distance(const Point3& a, const Point3& b) {
  const double dx = a.x - b.x;
  const double dy = a.y - b.y;
  const double dz = a.z - b.z;
  return std::sqrt(dx * dx + dy * dy + dz * dz);
}

Point3 subtract(const Point3& a, const Point3& b) {
  return {a.x - b.x, a.y - b.y, a.z - b.z};
}

Point3 cross(const Point3& a, const Point3& b) {
  return {
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x,
  };
}

double dot(const Point3& a, const Point3& b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

bool segmentTriangleIntersection(
    const Point3& p0,
    const Point3& p1,
    const Point3 tri[3],
    double tol) {
  const Point3 direction = subtract(p1, p0);
  const Point3 edge1 = subtract(tri[1], tri[0]);
  const Point3 edge2 = subtract(tri[2], tri[0]);
  const Point3 h = cross(direction, edge2);
  const double a = dot(edge1, h);
  if (std::abs(a) < tol) return false;
  const double f = 1.0 / a;
  const Point3 s = subtract(p0, tri[0]);
  const double u = f * dot(s, h);
  if (u <= tol || u >= 1.0 - tol) return false;
  const Point3 q = cross(s, edge1);
  const double v = f * dot(direction, q);
  if (v <= tol || u + v >= 1.0 - tol) return false;
  const double t = f * dot(edge2, q);
  return t > tol && t < 1.0 - tol;
}

bool sharesTwoVertices(const Triangle& a, const Triangle& b) {
  int shared = 0;
  const int32_t av[3] = {a.a, a.b, a.c};
  const int32_t bv[3] = {b.a, b.b, b.c};
  for (int ai = 0; ai < 3; ai += 1) {
    for (int bi = 0; bi < 3; bi += 1) {
      if (av[ai] == bv[bi]) shared += 1;
    }
  }
  return shared >= 2;
}

bool trianglesIntersect(
    const Triangle& candidate,
    const Triangle& accepted,
    const std::vector<Point3>& points,
    double tol) {
  if (sharesTwoVertices(candidate, accepted)) return false;

  const Point3 triA[3] = {
      points[candidate.a],
      points[candidate.b],
      points[candidate.c],
  };
  const Point3 triB[3] = {
      points[accepted.a],
      points[accepted.b],
      points[accepted.c],
  };

  for (int dim = 0; dim < 3; dim += 1) {
    double a0 = dim == 0 ? triA[0].x : dim == 1 ? triA[0].y : triA[0].z;
    double a1 = dim == 0 ? triA[1].x : dim == 1 ? triA[1].y : triA[1].z;
    double a2 = dim == 0 ? triA[2].x : dim == 1 ? triA[2].y : triA[2].z;
    double b0 = dim == 0 ? triB[0].x : dim == 1 ? triB[0].y : triB[0].z;
    double b1 = dim == 0 ? triB[1].x : dim == 1 ? triB[1].y : triB[1].z;
    double b2 = dim == 0 ? triB[2].x : dim == 1 ? triB[2].y : triB[2].z;
    const double minA = std::min(a0, std::min(a1, a2));
    const double maxA = std::max(a0, std::max(a1, a2));
    const double minB = std::min(b0, std::min(b1, b2));
    const double maxB = std::max(b0, std::max(b1, b2));
    if (maxA < minB - tol || maxB < minA - tol) return false;
  }

  if (segmentTriangleIntersection(triA[0], triA[1], triB, tol)) return true;
  if (segmentTriangleIntersection(triA[1], triA[2], triB, tol)) return true;
  if (segmentTriangleIntersection(triA[2], triA[0], triB, tol)) return true;
  if (segmentTriangleIntersection(triB[0], triB[1], triA, tol)) return true;
  if (segmentTriangleIntersection(triB[1], triB[2], triA, tol)) return true;
  if (segmentTriangleIntersection(triB[2], triB[0], triA, tol)) return true;
  return false;
}

bool hasTriangle(const std::vector<Triangle>& triangles, const Triangle& candidate) {
  return std::any_of(triangles.begin(), triangles.end(), [&](const Triangle& item) {
    return item.a == candidate.a && item.b == candidate.b && item.c == candidate.c;
  });
}

int connectedComponents(const std::vector<uint8_t>& neigh, int n) {
  std::vector<uint8_t> seen(n, 0);
  std::vector<int> stack;
  int count = 0;

  for (int start = 0; start < n; start += 1) {
    if (seen[start]) continue;
    count += 1;
    stack.push_back(start);
    seen[start] = 1;
    while (!stack.empty()) {
      const int node = stack.back();
      stack.pop_back();
      for (int nbr = 0; nbr < n; nbr += 1) {
        if (neigh[node * n + nbr] && !seen[nbr]) {
          seen[nbr] = 1;
          stack.push_back(nbr);
        }
      }
    }
  }

  return count;
}

int32_t copyEdges(const std::vector<Edge>& edges) {
  if (edges.empty()) return 0;
  auto* out = static_cast<int32_t*>(std::malloc(edges.size() * 2 * sizeof(int32_t)));
  for (size_t i = 0; i < edges.size(); i += 1) {
    out[i * 2] = edges[i].a;
    out[i * 2 + 1] = edges[i].b;
  }
  return reinterpret_cast<int32_t>(out);
}

int32_t copyTriangles(const std::vector<Triangle>& triangles) {
  if (triangles.empty()) return 0;
  auto* out = static_cast<int32_t*>(std::malloc(triangles.size() * 3 * sizeof(int32_t)));
  for (size_t i = 0; i < triangles.size(); i += 1) {
    out[i * 3] = triangles[i].a;
    out[i * 3 + 1] = triangles[i].b;
    out[i * 3 + 2] = triangles[i].c;
  }
  return reinterpret_cast<int32_t>(out);
}

}  // namespace

extern "C" {

__attribute__((visibility("default")))
void tml_project_points(
    const double* rawPoints,
    int32_t pointCount,
    double rotationX,
    double rotationY,
    double width,
    double height,
    double* outPoints) {
  if (pointCount <= 0) return;

  std::vector<Point3> points(pointCount);
  Point3 center{0, 0, 0};
  for (int32_t i = 0; i < pointCount; i += 1) {
    const Point3 point{rawPoints[i * 3], rawPoints[i * 3 + 1], rawPoints[i * 3 + 2]};
    points[i] = point;
    center.x += point.x / pointCount;
    center.y += point.y / pointCount;
    center.z += point.z / pointCount;
  }

  double radius = 0.001;
  for (const Point3& point : points) {
    radius = std::max(radius, distance(point, center));
  }

  const double scale = std::min(width, height) * 0.36 / radius;
  const Point3 rotatedCenter = rotatePoint(center, rotationX, rotationY);

  for (int32_t i = 0; i < pointCount; i += 1) {
    const Point3 point = rotatePoint(points[i], rotationX, rotationY);
    outPoints[i * 6] = point.x;
    outPoints[i * 6 + 1] = point.y;
    outPoints[i * 6 + 2] = point.z;
    outPoints[i * 6 + 3] = width / 2.0 + (point.x - rotatedCenter.x) * scale;
    outPoints[i * 6 + 4] = height / 2.0 + (point.y - rotatedCenter.y) * scale;
    outPoints[i * 6 + 5] = clamp((point.z - rotatedCenter.z) / (radius * 2.0) + 0.5, 0, 1);
  }
}

__attribute__((visibility("default")))
int32_t tml_build_filtration(
    const double* rawPoints,
    int32_t pointCount,
    double epsilon,
    int32_t maxEdges,
    int32_t maxTriangles,
    const int32_t* seedTriangles,
    int32_t seedTriangleCount) {
  std::vector<Point3> points(pointCount);
  for (int32_t i = 0; i < pointCount; i += 1) {
    points[i] = {rawPoints[i * 3], rawPoints[i * 3 + 1], rawPoints[i * 3 + 2]};
  }

  std::vector<uint8_t> neigh(pointCount * pointCount, 0);
  std::vector<Edge> edges;
  for (int32_t i = 0; i < pointCount; i += 1) {
    for (int32_t j = i + 1; j < pointCount; j += 1) {
      const double length = distance(points[i], points[j]);
      if (length <= epsilon) {
        edges.push_back({i, j, length});
        neigh[i * pointCount + j] = 1;
        neigh[j * pointCount + i] = 1;
      }
    }
  }

  if (static_cast<int32_t>(edges.size()) > maxEdges) {
    std::sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) {
      return a.length < b.length;
    });
    edges.resize(maxEdges);
  }

  std::vector<Triangle> acceptedTriangles;
  acceptedTriangles.reserve(std::max(seedTriangleCount, 0));
  for (int32_t i = 0; i < seedTriangleCount; i += 1) {
    acceptedTriangles.push_back({
        seedTriangles[i * 3],
        seedTriangles[i * 3 + 1],
        seedTriangles[i * 3 + 2],
    });
  }

  std::vector<Triangle> renderedTriangles;
  for (int32_t i = 0; i < seedTriangleCount && i < maxTriangles; i += 1) {
    renderedTriangles.push_back(acceptedTriangles[i]);
  }

  int32_t totalTriangleCount = 0;
  int32_t nonIntersectingTriangleCount = seedTriangleCount;
  for (int32_t i = 0; i < pointCount - 2; i += 1) {
    std::vector<int32_t> js;
    for (int32_t j = i + 1; j < pointCount; j += 1) {
      if (neigh[i * pointCount + j]) js.push_back(j);
    }
    if (js.size() < 2) continue;

    for (size_t aIdx = 0; aIdx < js.size() - 1; aIdx += 1) {
      const int32_t j = js[aIdx];
      for (size_t bIdx = aIdx + 1; bIdx < js.size(); bIdx += 1) {
        const int32_t k = js[bIdx];
        if (!neigh[j * pointCount + k]) continue;

        const Triangle candidate{i, j, k};
        totalTriangleCount += 1;
        if (hasTriangle(acceptedTriangles, candidate)) continue;

        bool intersects = false;
        for (const Triangle& accepted : acceptedTriangles) {
          if (trianglesIntersect(candidate, accepted, points, 1e-8)) {
            intersects = true;
            break;
          }
        }
        if (intersects) continue;

        nonIntersectingTriangleCount += 1;
        acceptedTriangles.push_back(candidate);
        if (static_cast<int32_t>(renderedTriangles.size()) < maxTriangles) {
          renderedTriangles.push_back(candidate);
        }
      }
    }
  }

  const int32_t components = connectedComponents(neigh, pointCount);
  const int32_t cycles = std::max(static_cast<int32_t>(edges.size()) - pointCount + components, 0);

  auto* header = static_cast<FiltrationHeader*>(std::malloc(sizeof(FiltrationHeader)));
  header->edgePtr = copyEdges(edges);
  header->edgeCount = static_cast<int32_t>(edges.size());
  header->trianglePtr = copyTriangles(renderedTriangles);
  header->triangleCount = static_cast<int32_t>(renderedTriangles.size());
  header->acceptedTrianglePtr = copyTriangles(acceptedTriangles);
  header->acceptedTriangleCount = static_cast<int32_t>(acceptedTriangles.size());
  header->totalTriangleCount = totalTriangleCount;
  header->nonIntersectingTriangleCount = nonIntersectingTriangleCount;
  header->seededTriangleCount = seedTriangleCount;
  header->components = components;
  header->cycles = cycles;
  return reinterpret_cast<int32_t>(header);
}

__attribute__((visibility("default")))
void tml_free_filtration(int32_t resultPtr) {
  if (!resultPtr) return;
  auto* header = reinterpret_cast<FiltrationHeader*>(resultPtr);
  std::free(reinterpret_cast<void*>(header->edgePtr));
  std::free(reinterpret_cast<void*>(header->trianglePtr));
  std::free(reinterpret_cast<void*>(header->acceptedTrianglePtr));
  std::free(header);
}

}
