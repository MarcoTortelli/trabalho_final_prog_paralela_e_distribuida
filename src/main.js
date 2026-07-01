// src/main.js
// Controla a interface: eventos dos botões, geração do vetor, disparo
// das ordenações single-thread e multithread, medição de tempo com
// performance.now(), cálculo de speed-up/eficiência e atualização da tela.

import { gerarVetorAleatorio, estaOrdenado } from './sort.js';
import { ordenarParalelo } from './parallelSort.js';
import {
  inicializarBarras,
  atualizarBarras,
  marcarConcluido,
  limparBarras
} from './visualizer.js';

// --- Elementos da interface ---
const inputTamanho = document.getElementById('tamanho-vetor');
const inputWorkers = document.getElementById('num-workers');
const btnGerar = document.getElementById('btn-gerar');
const btnComparar = document.getElementById('btn-comparar');
const btnSingle = document.getElementById('btn-single');
const btnMulti = document.getElementById('btn-multi');
const btnLimpar = document.getElementById('btn-limpar');
const corpoTabela = document.getElementById('corpo-tabela');
const statusEl = document.getElementById('status');
const modoEl = document.getElementById('modo-atual');

// --- Estado da aplicação ---
let vetorOriginal = [];
let maxValor = 1000;

// Acima deste tamanho, a aplicação entra automaticamente em modo
// benchmark (sem animação, foco na medição correta de desempenho).
const LIMITE_MODO_VISUAL = 500;

function modoAtual(tamanho) {
  return tamanho <= LIMITE_MODO_VISUAL ? 'visual' : 'benchmark';
}

// --- Fila de animação ---
// Desacopla a chegada dos dados (que pode ser muito rápida) da
// velocidade de exibição na tela, permitindo uma animação legível.
function criarFilaAnimacao(containerId, atrasoMs = 25) {
  const fila = [];
  let executando = false;

  function processarProximo() {
    if (fila.length === 0) {
      executando = false;
      return;
    }
    executando = true;
    const { parcial, offset } = fila.shift();
    atualizarBarras(containerId, parcial, offset);
    setTimeout(processarProximo, atrasoMs);
  }

  return {
    adicionar(parcial, offset) {
      fila.push({ parcial, offset });
      if (!executando) processarProximo();
    }
  };
}

// --- Ordenação single-thread (executa em um único Web Worker) ---
function ordenarSingleThread(vetor, modo, onProgresso) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./singleWorker.js', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (evento) => {
      const msg = evento.data;
      if (msg.tipo === 'progresso') {
        if (onProgresso) onProgresso(msg.parcial, msg.offset);
      } else if (msg.tipo === 'concluido') {
        worker.terminate();
        resolve({
          vetorOrdenado: msg.vetorOrdenado,
          tempoMs: msg.tempoMs,
          correto: estaOrdenado(msg.vetorOrdenado)
        });
      }
    };

    worker.onerror = (erro) => reject(erro);
    worker.postMessage({ vetor, modo });
  });
}

async function executarSingle(vetor, modo, animar) {
  const fila = animar ? criarFilaAnimacao('barras-single') : null;
  const onProgresso = animar ? (p, o) => fila.adicionar(p, o) : null;
  const resultado = await ordenarSingleThread(vetor, modo, onProgresso);
  if (animar) setTimeout(() => marcarConcluido('barras-single'), 300);
  return resultado;
}

async function executarMulti(vetor, numWorkers, modo, animar) {
  const fila = animar ? criarFilaAnimacao('barras-multi') : null;
  const onProgresso = animar ? (p, o) => fila.adicionar(p, o) : null;
  const resultado = await ordenarParalelo(vetor, numWorkers, modo, onProgresso);
  if (animar) setTimeout(() => marcarConcluido('barras-multi'), 300);
  return resultado;
}

// --- Métricas ---
function calcularMetricas(tempoSingle, tempoMulti, numWorkers) {
  const speedUp = tempoSingle / tempoMulti;
  const eficiencia = speedUp / numWorkers;
  return { speedUp, eficienciaPercentual: eficiencia * 100 };
}

function adicionarLinhaTabela({
  tamanho,
  workers,
  tempoSingle,
  tempoMulti,
  speedUp,
  eficienciaPercentual,
  corretoSingle,
  corretoMulti
}) {
  const linha = document.createElement('tr');
  const correto = corretoSingle && corretoMulti ? 'Sim' : 'Não';
  linha.innerHTML = `
    <td>${tamanho.toLocaleString('pt-BR')}</td>
    <td>${workers}</td>
    <td>${tempoSingle.toFixed(2)} ms</td>
    <td>${tempoMulti.toFixed(2)} ms</td>
    <td>${speedUp.toFixed(2)}x</td>
    <td>${eficienciaPercentual.toFixed(1)}%</td>
    <td class="${correto === 'Sim' ? 'ok' : 'erro'}">${correto}</td>
  `;
  corpoTabela.appendChild(linha);
}

