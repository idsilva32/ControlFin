// --- DADOS EM MEMÓRIA ---
let registros = [];
let editingIndex = -1; // -1 significa que não estamos editando

// --- SELETORES DE ELEMENTOS ---
const exportButton = document.getElementById('export-json-btn');
const importInput = document.getElementById('importFile');
const tabelaBody = document.querySelector('#financial-table tbody');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const clearSearchButton = document.getElementById('clear-search-button');
const addRecordBtn = document.getElementById('add-record-btn');

// Inputs da nova linha de adição
const newNdInput = document.getElementById('new-nd');
const newOrigemSelect = document.getElementById('new-origem');
const newDiaInput = document.getElementById('new-dia');
const newDescricaoInput = document.getElementById('new-descricao');
const newFormaPagamentoSelect = document.getElementById('new-formaPagamento');
const newMostrarSelect = document.getElementById('new-mostrar');
const newInstalacaoInput = document.getElementById('new-instalacao');
const newComplementoInput = document.getElementById('new-complemento');
const newObservacaoInput = document.getElementById('new-observacao');
const newDataUltimoPagamentoInput = document.getElementById('new-dataUltimoPagamento');
const newSiteInput = document.getElementById('new-site');
const newPagoSelect = document.getElementById('new-pago');

// --- FUNÇÕES PRINCIPAIS ---

// Salva os dados no localStorage
function salvarNoCache() {
    localStorage.setItem('dadosFinanceiros', JSON.stringify(registros));
}

// Carrega os dados do localStorage
function carregarDoCache() {
    const dadosSalvos = localStorage.getItem('dadosFinanceiros');
    if (dadosSalvos) {
        registros = JSON.parse(dadosSalvos);
    }
    // Ordena os registros por ND de forma decrescente
    registros.sort((a, b) => b.ND - a.ND);
    renderizarTabela(registros);
}

// Renderiza a tabela com os dados do array fornecido
function renderizarTabela(dados) {
    tabelaBody.innerHTML = '';
    dados.forEach((registro, index) => {
        const linha = document.createElement('tr');
        // Encontra o índice original no array 'registros'
        const originalIndex = registros.findIndex(item => JSON.stringify(item) === JSON.stringify(registro));
        
        // Formata o campo "Site" com o ícone de lupa à esquerda
        const siteContent = registro.Site ? `<a href="${registro.Site}" target="_blank" class="site-link">🔍</a> ${registro.Site}` : '';

        linha.innerHTML = `
            <td>
                <div class="actions-buttons">
                    <button class="btn btn-success" onclick="editarRegistro(${originalIndex})">Editar</button>
                    <button class="btn btn-danger" onclick="excluirRegistro(${originalIndex})">Excluir</button>
                </div>
            </td>
            <td>${registro.ND || ''}</td>
            <td>${registro.Origem || ''}</td>
            <td>${registro.Dia || ''}</td>
            <td>${registro.Descrição || ''}</td>
            <td>${registro.Forma_Pagamento || ''}</td>
            <td>${registro.Mostrar || ''}</td>
            <td>${registro.Instalacao || ''}</td>
            <td>${registro.Complemento || ''}</td>
            <td>${registro.Observação || ''}</td>
            <td>${registro.Data_Ultimo_Pagamento || ''}</td>
            <td>${siteContent}</td>
            <td>${registro.Pago || ''}</td>
        `;
        tabelaBody.appendChild(linha);
    });
}

