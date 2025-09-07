// --- VARIÁVEIS GLOBAIS ---
let dadosRelatorioOriginal = {};

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
    // 1. Carregar dados dos lançamentos do localStorage
    const lancamentosSalvos = localStorage.getItem('lancamentosDetalhe');
    const lancamentos = lancamentosSalvos ? JSON.parse(lancamentosSalvos) : [];

    // 2. Carregar dados do arquivo JSON externo
    let dadosFinanceiros = [];
    try {
        const response = await fetch('dados_financeiros.json');
        if (response.ok) {
            dadosFinanceiros = await response.json();
        } else {
            console.error('Erro ao carregar dados_financeiros.json:', response.statusText);
        }
    } catch (e) {
        console.error('Erro de rede ou ao analisar JSON:', e);
    }
    
    return { lancamentos, dadosFinanceiros };
}

function processarRelatorio(lancamentos, dadosFinanceiros) {
    const dadosPorND = {};

    // Mapeia os dados financeiros para acesso rápido pelo ND
    const mapaDados = {};
    dadosFinanceiros.forEach(item => {
        mapaDados[item.ND] = item;
    });

    // Agrupa e calcula a soma dos valores por ND e Mês/Ano
    lancamentos.forEach(lancamento => {
        const nd = lancamento.ND;
        const valor = parseFloat(lancamento.Valor);
        const mesAno = lancamento.Dt_Vcto ? `${lancamento.Dt_Vcto.substring(5, 7)}/${lancamento.Dt_Vcto.substring(0, 4)}` : 'Sem Data';

        if (isNaN(valor) || lancamento.SOMA === 'Nao') return;

        if (!dadosPorND[nd]) {
            dadosPorND[nd] = {
                ...mapaDados[nd],
                somaPorMesAno: {}
            };
        }

        if (!dadosPorND[nd].somaPorMesAno[mesAno]) {
            dadosPorND[nd].somaPorMesAno[mesAno] = 0;
        }

        dadosPorND[nd].somaPorMesAno[mesAno] += valor;
    });

    return dadosPorND;
}

function renderizarRelatorio(dadosAgrupados) {
    const tabelaBody = document.querySelector('#relatorio-table tbody');
    const tabelaHead = document.querySelector('#relatorio-table thead tr');
    const nds = Object.keys(dadosAgrupados).sort();
    
    const mesesAnos = new Set();
    Object.values(dadosAgrupados).forEach(ndData => {
        Object.keys(ndData.somaPorMesAno).forEach(mesAno => mesesAnos.add(mesAno));
    });

    // Ordena os meses e anos de forma decrescente
    const mesesAnosOrdenados = Array.from(mesesAnos).sort((a, b) => {
        const [mesA, anoA] = a.split('/').map(Number);
        const [mesB, anoB] = b.split('/').map(Number);
        if (anoA !== anoB) {
            return anoB - anoA;
        }
        return mesB - mesA;
    });

    // Adiciona as colunas dinâmicas para cada Mês/Ano
    tabelaHead.innerHTML = `
        <th>ND</th>
        <th>Descrição</th>
        <th>Instalação</th>
        <th>Origem</th>
        <th>Dia</th>
        <th>Pago</th>
        ${mesesAnosOrdenados.map(mesAno => `<th>Total ${mesAno}</th>`).join('')}
    `;

    tabelaBody.innerHTML = '';
    nds.forEach(nd => {
        const ndData = dadosAgrupados[nd];
        const linha = document.createElement('tr');
        
        let valoresMensaisHTML = '';
        mesesAnosOrdenados.forEach(mesAno => {
            const valor = ndData.somaPorMesAno[mesAno] || 0;
            valoresMensaisHTML += `<td>${formatarValorBRL(valor)}</td>`;
        });

        linha.innerHTML = `
            <td onclick="abrirLancamentosPorND(${nd})" style="cursor: pointer; font-weight: bold; text-decoration: underline;">${nd}</td>
            <td>${ndData.Descrição || ''}</td>
            <td>${ndData.Instalacao || ''}</td>
            <td>${ndData.Origem || ''}</td>
            <td>${ndData.Dia || ''}</td>
            <td>${ndData.Pago || ''}</td>
            ${valoresMensaisHTML}
        `;
        tabelaBody.appendChild(linha);
    });
}

function filtrarRelatorio() {
    const searchInput = document.getElementById('search-input');
    const termo = searchInput.value.toLowerCase();
    
    if (!termo) {
        renderizarRelatorio(dadosRelatorioOriginal);
        return;
    }

    const dadosFiltrados = {};
    const nds = Object.keys(dadosRelatorioOriginal);
    nds.forEach(nd => {
        const item = dadosRelatorioOriginal[nd];
        const descricao = item.Descrição ? item.Descrição.toLowerCase() : '';
        const origem = item.Origem ? item.Origem.toLowerCase() : '';

        if (descricao.includes(termo) || origem.includes(termo)) {
            dadosFiltrados[nd] = item;
        }
    });
    
    if (Object.keys(dadosFiltrados).length > 0) {
        renderizarRelatorio(dadosFiltrados);
    } else {
        const tabelaBody = document.querySelector('#relatorio-table tbody');
        tabelaBody.innerHTML = '<tr><td colspan="9">Nenhum resultado encontrado.</td></tr>';
    }
}

function limparPesquisa() {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    renderizarRelatorio(dadosRelatorioOriginal);
}

// Esta função deve ser global para que possa ser chamada pelo HTML
function abrirLancamentosPorND(nd) {
    localStorage.setItem('filtroND', nd);
    window.location.href = 'lancamentos_detalhe.html';
}

// --- INICIALIZAÇÃO E EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', async () => {
    // Carrega e processa os dados ao carregar a página
    const { lancamentos, dadosFinanceiros } = await carregarDados();
    dadosRelatorioOriginal = processarRelatorio(lancamentos, dadosFinanceiros);
    renderizarRelatorio(dadosRelatorioOriginal);

    // Adiciona os eventos de clique APÓS a página ter sido completamente carregada
    const searchButton = document.getElementById('search-button');
    const clearSearchButton = document.getElementById('clear-search-button');

    if (searchButton && clearSearchButton) {
        searchButton.addEventListener('click', filtrarRelatorio);
        clearSearchButton.addEventListener('click', limparPesquisa);
    }
});