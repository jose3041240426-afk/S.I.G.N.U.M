// Random Forest trainer (extraído de frontend/src/services/rf-trainer.ts)
// JS plano ESM para ejecutarse en Node.js sin build step.

function gini(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let imp = 0;
  for (const c of counts) {
    const p = c / total;
    imp += p * (1 - p);
  }
  return imp;
}

function classCounts(labels, classes) {
  const counts = new Array(classes.length).fill(0);
  for (const label of labels) {
    const idx = classes.indexOf(label);
    if (idx >= 0) counts[idx]++;
  }
  return counts;
}

function findBestSplit(data, featureIndices, classes) {
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestGini = Infinity;

  for (const f of featureIndices) {
    const vals = data.map((d) => d.features[f]);
    const sorted = [...new Set(vals)].sort((a, b) => a - b);

    for (let i = 0; i < sorted.length - 1; i++) {
      const threshold = (sorted[i] + sorted[i + 1]) / 2;
      const leftLabels = [];
      const rightLabels = [];

      for (const d of data) {
        if (d.features[f] <= threshold) {
          leftLabels.push(d.label);
        } else {
          rightLabels.push(d.label);
        }
      }

      if (leftLabels.length === 0 || rightLabels.length === 0) continue;

      const leftCounts = classCounts(leftLabels, classes);
      const rightCounts = classCounts(rightLabels, classes);
      const leftTotal = leftCounts.reduce((a, b) => a + b, 0);
      const rightTotal = rightCounts.reduce((a, b) => a + b, 0);
      const total = leftTotal + rightTotal;

      const weighted =
        (leftTotal / total) * gini(leftCounts) +
        (rightTotal / total) * gini(rightCounts);

      if (weighted < bestGini) {
        bestGini = weighted;
        bestFeature = f;
        bestThreshold = threshold;
      }
    }
  }

  return { feature: bestFeature, threshold: bestThreshold, bestGini };
}

function buildTree(data, featureIndices, classes, depth, maxDepth, minSamplesLeaf) {
  const nodes = [];

  function recurse(samples, d) {
    const nodeIdx = nodes.length;
    const labels = samples.map((s) => s.label);
    const uniqueLabels = new Set(labels);

    if (uniqueLabels.size === 1 || d >= maxDepth || samples.length < minSamplesLeaf * 2) {
      const counts = classCounts(labels, classes);
      const total = counts.reduce((a, b) => a + b, 0);
      const probs =
        total > 0
          ? counts.map((c) => Math.round((c / total) * 1000) / 1000)
          : counts.map(() => 1 / classes.length);
      nodes.push({ f: -2, t: -2.0, l: -1, r: -1, v: [probs] });
      return nodeIdx;
    }

    const { feature, threshold } = findBestSplit(samples, featureIndices, classes);

    if (feature === -1) {
      const counts = classCounts(labels, classes);
      const total = counts.reduce((a, b) => a + b, 0);
      const probs =
        total > 0
          ? counts.map((c) => Math.round((c / total) * 1000) / 1000)
          : counts.map(() => 1 / classes.length);
      nodes.push({ f: -2, t: -2.0, l: -1, r: -1, v: [probs] });
      return nodeIdx;
    }

    nodes.push({ f: feature, t: threshold, l: -1, r: -1 });

    const leftData = samples.filter((s) => s.features[feature] <= threshold);
    const rightData = samples.filter((s) => s.features[feature] > threshold);

    if (leftData.length < minSamplesLeaf || rightData.length < minSamplesLeaf) {
      const counts = classCounts(labels, classes);
      const total = counts.reduce((a, b) => a + b, 0);
      const probs =
        total > 0
          ? counts.map((c) => Math.round((c / total) * 1000) / 1000)
          : counts.map(() => 1 / classes.length);
      nodes[nodeIdx] = { f: -2, t: -2.0, l: -1, r: -1, v: [probs] };
      return nodeIdx;
    }

    const leftIdx = recurse(leftData, d + 1);
    const rightIdx = recurse(rightData, d + 1);

    nodes[nodeIdx].l = leftIdx;
    nodes[nodeIdx].r = rightIdx;

    return nodeIdx;
  }

  recurse(data, 0);
  return nodes;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function trainRandomForest(samples, options = {}) {
  const {
    nTrees = 50,
    maxDepth = 15,
    maxFeatures,
    minSamplesLeaf = 2,
  } = options;

  const allLabels = samples.map((s) => s.label);
  const classes = [...new Set(allLabels)].sort();
  const nFeatures = samples[0].features.length;
  const sqrtFeatures = Math.max(1, Math.floor(Math.sqrt(nFeatures)));
  const mFeatures = maxFeatures ?? sqrtFeatures;

  const trees = [];

  for (let t = 0; t < nTrees; t++) {
    const bootstrapIdx = Array.from(
      { length: samples.length },
      () => Math.floor(Math.random() * samples.length),
    );
    const bootstrapData = bootstrapIdx.map((i) => samples[i]);

    const allFeatureIndices = Array.from({ length: nFeatures }, (_, i) => i);
    const featureSubset = shuffleArray(allFeatureIndices).slice(0, mFeatures);

    const treeNodes = buildTree(
      bootstrapData,
      featureSubset,
      classes,
      0,
      maxDepth,
      minSamplesLeaf,
    );

    trees.push({ n: treeNodes });
  }

  return { nTrees, nFeatures, classes, trees };
}
