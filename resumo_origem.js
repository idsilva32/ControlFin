// --- SELETORES DE ELEMENTOS ---
const tabelaBody = document.querySelector('#relatorio-table tbody');
const tabelaHead = document.querySelector('#relatorio-table thead tr');

// Seletores para o novo resumo por tipo
const totalDespesasElem = document.getElementById('total-despesas');
const totalReceitasElem = document.getElementById('total-receitas');
const saldoFinalElem = document.getElementById('saldo-final');

// Variável global para armazenar os dados do relatório
let dadosRelatorio = {};

// --- FUNÇÕES AUXILIARES ---

function formatarValorBRL(valor) {
    if (typeof valor !== 'number') return valor;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// --- FUNÇÕES PRINCIPAIS ---

async function carregarDados() {
    const lancamentosSalvos = localStorage.getItem('lancamentosDetalhe');
    const lancamentos = lancamentosSalvos ? JSON.parse(lancamentosSalvos) : [];
    
    let dadosFinanceiros = [];
    try {
        const response = await fetch('dados_financeiros.json');
        if (response.ok) {
            dadosFinanceiros = await response.json();
        }
    } catch (e) {
        console.error('Erro ao carregar dados_financeiros.json:', e);
    }
    
    return { lancamentos, dadosFinanceiros };
}

function processarRelatorio(lancamentos, dadosFinanceiros) {
    const dadosPorOrigem = {};

    const mapaDados = {};
    dadosFinanceiros.forEach(item => {
        mapaDados[item.Origem] = item;
    });

    lancamentos.forEach(lancamento => {
        const nd = lancamento.ND;
        const valor = parseFloat(lancamento.Valor);
        const mesAno = lancamento.Dt_Vcto ? `${lancamento.Dt_Vcto.substring(5, 7)}/${lancamento.Dt_Vcto.substring(0, 4)}` : 'Sem Data';

        if (isNaN(valor) || lancamento.SOMA === 'Nao') return;

        const dadosND = dadosFinanceiros.find(d => d.ND === nd);
        if (!dadosND || !dadosND.Origem) return;

        const origem = dadosND.Origem;

        if (!dadosPorOrigem[origem]) {
            dadosPorOrigem[origem] = {
                somaPorMesAno: {}
            };
        }

        if (!dadosPorOrigem[origem].somaPorMesAno[mesAno]) {
            dadosPorOrigem[origem].somaPorMesAno[mesAno] = 0;
        }

        dadosPorOrigem[origem].somaPorMesAno[mesAno] += valor;
    });

    return dadosPorOrigem;
}

function calcularResumoPorTipo(lancamentos) {
    let totalDespesas = 0;
    let totalReceitas = 0;

    lancamentos.forEach(lancamento => {
        const valor = parseFloat(lancamento.Valor);
        if (isNaN(valor) || lancamento.SOMA === 'Nao') return;

        // Assumimos que valores positivos são Despesas e negativos são Receitas
        if (valor > 0) {
            totalDespesas += valor;
        } else if (valor < 0) {
            totalReceitas += valor;
        }
    });

    const saldoFinal = totalDespesas + totalReceitas;

    // Exibe os valores no HTML
    if (totalDespesasElem) totalDespesasElem.textContent = formatarValorBRL(totalDespesas);
    if (totalReceitasElem) totalReceitasElem.textContent = formatarValorBRL(totalReceitas);
    if (saldoFinalElem) {
      saldoFinalElem.textContent = formatarValorBRL(saldoFinal);
      saldoFinalElem.style.color = saldoFinal >= 0 ? '#28a745' : '#dc3545';
    }
}

function renderizarRelatorio(dadosAgrupados) {
    const origens = Object.keys(dadosAgrupados).sort();
    
    const mesesAnos = new Set();
    Object.values(dadosAgrupados).forEach(origemData => {
        Object.keys(origemData.somaPorMesAno).forEach(mesAno => mesesAnos.add(mesAno));
    });

    const mesesAnosOrdenados = Array.from(mesesAnos).sort((a, b) => {
        const [mesA, anoA] = a.split('/').map(Number);
        const [mesB, anoB] = b.split('/').map(Number);
        if (anoA !== anoB) {
            return anoB - anoA;
        }
        return mesB - mesA;
    });

    const tabelaHead = document.querySelector('#relatorio-table thead tr');
    const tabelaBody = document.querySelector('#relatorio-table tbody');

    tabelaHead.innerHTML = `
        <th>Origem</th>
        ${mesesAnosOrdenados.map(mesAno => `<th>Total ${mesAno}</th>`).join('')}
    `;

    tabelaBody.innerHTML = '';
    origens.forEach(origem => {
        const origemData = dadosAgrupados[origem];
        const linha = document.createElement('tr');
        
        let valoresMensaisHTML = '';
        mesesAnosOrdenados.forEach(mesAno => {
            const valor = origemData.somaPorMesAno[mesAno] || 0;
            valoresMensaisHTML += `<td>${formatarValorBRL(valor)}</td>`;
        });

        linha.innerHTML = `
            <td>${origem || ''}</td>
            ${valoresMensaisHTML}
        `;
        tabelaBody.appendChild(linha);
    });
}

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', async () => {
    const { lancamentos, dadosFinanceiros } = await carregarDados();
    
    // Calcula e renderiza o resumo por tipo ANTES da tabela
    calcularResumoPorTipo(lancamentos);
    
    dadosRelatorio = processarRelatorio(lancamentos, dadosFinanceiros);
    renderizarRelatorio(dadosRelatorio);
});