// Adiciona um novo registro a partir dos inputs do cabeçalho
function adicionarNovoRegistro() {
    const descricao = newDescricaoInput.value.trim();
    if (!descricao) {
        alert('A descrição é obrigatória!');
        return;
    }

    // Calcula o novo ND
    const novoND = registros.length > 0 ? (Math.max(...registros.map(r => r.ND || 0)) + 1) : 1;
    
    const novoRegistro = {
        ND: novoND,
        Origem: newOrigemSelect.value,
        Dia: newDiaInput.value,
        Descrição: descricao,
        Forma_Pagamento: newFormaPagamentoSelect.value,
        Mostrar: newMostrarSelect.value,
        Instalacao: newInstalacaoInput.value,
        Complemento: newComplementoInput.value,
        Observação: newObservacaoInput.value,
        Data_Ultimo_Pagamento: newDataUltimoPagamentoInput.value,
        Site: newSiteInput.value,
        Pago: newPagoSelect.value,
    };

    registros.push(novoRegistro);
    salvarNoCache();
    // Ordena os registros por ND de forma decrescente após adicionar um novo
    registros.sort((a, b) => b.ND - a.ND);
    renderizarTabela(registros);
    
    // Limpa os campos de entrada, exceto o ND que será gerado automaticamente
    newNdInput.value = '';
    newOrigemSelect.value = '';
    newDiaInput.value = '';
    newDescricaoInput.value = '';
    newFormaPagamentoSelect.value = '';
    newMostrarSelect.value = 'sim';
    newInstalacaoInput.value = '';
    newComplementoInput.value = '';
    newObservacaoInput.value = '';
    newDataUltimoPagamentoInput.value = '';
    newSiteInput.value = '';
    newPagoSelect.value = 'nao-pago';

    alert('Lançamento adicionado com sucesso!');
}

// Torna a linha da tabela editável
function editarRegistro(index) {
    const linha = tabelaBody.children[index];
    const registro = registros[index];

    // Transforma as células em inputs
    linha.innerHTML = `
        <td class="action-cell">
            <div class="actions-buttons">
                <button class="btn btn-success" onclick="salvarEdicao(${index})">Salvar</button>
                <button class="btn btn-danger" onclick="cancelarEdicao(${index})">Cancelar</button>
            </div>
        </td>
        <td class="input-cell"><input type="text" value="${registro.ND || ''}" disabled></td>
        <td class="input-cell">
            <select>
                <option value="${registro.Origem || ''}">${registro.Origem || ''}</option>
                <option value="CASA SP">CASA SP</option>
                <option value="EDUCACAO">EDUCACAO</option>
                <option value="CARTÃO DE CRED">CARTÃO DE CRED</option>
                <option value="CASA PRAIA">CASA PRAIA</option>
                <option value="B13-AP26">B13-AP26</option>
                <option value="CARRO">CARRO</option>
                <option value="COMERCIAL ILHA">COMERCIAL ILHA</option>
                <option value="540-GRANDE">540-GRANDE</option>
                <option value="B15-AP35">B15-AP35</option>
                <option value="EMPRESTIMO CINTIA">EMPRESTIMO CINTIA</option>
                <option value="EMPRESA">EMPRESA</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="DIVERSOS">DIVERSOS</option>
                <option value="SALDO MÊS ANTERIOR">SALDO MÊS ANTERIOR</option>
                <option value="OUTROS">OUTROS</option>
                <option value="PROMOTORA">PROMOTORA</option>
                <option value="GAGO">GAGO</option>
            </select>
        </td>
        <td class="input-cell"><input type="number" value="${registro.Dia || ''}"></td>
        <td class="input-cell"><input type="text" value="${registro.Descrição || ''}" required></td>
        <td class="input-cell">
            <select>
                <option value="${registro.Forma_Pagamento || ''}">${registro.Forma_Pagamento || ''}</option>
                <option value="cartao-credito">Cartão de Crédito</option>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="debito-automatico">Débito Automático</option>
            </select>
        </td>
        <td class="input-cell">
            <select>
                <option value="${registro.Mostrar || ''}">${registro.Mostrar || ''}</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
            </select>
        </td>
        <td class="input-cell"><input type="text" value="${registro.Instalacao || ''}"></td>
        <td class="input-cell"><input type="text" value="${registro.Complemento || ''}"></td>
        <td class="input-cell"><input type="text" value="${registro.Observação || ''}"></td>
        <td class="input-cell"><input type="date" value="${registro.Data_Ultimo_Pagamento || ''}"></td>
        <td class="input-cell"><input type="text" value="${registro.Site || ''}"></td>
        <td class="input-cell">
            <select>
                <option value="${registro.Pago || ''}">${registro.Pago || ''}</option>
                <option value="nao-pago">Não Pago</option>
                <option value="pago">Pago</option>
            </select>
        </td>
    `;
}

