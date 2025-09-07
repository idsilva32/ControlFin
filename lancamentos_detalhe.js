// --- DADOS EM MEMÓRIA ---
let lancamentos = [];
let editingIndex = -1;

// --- OPÇÕES DOS SELECTS ---
const opcoesTipo = ['Despesa', 'Receita'];
const opcoesLocalPgto = ['Inter', 'XP', 'Nubank', 'Débito Automático Nubank'];
const opcoesSoma = ['Sim', 'Nao'];

// --- SELETORES DE ELEMENTOS ---
const exportButton = document.getElementById('export-json-btn');
const importInput = document.getElementById('importFile');
const tabelaBody = document.querySelector('#financial-table tbody');
const tabelaHead = document.querySelector('#financial-table thead');

// --- FUNÇÕES AUXILIARES ---

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatarValorBRL(valor) {
    if (typeof valor !== 'number') return valor;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function criarSelectHTML(id, opcoes, valorSelecionado) {
    let selectHTML = `<select id="${id}">`;
    opcoes.forEach(opcao => {
        const selected = (valorSelecionado === opcao) ? 'selected' : '';
        selectHTML += `<option value="${opcao}" ${selected}>${opcao}</option>`;
    });
    selectHTML += `</select>`;
    return selectHTML;
}

// --- FUNÇÕES PRINCIPAIS ---

function salvarNoCache() {
    localStorage.setItem('lancamentosDetalhe', JSON.stringify(lancamentos));
}

function carregarDoCache() {
    const dadosSalvos = localStorage.getItem('lancamentosDetalhe');
    if (dadosSalvos) {
        lancamentos = JSON.parse(dadosSalvos);
    }
    
    // VERIFICA SE EXISTE UM FILTRO DE ND NO LOCALSTORAGE
    const ndFiltro = localStorage.getItem('filtroND');
    if (ndFiltro) {
        const nd = parseInt(ndFiltro, 10);
        const resultados = lancamentos.filter(lancamento => lancamento.ND == nd);
        renderizarTabela(resultados);
        document.getElementById('search-input').value = nd; // Preenche o campo de busca
        localStorage.removeItem('filtroND'); // Remove o filtro do cache após o uso
    } else {
        renderizarTabela();
    }
}

function renderizarTabela(dadosParaExibir = lancamentos) {
    tabelaBody.innerHTML = '';
    
    const today = getTodayDate();

    tabelaHead.innerHTML = `

        <tr class="add-row">
            <th class="input-cell action-cell"><button id="add-record-btn" class="btn btn-success">Adicionar</button></th>
            <th class="input-cell">${criarSelectHTML('new-tipo', opcoesTipo, 'Despesa')}</th>
            <th class="input-cell"><input type="number" id="new-nd" placeholder="ND" required></th>
            <th class="input-cell"><input type="number" id="new-valor" placeholder="Valor" step="0.01" required></th>
            <th class="input-cell"><input type="date" id="new-dtVcto" value="${today}"></th>
            <th class="input-cell"><input type="date" id="new-dtPgto" value="${today}"></th>
            <th class="input-cell">${criarSelectHTML('new-localPgto', opcoesLocalPgto, '')}</th>
            <th class="input-cell">
                <select id="new-soma">
                    <option value="Sim">Sim</option>
                    <option value="Nao">Não</option>
                </select>
            </th>
            <th class="input-cell"><input type="text" id="new-observacao" placeholder="Observação"></th>
        </tr>
        <tr>
            <th>Ações</th>
            <th>Tipo</th>
            <th>ND</th>
            <th>Valor</th>
            <th>Dt. Vcto</th>
            <th>Dt. Pgto</th>
            <th>Local Pgto</th>
            <th>SOMA?</th>
            <th>Observação</th>
        </tr>
    `;

    document.getElementById('add-record-btn').addEventListener('click', adicionarNovoLancamento);
    document.getElementById('search-button').addEventListener('click', filtrarLancamentos);
    document.getElementById('clear-search-button').addEventListener('click', limparPesquisa);
    
    dadosParaExibir.forEach((lancamento, index) => {
        const linha = document.createElement('tr');
        const tipoCellClass = lancamento.Tipo === 'Receita' ? 'receita-cell' : 'despesa-cell';
        linha.innerHTML = `
            <td>
                <div class="actions-buttons">
                    <button class="btn btn-success" onclick="editarLancamento(${index})">Editar</button>
                    <button class="btn btn-danger" onclick="excluirLancamento(${index})">Excluir</button>
                </div>
            </td>
            <td class="${tipoCellClass}">${lancamento.Tipo || ''}</td>
            <td>${lancamento.ND || ''}</td>
            <td>${formatarValorBRL(lancamento.Valor)}</td>
            <td>${lancamento.Dt_Vcto || ''}</td>
            <td>${lancamento.Dt_Pgto || ''}</td>
            <td>${lancamento.Local_Pgto || ''}</td>
            <td>${lancamento.SOMA || ''}</td>
            <td>${lancamento.Observacao || ''}</td>
        `;
        tabelaBody.appendChild(linha);
    });
}

function filtrarLancamentos() {
    const searchInput = document.getElementById('search-input');
    const termo = parseInt(searchInput.value, 10);
    
    if (isNaN(termo)) {
        alert('Por favor, insira um número de ND válido.');
        return;
    }
    
    const resultados = lancamentos.filter(lancamento => lancamento.ND == termo);
    
    if (resultados.length > 0) {
        renderizarTabela(resultados);
    } else {
        alert('Nenhum lançamento encontrado com este ND.');
        limparPesquisa();
    }
}

function limparPesquisa() {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    renderizarTabela();
}

function adicionarNovoLancamento() {
    const newTipoSelect = document.getElementById('new-tipo');
    const newNdInput = document.getElementById('new-nd');
    const newValorInput = document.getElementById('new-valor');
    const newDtVctoInput = document.getElementById('new-dtVcto');
    const newDtPgtoInput = document.getElementById('new-dtPgto');
    const newLocalPgtoSelect = document.getElementById('new-localPgto');
    const newSomaSelect = document.getElementById('new-soma');
    const newObservacaoInput = document.getElementById('new-observacao');

    const nd = newNdInput.value.trim();
    const valor = newValorInput.value.trim();
    if (!nd || !valor) {
        alert('ND e Valor são campos obrigatórios!');
        return;
    }

    const novoLancamento = {
        Tipo: newTipoSelect.value,
        ND: parseInt(nd, 10),
        Valor: parseFloat(valor),
        Dt_Vcto: newDtVctoInput.value,
        Dt_Pgto: newDtPgtoInput.value,
        Local_Pgto: newLocalPgtoSelect.value,
        SOMA: newSomaSelect.value,
        Observacao: newObservacaoInput.value
    };

    lancamentos.push(novoLancamento);
    salvarNoCache();
    renderizarTabela();
    
    // Limpa os campos de entrada
    newNdInput.value = '';
    newValorInput.value = '';
    newDtVctoInput.value = getTodayDate();
    newDtPgtoInput.value = getTodayDate();
    newSomaSelect.value = 'Sim';
    newObservacaoInput.value = '';
    newLocalPgtoSelect.value = '';
    
    alert('Lançamento adicionado com sucesso!');
}

function editarLancamento(index) {
    const linha = tabelaBody.children[index];
    const lancamento = lancamentos[index];
    
    linha.innerHTML = `
        <td class="action-cell">
            <div class="actions-buttons">
                <button class="btn btn-success" onclick="salvarEdicao(${index})">Salvar</button>
                <button class="btn btn-danger" onclick="cancelarEdicao()">Cancelar</button>
            </div>
        </td>
        <td class="input-cell">${criarSelectHTML('edit-tipo', opcoesTipo, lancamento.Tipo)}</td>
        <td class="input-cell"><input type="number" value="${lancamento.ND || ''}" required></td>
        <td class="input-cell"><input type="number" value="${lancamento.Valor || ''}" step="0.01" required></td>
        <td class="input-cell"><input type="date" value="${lancamento.Dt_Vcto || ''}"></td>
        <td class="input-cell"><input type="date" value="${lancamento.Dt_Pgto || ''}"></td>
        <td class="input-cell">${criarSelectHTML('edit-localPgto', opcoesLocalPgto, lancamento.Local_Pgto)}</td>
        <td class="input-cell">
            <select>
                <option value="Sim" ${lancamento.SOMA === 'Sim' ? 'selected' : ''}>Sim</option>
                <option value="Nao" ${lancamento.SOMA === 'Nao' ? 'selected' : ''}>Não</option>
            </select>
        </td>
        <td class="input-cell"><input type="text" value="${lancamento.Observacao || ''}"></td>
    `;
}

function salvarEdicao(index) {
    const linha = tabelaBody.children[index];
    const inputs = linha.querySelectorAll('input, select');
    
    const lancamentoAtualizado = {
        Tipo: inputs[0].value,
        ND: parseInt(inputs[1].value, 10),
        Valor: parseFloat(inputs[2].value),
        Dt_Vcto: inputs[3].value,
        Dt_Pgto: inputs[4].value,
        Local_Pgto: inputs[5].value,
        SOMA: inputs[6].value,
        Observacao: inputs[7].value
    };

    if (!lancamentoAtualizado.ND || !lancamentoAtualizado.Valor) {
        alert('ND e Valor são campos obrigatórios!');
        return;
    }

    lancamentos[index] = { ...lancamentos[index], ...lancamentoAtualizado };
    salvarNoCache();
    renderizarTabela();
    alert('Lançamento atualizado com sucesso!');
}

function cancelarEdicao() {
    renderizarTabela();
}

function excluirLancamento(index) {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
        lancamentos.splice(index, 1);
        salvarNoCache();
        renderizarTabela();
    }
}

function exportarJSON() {
    const jsonContent = JSON.stringify(lancamentos, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "lancamentos_detalhe.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Arquivo JSON exportado com sucesso!');
}

function importarJSON(evento) {
    const arquivo = evento.target.files[0];
    if (arquivo) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
            try {
                const conteudo = e.target.result;
                lancamentos = JSON.parse(conteudo);
                salvarNoCache();
                renderizarTabela();
                alert(`Dados do arquivo "${arquivo.name}" importados com sucesso!`);
            } catch (e) {
                alert('Erro ao ler o arquivo. Por favor, verifique se é um arquivo JSON válido.');
                console.error(e);
            }
        };
        leitor.readAsText(arquivo, 'UTF-8');
    }
}

// --- EVENT LISTENERS ---
exportButton.addEventListener('click', exportarJSON);
importInput.addEventListener('change', importarJSON);

document.addEventListener('DOMContentLoaded', carregarDoCache);