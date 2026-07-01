// src/singleWorker.js
//
// Este Web Worker representa a versão SINGLE-THREAD do algoritmo.
// Mesmo rodando dentro de um Worker (para não travar a interface do
// navegador), ele executa a ordenação do vetor INTEIRO usando apenas
// UMA thread de trabalho lógica — não há divisão de tarefas aqui.
// A thread principal do navegador fica livre apenas para desenhar a
// interface; quem ordena é este único worker, do início ao fim.

import { mergeSort } from './sort.js';

self.onmessage = function (evento) {
  const { vetor, modo } = evento.data;

  const inicio = performance.now();

  // No modo visual, reportamos cada passo de merge para permitir a
  // animação das barras. No modo benchmark, não reportamos nada, para
  // não distorcer a medição de desempenho com custo de postMessage.
  const onPasso =
    modo === 'visual'
      ? (parcial, offset) => {
          self.postMessage({ tipo: 'progresso', parcial, offset });
        }
      : null;

  const vetorOrdenado = mergeSort(vetor, onPasso, 0);

  const fim = performance.now();

  self.postMessage({
    tipo: 'concluido',
    vetorOrdenado,
    tempoMs: fim - inicio
  });
};
