// src/visualizer.js
// Responsável por desenhar e atualizar as barras verticais que
// representam o vetor sendo ordenado (modo visual).

let maxValorGlobal = 1;

/**
 * Desenha as barras iniciais (vetor desordenado) dentro de um container.
 * @param {string} containerId
 * @param {number[]} vetor
 * @param {number} maxValor - usado para normalizar a altura das barras
 */
export function inicializarBarras(containerId, vetor, maxValor) {
  maxValorGlobal = maxValor || 1;
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  container.classList.remove('concluido-todas');

  const fragmento = document.createDocumentFragment();
  vetor.forEach((valor) => {
    const barra = document.createElement('div');
    barra.className = 'barra';
    barra.style.height = `${(valor / maxValorGlobal) * 100}%`;
    fragmento.appendChild(barra);
  });
  container.appendChild(fragmento);
}

/**
 * Atualiza um trecho das barras com um novo estado (parcialmente ordenado).
 * @param {string} containerId
 * @param {number[]} parcial - trecho do vetor já intercalado
 * @param {number} offset - posição inicial desse trecho no vetor completo
 */
export function atualizarBarras(containerId, parcial, offset) {
  const container = document.getElementById(containerId);
  const barras = container.children;

  for (let i = 0; i < parcial.length; i++) {
    const idx = offset + i;
    const barra = barras[idx];
    if (barra) {
      barra.style.height = `${(parcial[i] / maxValorGlobal) * 100}%`;
      // pequeno destaque visual para indicar a região sendo mexida agora
      barra.classList.add('ativa');
      setTimeout(() => barra.classList.remove('ativa'), 150);
    }
  }
}

/**
 * Marca todas as barras de um container como concluídas (ordenadas).
 * @param {string} containerId
 */
export function marcarConcluido(containerId) {
  const container = document.getElementById(containerId);
  container.classList.add('concluido-todas');
  Array.from(container.children).forEach((barra) => {
    barra.classList.add('concluido');
  });
}

/**
 * Limpa as barras de um container (usado no modo benchmark ou ao reiniciar).
 * @param {string} containerId
 */
export function limparBarras(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  container.classList.remove('concluido-todas');
}
