# Ordenação Paralela em JavaScript — Single-thread vs Multithread

Trabalho Prático Final da disciplina de **Programação Paralela e Distribuída**.

Aplicação web que compara, visual e tecnicamente, uma ordenação **Merge Sort single-thread** com uma ordenação **Merge Sort multithread** (usando **Web Workers**), medindo tempo de execução, speed-up e eficiência.

---

## 1. Descrição do problema

Ordenar um vetor é um problema clássico da Ciência da Computação. Quando o vetor é muito grande, ordená-lo com um único fluxo de execução pode ser lento. Uma forma de acelerar o processo é dividir o vetor em partes menores, ordenar cada parte em paralelo (em threads/processos diferentes) e depois combinar (merge) os resultados. Este projeto implementa e compara as duas abordagens.

## 2. Objetivo

Desenvolver uma aplicação web que demonstre, de forma visual e prática, a diferença entre:

- **Single-thread**: uma única thread de trabalho ordena o vetor inteiro;
- **Multithread**: várias threads de trabalho (Web Workers) ordenam partes do vetor em paralelo, com merge final feito pela thread principal.

E que meça: tempo de execução, **speed-up** e **eficiência**.

## 3. Tecnologias utilizadas

- HTML5 e CSS3
- JavaScript puro (ES Modules), sem frameworks
- **Web Workers** (com `type: "module"`)
- **Vite**, apenas como servidor de desenvolvimento
- Nenhuma biblioteca externa de ordenação — Merge Sort implementado manualmente

## 4. Como instalar e executar

Pré-requisito: Node.js instalado.

```bash
npm install
npm run dev
```

O terminal mostrará um endereço local (algo como `http://localhost:5173`). Basta abrir esse endereço no navegador.

Para gerar uma build estática (opcional):

```bash
npm run build
npm run preview
```

## 5. Estrutura do projeto

```
ordenacao-paralela-js/
├── index.html
├── package.json
├── README.md
├── artigo.md
├── style.css
└── src/
    ├── main.js          # controla a interface, dispara e mede as ordenações
    ├── visualizer.js     # desenha e atualiza as barras
    ├── sort.js            # Merge Sort sequencial, merge, validação
    ├── parallelSort.js    # divide o vetor, cria os workers, faz o merge final
    ├── singleWorker.js    # worker que ordena o vetor inteiro (single-thread)
    └── sortWorker.js      # worker que ordena uma parte do vetor (multithread)
```

## 6. O algoritmo Merge Sort

Merge Sort é um algoritmo de ordenação por divisão e conquista:

1. Divide o vetor ao meio recursivamente até sobrarem sub-vetores de tamanho 1 (já "ordenados" por definição);
2. Faz o **merge** (intercalação) de pares de sub-vetores ordenados, produzindo um vetor maior e ordenado;
3. Repete até restar um único vetor ordenado, do tamanho original.

Complexidade: **O(n log n)** em todos os casos, o que o torna um algoritmo estável e previsível — bom candidato para comparação de desempenho.

Neste projeto, o Merge Sort foi implementado manualmente em `src/sort.js` (funções `mergeSort` e `merge`), sem uso de `array.sort()`.

## 7. Versão single-thread

Implementada em `src/singleWorker.js`. Recebe o vetor **inteiro** e executa `mergeSort` do início ao fim dentro de **um único Web Worker**. Essa versão roda em um worker (e não diretamente na thread principal) apenas para não travar a interface durante a medição — mas representa fielmente uma execução com **uma única thread de trabalho**, sem qualquer divisão de tarefas.

## 8. Versão multithread com Web Workers

Implementada em `src/parallelSort.js` + `src/sortWorker.js`. Funciona assim:

1. **Divisão do vetor**: o vetor original é dividido em N partes de tamanho aproximadamente igual (balanceamento de carga), onde N é o número de workers escolhido (2, 4 ou 8).
2. **Distribuição**: cada parte é enviada para um Web Worker diferente, via `postMessage`.
3. **Ordenação paralela**: cada worker ordena sua parte de forma independente, em paralelo, usando o mesmo `mergeSort`.
4. **Coleta**: a thread principal recebe todas as partes já ordenadas.
5. **Merge final**: a thread principal intercala (merge) as partes ordenadas, na ordem correta, até formar o vetor final.
6. **Validação**: o vetor final é verificado para garantir que está corretamente ordenado.

A thread principal do navegador fica responsável apenas pela interface e pela coordenação/merge final — nunca pela ordenação bruta de uma parte inteira sozinha.