// --- Ações principais ---
function gerarNovoVetor() {
  const tamanho = parseInt(inputTamanho.value, 10);
  if (!tamanho || tamanho < 2) {
    statusEl.textContent = 'Informe um tamanho de vetor válido (mínimo 2).';
    return;
  }

  vetorOriginal = gerarVetorAleatorio(tamanho, 1000);
  maxValor = Math.max(...vetorOriginal);

  const modo = modoAtual(tamanho);
  modoEl.textContent = modo === 'visual' ? 'Visual' : 'Benchmark';

  if (modo === 'visual') {
    inicializarBarras('barras-single', vetorOriginal, maxValor);
    inicializarBarras('barras-multi', vetorOriginal, maxValor);
  } else {
    limparBarras('barras-single');
    limparBarras('barras-multi');
  }

  statusEl.textContent = `Vetor gerado com ${tamanho.toLocaleString('pt-BR')} elementos.`;
}

async function executarComparacao() {
  if (vetorOriginal.length === 0) {
    statusEl.textContent = 'Gere um vetor primeiro.';
    return;
  }

  desabilitarBotoes(true);
  const tamanho = vetorOriginal.length;
  const numWorkers = parseInt(inputWorkers.value, 10);
  const modo = modoAtual(tamanho);
  const animar = modo === 'visual';

  if (animar) {
    inicializarBarras('barras-single', vetorOriginal, maxValor);
    inicializarBarras('barras-multi', vetorOriginal, maxValor);
  }

  // Mesmo vetor original, duas cópias independentes -> comparação justa.
  const vetorSingle = [...vetorOriginal];
  const vetorMulti = [...vetorOriginal];

  statusEl.textContent = 'Executando comparação (single-thread e multithread em paralelo)...';

  try {
    const [resSingle, resMulti] = await Promise.all([
      executarSingle(vetorSingle, modo, animar),
      executarMulti(vetorMulti, numWorkers, modo, animar)
    ]);

    const { speedUp, eficienciaPercentual } = calcularMetricas(
      resSingle.tempoMs,
      resMulti.tempoMs,
      numWorkers
    );

    adicionarLinhaTabela({
      tamanho,
      workers: numWorkers,
      tempoSingle: resSingle.tempoMs,
      tempoMulti: resMulti.tempoMs,
      speedUp,
      eficienciaPercentual,
      corretoSingle: resSingle.correto,
      corretoMulti: resMulti.correto
    });

    statusEl.textContent = `Concluído! Speed-up: ${speedUp.toFixed(2)}x | Eficiência: ${eficienciaPercentual.toFixed(1)}%`;
  } catch (erro) {
    console.error(erro);
    statusEl.textContent = 'Ocorreu um erro durante a execução. Veja o console.';
  } finally {
    desabilitarBotoes(false);
  }
}

async function executarApenasSingle() {
  if (vetorOriginal.length === 0) {
    statusEl.textContent = 'Gere um vetor primeiro.';
    return;
  }
  desabilitarBotoes(true);
  const modo = modoAtual(vetorOriginal.length);
  if (modo === 'visual') inicializarBarras('barras-single', vetorOriginal, maxValor);

  try {
    const resultado = await executarSingle([...vetorOriginal], modo, modo === 'visual');
    statusEl.textContent = `Single-thread: ${resultado.tempoMs.toFixed(2)} ms — Ordenado corretamente: ${resultado.correto ? 'Sim' : 'Não'}`;
  } finally {
    desabilitarBotoes(false);
  }
}

async function executarApenasMulti() {
  if (vetorOriginal.length === 0) {
    statusEl.textContent = 'Gere um vetor primeiro.';
    return;
  }
  desabilitarBotoes(true);
  const numWorkers = parseInt(inputWorkers.value, 10);
  const modo = modoAtual(vetorOriginal.length);
  if (modo === 'visual') inicializarBarras('barras-multi', vetorOriginal, maxValor);

  try {
    const resultado = await executarMulti([...vetorOriginal], numWorkers, modo, modo === 'visual');
    statusEl.textContent = `Multithread (${numWorkers} workers): ${resultado.tempoMs.toFixed(2)} ms — Ordenado corretamente: ${resultado.correto ? 'Sim' : 'Não'}`;
  } finally {
    desabilitarBotoes(false);
  }
}

function limparTudo() {
  vetorOriginal = [];
  limparBarras('barras-single');
  limparBarras('barras-multi');
  corpoTabela.innerHTML = '';
  statusEl.textContent = 'Pronto. Gere um novo vetor para começar.';
  modoEl.textContent = '—';
}

function desabilitarBotoes(desabilitado) {
  [btnGerar, btnComparar, btnSingle, btnMulti, btnLimpar].forEach((b) => {
    b.disabled = desabilitado;
  });
}

// --- Registro dos eventos ---
btnGerar.addEventListener('click', gerarNovoVetor);
btnComparar.addEventListener('click', executarComparacao);
btnSingle.addEventListener('click', executarApenasSingle);
btnMulti.addEventListener('click', executarApenasMulti);
btnLimpar.addEventListener('click', limparTudo);

// Gera um vetor inicial ao carregar a página.
gerarNovoVetor();
