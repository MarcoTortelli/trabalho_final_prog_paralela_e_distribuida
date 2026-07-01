// src/sort.js
// Implementação manual do algoritmo Merge Sort.
// Não utiliza array.sort() para a ordenação principal.

/**
 * Faz o merge (intercalação) de dois vetores já ordenados.
 * @param {number[]} esquerda
 * @param {number[]} direita
 * @returns {number[]} vetor resultante ordenado
 */
export function merge(esquerda, direita) {
  const resultado = [];
  let i = 0;
  let j = 0;

  while (i < esquerda.length && j < direita.length) {
    if (esquerda[i] <= direita[j]) {
      resultado.push(esquerda[i]);
      i++;
    } else {
      resultado.push(direita[j]);
      j++;
    }
  }

  while (i < esquerda.length) {
    resultado.push(esquerda[i]);
    i++;
  }

  while (j < direita.length) {
    resultado.push(direita[j]);
    j++;
  }

  return resultado;
}

/**
 * Merge Sort recursivo implementado manualmente.
 *
 * @param {number[]} vetor - vetor (ou parte do vetor) a ser ordenado
 * @param {function|null} onPasso - callback opcional, chamado a cada merge
 *        concluído. Recebe (vetorParcialOrdenado, deslocamento). Usado
 *        apenas no modo visual, para permitir animação das barras.
 * @param {number} offset - deslocamento deste trecho em relação ao vetor
 *        original completo (usado para saber onde atualizar as barras)
 * @returns {number[]} novo vetor ordenado
 */
export function mergeSort(vetor, onPasso = null, offset = 0) {
  if (vetor.length <= 1) {
    return vetor;
  }

  const meio = Math.floor(vetor.length / 2);
  const parteEsquerda = mergeSort(vetor.slice(0, meio), onPasso, offset);
  const parteDireita = mergeSort(vetor.slice(meio), onPasso, offset + meio);

  const resultado = merge(parteEsquerda, parteDireita);

  if (onPasso) {
    // Envia uma cópia do estado atual desse trecho, já intercalado,
    // para que a visualização possa atualizar as barras correspondentes.
    onPasso(resultado.slice(), offset);
  }

  return resultado;
}

/**
 * Verifica se um vetor está corretamente ordenado (ordem crescente).
 * @param {number[]} vetor
 * @returns {boolean}
 */
export function estaOrdenado(vetor) {
  for (let i = 1; i < vetor.length; i++) {
    if (vetor[i - 1] > vetor[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Gera um vetor de números aleatórios.
 * @param {number} tamanho - quantidade de elementos
 * @param {number} max - valor máximo (exclusivo do zero, entre 1 e max)
 * @returns {number[]}
 */
export function gerarVetorAleatorio(tamanho, max = 1000) {
  const vetor = new Array(tamanho);
  for (let i = 0; i < tamanho; i++) {
    vetor[i] = Math.floor(Math.random() * max) + 1;
  }
  return vetor;
}