## 9. Divisão do vetor e balanceamento de carga

O vetor é dividido em partes de tamanho `Math.ceil(tamanho / numWorkers)`, de modo que todos os workers recebam uma carga de trabalho semelhante. Cada parte carrega também seu `offset` (posição de início no vetor original), usado tanto para reconstruir o vetor na ordem certa quanto para atualizar a área correta da visualização.

## 10. Merge final

Depois que todos os workers terminam, a thread principal recebe as N partes ordenadas e aplica a função `merge` repetidamente entre elas, em ordem, até obter um único vetor ordenado — o mesmo `merge` usado internamente pelo Merge Sort.

## 11. Comparação justa

Para garantir que a comparação seja justa, um único vetor original é gerado e duas cópias independentes são criadas:

```js
const vetorOriginal = gerarVetorAleatorio(tamanho);
const vetorSingle = [...vetorOriginal];
const vetorMulti = [...vetorOriginal];
```

Ambas as versões ordenam exatamente os mesmos dados.

## 12. Métricas medidas

- Tempo da versão single-thread (ms), medido com `performance.now()`;
- Tempo da versão multithread (ms), medido com `performance.now()`;
- Quantidade de workers usados;
- Tamanho do vetor;
- **Speed-up** = tempoSingleThread / tempoMultithread;
- **Eficiência** = speedUp / quantidadeDeWorkers (também exibida em %);
- Se o vetor single-thread ficou corretamente ordenado;
- Se o vetor multithread ficou corretamente ordenado.

O tempo medido inclui **todo** o processo da versão multithread: divisão do vetor, criação e execução dos workers, e merge final — não apenas a ordenação bruta.

## 13. Modo visual vs modo benchmark

A aplicação alterna automaticamente entre dois modos, com base no tamanho do vetor:

- **Modo visual** (até 500 elementos): as barras são desenhadas e animadas a cada passo de merge, para facilitar a apresentação e o entendimento do algoritmo.
- **Modo benchmark** (acima de 500 elementos, ex.: 10.000 a 1.000.000): as barras não são animadas passo a passo — a aplicação foca exclusivamente na medição correta e não distorcida do tempo de execução.

## 14. Exemplo de tabela de resultados

| Tamanho do vetor | Workers | Tempo single-thread | Tempo multithread | Speed-up | Eficiência | Correto? |
|---|---|---|---|---|---|---|
| 10.000 | 2 | 18,40 ms | 12,10 ms | 1,52x | 76,0% | Sim |
| 100.000 | 4 | 210,30 ms | 78,60 ms | 2,68x | 67,0% | Sim |
| 1.000.000 | 8 | 2480,00 ms | 520,00 ms | 4,77x | 59,6% | Sim |

*(Valores meramente ilustrativos — os resultados reais dependem do hardware utilizado)*

## 15. Análise dos resultados

De forma geral, espera-se que:

- Em vetores pequenos, o ganho da versão multithread seja pequeno ou até negativo, porque o custo de criar workers, copiar dados entre threads (`postMessage`) e fazer o merge final pode superar o tempo economizado na ordenação em si.
- Em vetores grandes, a versão multithread tende a apresentar speed-up cada vez maior, pois o custo fixo de criação dos workers se torna proporcionalmente menor frente ao ganho de paralelizar a ordenação.
- A eficiência tende a diminuir à medida que se aumenta o número de workers, pois o merge final (feito sequencialmente na thread principal) e o overhead de comunicação não são paralelizáveis — um efeito relacionado à Lei de Amdahl.

## 16. Conclusão

A paralelização com Web Workers traz ganhos reais de desempenho para vetores grandes, mas não é vantajosa (ou pode até ser prejudicial) para vetores pequenos, devido ao overhead de criação de threads e comunicação entre elas. O ponto de equilíbrio (onde a versão multithread passa a compensar) depende do hardware e deve ser observado experimentalmente na aplicação.

## 19. Referências bibliográficas

- CORMEN, T. H. et al. *Introduction to Algorithms*. 3rd ed. MIT Press, 2009. (Capítulo sobre Merge Sort)
- MDN Web Docs. *Web Workers API*. Disponível em: https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Workers_API
- MDN Web Docs. *Window: performance.now() method*. Disponível em: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
- HENNESSY, J. L.; PATTERSON, D. A. *Computer Architecture: A Quantitative Approach*. (Lei de Amdahl, speed-up e eficiência)
- Vite. *Documentação oficial*. Disponível em: https://vitejs.dev

