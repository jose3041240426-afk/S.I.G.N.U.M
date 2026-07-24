// Evaluación de modelos Random Forest (accuracy, precision, recall, F1, matriz de confusión)
// Incluye inferencia server-side para calcular métricas sin depender del navegador.

function predictOne(model, features) {
  const votes = {};

  for (const tree of model.trees) {
    let idx = 0;
    const nodes = tree.n;

    while (nodes[idx].l !== -1) {
      idx =
        features[nodes[idx].f] <= nodes[idx].t
          ? nodes[idx].l
          : nodes[idx].r;
    }

    const probs = nodes[idx].v[0];
    let maxP = probs[0];
    let maxIdx = 0;

    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > maxP) {
        maxP = probs[i];
        maxIdx = i;
      }
    }

    const label = model.classes[maxIdx];
    votes[label] = (votes[label] || 0) + 1;
  }

  let bestLabel = "";
  let bestCount = 0;

  for (const [label, count] of Object.entries(votes)) {
    if (count > bestCount) {
      bestLabel = label;
      bestCount = count;
    }
  }

  return { label: bestLabel, confidence: (bestCount / model.nTrees) * 100 };
}

export function evaluateModel(model, testSamples) {
  const classes = model.classes;
  const nClasses = classes.length;

  // Matriz de confusión: [real][predicho]
  const confusion = Array.from({ length: nClasses }, () =>
    new Array(nClasses).fill(0),
  );

  let correct = 0;

  for (const sample of testSamples) {
    const realIdx = classes.indexOf(sample.label);
    if (realIdx === -1) continue;

    const pred = predictOne(model, sample.features);
    const predIdx = classes.indexOf(pred.label);

    if (predIdx !== -1) {
      confusion[realIdx][predIdx]++;
      if (realIdx === predIdx) correct++;
    }
  }

  const total = testSamples.length;
  const accuracy = total > 0 ? correct / total : 0;

  const precisionPerClass = [];
  const recallPerClass = [];

  for (let i = 0; i < nClasses; i++) {
    const tp = confusion[i][i];
    let fpSum = 0;
    let fnSum = 0;

    for (let j = 0; j < nClasses; j++) {
      if (j !== i) {
        fpSum += confusion[j][i];
        fnSum += confusion[i][j];
      }
    }

    const prec = tp + fpSum > 0 ? tp / (tp + fpSum) : 0;
    const rec = tp + fnSum > 0 ? tp / (tp + fnSum) : 0;

    precisionPerClass.push(Math.round(prec * 10000) / 10000);
    recallPerClass.push(Math.round(rec * 10000) / 10000);
  }

  const precisionAvg =
    precisionPerClass.reduce((a, b) => a + b, 0) / nClasses;
  const recallAvg =
    recallPerClass.reduce((a, b) => a + b, 0) / nClasses;
  const f1Score =
    precisionAvg + recallAvg > 0
      ? (2 * precisionAvg * recallAvg) / (precisionAvg + recallAvg)
      : 0;

  return {
    accuracy: Math.round(accuracy * 10000) / 10000,
    precisionAvg: Math.round(precisionAvg * 10000) / 10000,
    recallAvg: Math.round(recallAvg * 10000) / 10000,
    f1Score: Math.round(f1Score * 10000) / 10000,
    confusionMatrix: { classes, matrix: confusion },
    perClass: classes.map((cls, i) => ({
      class: cls,
      precision: precisionPerClass[i],
      recall: recallPerClass[i],
    })),
  };
}

export function trainTestSplit(samples, testRatio = 0.2) {
  const shuffled = [...samples].sort(() => Math.random() - 0.5);
  const testSize = Math.max(1, Math.floor(shuffled.length * testRatio));
  const train = shuffled.slice(testSize);
  const test = shuffled.slice(0, testSize);
  return { train, test };
}
