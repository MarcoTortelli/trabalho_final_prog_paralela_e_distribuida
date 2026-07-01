// src/parallelSort.js
//
// Orquestra a versão MULTITHREAD do Merge Sort:
//  1) divide o vetor original em N partes (uma por worker);
//  2) cria N Web Workers e envia uma parte para cada um;
//  3) cada worker ordena sua parte de forma independente (em paralelo);
//  4) a thread principal recebe as partes já ordenadas;
//  5) a thread principal faz o merge final das partes ordenadas;
//  6) o vetor final é validado.

import { merge, estaOrdenado } from './sort.js';

/**
 * Ordena um vetor usando múltiplos Web Workers.
 *
 * @param {number[]} vetorOriginal
 * @param {number} numWorkers - quantidade de workers a criar (ex: 2, 4, 8)
 * @param {string} modo - 'visual' | 'benchmark'
 * @param {function|null} onProgresso - callback(parcial, offset) chamado
 *        a cada passo de merge reportado pelos workers (modo visual) e
 *        também durante o merge final feito na thread principal.
 * @returns {Promise<{vetorOrdenado:number[], tempoMs:number, correto:boolean}>}
 */
export function ordenarParalelo(vetorOriginal, numWorkers, modo = 'benchmark', onProgresso = null) {
  return new Promise((resolve, reject) => {
    const inicio = performance.now();
    const n = vetorOriginal.length;
    const tamanhoParte = Math.ceil(n / numWorkers);

    // 1) Divisão do vetor original em partes (balanceamento de carga:
    // cada worker recebe uma fatia de tamanho aproximadamente igual).
    const partes = [];
    for (let i = 0; i < numWorkers; i++) {
      const ini = i * tamanhoParte;
      const fim = Math.min(ini + tamanhoParte, n);
      if (ini < fim) {
        partes.push({ vetor: vetorOriginal.slice(ini, fim), offset: ini });
      }
    }

    const totalPartes = partes.length;
    if (totalPartes === 0) {
      resolve({ vetorOrdenado: [], tempoMs: 0, correto: true });
      return;
    }

    const resultados = new Array(totalPartes);
    let concluidos = 0;
    const workers = [];

    // 2) e 3) Criação dos workers e envio das partes para ordenação paralela.
    partes.forEach((parte, indice) => {
      const worker = new Worker(new URL('./sortWorker.js', import.meta.url), {
        type: 'module'
      });
      workers.push(worker);

      worker.onmessage = (evento) => {
        const msg = evento.data;

        if (msg.tipo === 'progresso') {
          if (onProgresso) onProgresso(msg.parcial, msg.offset);
          return;
        }

        if (msg.tipo === 'concluido') {
          // 4) Recebimento da parte já ordenada.
          resultados[indice] = { vetor: msg.vetorOrdenado, offset: msg.offset };
          concluidos++;
          worker.terminate();

          if (concluidos === totalPartes) {
            // 5) Merge final das partes ordenadas, feito na thread principal.
            resultados.sort((a, b) => a.offset - b.offset);

            let vetorFinal = resultados[0].vetor;
            for (let i = 1; i < resultados.length; i++) {
              vetorFinal = merge(vetorFinal, resultados[i].vetor);
              if (onProgresso) onProgresso(vetorFinal.slice(), 0);
            }

            const fim = performance.now();

            // 6) Validação do resultado final.
            resolve({
              vetorOrdenado: vetorFinal,
              tempoMs: fim - inicio,
              correto: estaOrdenado(vetorFinal)
            });
          }
        }
      };

      worker.onerror = (erro) => {
        reject(erro);
      };

      worker.postMessage({ vetor: parte.vetor, offset: parte.offset, modo });
    });
  });
}