// Salva as edições feitas na linha da tabela
function salvarEdicao(index) {
    const linha = tabelaBody.children[index];
    const inputs = linha.querySelectorAll('input, select');

    const registroAtualizado = {
        ND: inputs[0].value,
        Origem: inputs[1].value,
        Dia: inputs[2].value,
        Descrição: inputs[3].value,
        Forma_Pagamento: inputs[4].value,
        Mostrar: inputs[5].value,
        Instalacao: inputs[6].value,
        Complemento: inputs[7].value,
        Observacao: inputs[8].value,
        Data_Ultimo_Pagamento: inputs[9].value,
        Site: inputs[10].value,
        Pago: inputs[11].value,
    };

    if (!registroAtualizado.Descrição.trim()) {
        alert('A descrição é obrigatória!');
        return;
    }

    // Atualiza o registro no array original
    registros[index] = { ...registros[index], ...registroAtualizado };
    salvarNoCache();
    // Ordena os registros por ND de forma decrescente após salvar
    registros.sort((a, b) => b.ND - a.ND);
    renderizarTabela(registros);
    alert('Lançamento atualizado com sucesso!');
}

// Cancela a edição e reverte a linha ao estado original
function cancelarEdicao(index) {
    renderizarTabela(registros);
}

// Remove um registro do array
function excluirRegistro(index) {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
        registros.splice(index, 1);
        renderizarTabela(registros);
        salvarNoCache();
    }
}

// Converte o array de objetos para o formato JSON e baixa o arquivo
function exportarJSON() {
    const jsonContent = JSON.stringify(registros, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "dados_financeiros.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Arquivo JSON exportado com sucesso!');
}

// Carrega dados de um arquivo JSON
function importarJSON(evento) {
    const arquivo = evento.target.files[0];
    if (arquivo) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
            try {
                const conteudo = e.target.result;
                registros = JSON.parse(conteudo);
                salvarNoCache();
                // Ordena os registros por ND de forma decrescente após importar
                registros.sort((a, b) => b.ND - a.ND);
                renderizarTabela(registros);
                alert(`Dados do arquivo "${arquivo.name}" importados com sucesso!`);
            } catch (e) {
                alert('Erro ao ler o arquivo. Por favor, verifique se é um arquivo JSON válido.');
                console.error(e);
            }
        };
        leitor.readAsText(arquivo, 'UTF-8');
    }
}

// Filtra os registros com base no texto de pesquisa
function filtrarRegistros() {
    const termo = searchInput.value.toLowerCase();
    const resultados = registros.filter(registro => {
        const descricao = registro.Descrição ? registro.Descrição.toLowerCase() : '';
        const origem = registro.Origem ? registro.Origem.toLowerCase() : '';
        return descricao.includes(termo) || origem.includes(termo);
    });
    renderizarTabela(resultados);
}

// Limpa a pesquisa e exibe todos os registros novamente
function limparPesquisa() {
    searchInput.value = '';
    renderizarTabela(registros);
}

// --- EVENT LISTENERS ---
addRecordBtn.addEventListener('click', adicionarNovoRegistro);
exportButton.addEventListener('click', exportarJSON);
importInput.addEventListener('change', importarJSON);
searchButton.addEventListener('click', filtrarRegistros);
clearSearchButton.addEventListener('click', limparPesquisa);

// Inicia a aplicação: Carrega os dados salvos quando a página é carregada
document.addEventListener('DOMContentLoaded', carregarDoCache);

// Seleciona o botão e o menu
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

// Adiciona o evento de clique
menuToggle.addEventListener('click', () => {
    // Alterna a classe 'active' para abrir e fechar o menu
    mainNav.classList.toggle('active');
    menuToggle.classList.toggle('active');
});

// Outras funções do seu código...
// (Ex: renderizarTabela, adicionarNovoRegistro, etc.)