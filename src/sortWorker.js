// src/sortWorker.js
//
// Este Web Worker representa UMA das threads de trabalho da versão
// MULTITHREAD. Ele recebe apenas uma PARTE do vetor original, ordena
// essa parte com Merge Sort, e devolve o resultado para a thread
// principal, que depois fará o merge final entre todas as partes.

import { mergeSort } from './sort.js';

self.onmessage = function (evento) {
  const { vetor, offset, modo } = evento.data;

  const onPasso =
    modo === 'visual'
      ? (parcial, offsetLocal) => {
          // offsetLocal é relativo a esta parte; somamos o offset
          // global para que a barra correta seja atualizada na tela.
          self.postMessage({
            tipo: 'progresso',
            parcial,
            offset: offset + offsetLocal
          });
        }
      : null;

  const vetorOrdenado = mergeSort(vetor, onPasso, 0);

  self.postMessage({
    tipo: 'concluido',
    vetorOrdenado,
    offset
  });
};
