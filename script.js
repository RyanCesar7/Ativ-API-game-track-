const API_URL = "http://localhost:3000/jogos";

const listaJogos = document.getElementById("listaJogos");
const pesquisa = document.getElementById("pesquisa");
const filtroStatus = document.getElementById("filtroStatus");
const formJogo = document.getElementById("formJogo");
const idJogo = document.getElementById("idJogo");
const titulo = document.getElementById("titulo");
const genero = document.getElementById("genero");
const plataforma = document.getElementById("plataforma");
const nota = document.getElementById("nota");
const status = document.getElementById("status");
const tituloFormulario = document.getElementById("tituloFormulario");
const botaoSalvar = document.getElementById("botaoSalvar");
const botaoCancelar = document.getElementById("botaoCancelar");
const mensagem = document.getElementById("mensagem");

const totalJogos = document.getElementById("totalJogos");
const totalJogando = document.getElementById("totalJogando");
const totalFinalizados = document.getElementById("totalFinalizados");
const mediaNotas = document.getElementById("mediaNotas");

let jogos = [];

function mostrarMensagem(texto, tipo = "sucesso") {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;

    setTimeout(() => {
        mensagem.textContent = "";
        mensagem.className = "mensagem";
    }, 3500);
}

async function carregarJogos() {
    try {
        const resposta = await fetch(API_URL);

        if (!resposta.ok) {
            throw new Error("Não foi possível acessar a API.");
        }

        jogos = await resposta.json();

        atualizarDashboard();
        aplicarFiltros();
    } catch (erro) {
        console.error("Erro:", erro);
        listaJogos.innerHTML = `
            <div class="vazio">
                Não foi possível conectar com a API. Verifique se o JSON Server está ligado.
            </div>
        `;
        atualizarDashboard();
        mostrarMensagem("Não foi possível conectar com a API.", "erro");
    }
}

function atualizarDashboard() {
    totalJogos.textContent = jogos.length;
    totalJogando.textContent = jogos.filter(jogo => jogo.status === "Jogando").length;
    totalFinalizados.textContent = jogos.filter(jogo => jogo.status === "Finalizado").length;

    if (jogos.length === 0) {
        mediaNotas.textContent = "0";
    } else {
        const soma = jogos.reduce((total, jogo) => total + Number(jogo.nota), 0);
        mediaNotas.textContent = (soma / jogos.length).toFixed(1);
    }
}

function aplicarFiltros() {
    const texto = pesquisa.value.toLowerCase().trim();
    const filtro = filtroStatus.value;

    const jogosFiltrados = jogos.filter(jogo => {
        const correspondeTitulo = jogo.titulo.toLowerCase().includes(texto);
        const correspondeStatus = filtro === "Todos" || jogo.status === filtro;

        return correspondeTitulo && correspondeStatus;
    });

    renderizarJogos(jogosFiltrados);
}

function renderizarJogos(jogosParaMostrar) {
    listaJogos.innerHTML = "";

    if (jogosParaMostrar.length === 0) {
        listaJogos.innerHTML = `
            <div class="vazio">
                Nenhum jogo encontrado.
            </div>
        `;
        return;
    }

    jogosParaMostrar.forEach(jogo => {
        const card = document.createElement("article");
        card.className = "card";

        card.innerHTML = `
            <h3>${jogo.titulo}</h3>
            <p>${jogo.genero} • ${jogo.plataforma}</p>
            <p class="nota">Nota: ${jogo.nota}</p>
            <span class="status">${jogo.status}</span>
            <div class="acoes">
                <button onclick="editarJogo('${jogo.id}')">Editar</button>
                <button class="excluir" onclick="excluirJogo('${jogo.id}')">Excluir</button>
            </div>
        `;

        listaJogos.appendChild(card);
    });
}

formJogo.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const dados = {
        titulo: titulo.value.trim(),
        genero: genero.value.trim(),
        plataforma: plataforma.value.trim(),
        nota: Number(nota.value),
        status: status.value
    };

    if (!dados.titulo || !dados.genero || !dados.plataforma) {
        mostrarMensagem("Preencha título, gênero e plataforma.", "erro");
        return;
    }

    if (dados.nota < 0 || dados.nota > 10 || nota.value === "") {
        mostrarMensagem("A nota precisa estar entre 0 e 10.", "erro");
        return;
    }

    const statusPermitidos = ["Quero jogar", "Jogando", "Finalizado", "Abandonado"];

    if (!statusPermitidos.includes(dados.status)) {
        mostrarMensagem("Selecione um status válido.", "erro");
        return;
    }

    try {
        let resposta;

        if (idJogo.value) {
            resposta = await fetch(`${API_URL}/${idJogo.value}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: idJogo.value,
                    ...dados
                })
            });
        } else {
            resposta = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            });
        }

        if (!resposta.ok) {
            throw new Error("Erro ao salvar jogo.");
        }

        limparFormulario();
        await carregarJogos();

        mostrarMensagem(
            idJogo.value ? "Jogo atualizado com sucesso!" : "Jogo cadastrado com sucesso!"
        );
    } catch (erro) {
        console.error("Erro:", erro);
        mostrarMensagem("Não foi possível salvar o jogo.", "erro");
    }
});

async function editarJogo(id) {
    try {
        const resposta = await fetch(`${API_URL}/${id}`);

        if (!resposta.ok) {
            throw new Error("Jogo não encontrado.");
        }

        const jogo = await resposta.json();

        idJogo.value = jogo.id;
        titulo.value = jogo.titulo;
        genero.value = jogo.genero;
        plataforma.value = jogo.plataforma;
        nota.value = jogo.nota;
        status.value = jogo.status;

        tituloFormulario.textContent = "Editar jogo";
        botaoSalvar.textContent = "Salvar alteração";

        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (erro) {
        console.error("Erro:", erro);
        mostrarMensagem("Não foi possível carregar o jogo.", "erro");
    }
}

async function excluirJogo(id) {
    const confirmar = confirm("Tem certeza que deseja excluir este jogo?");

    if (!confirmar) {
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!resposta.ok) {
            throw new Error("Erro ao excluir jogo.");
        }

        await carregarJogos();
        mostrarMensagem("Jogo excluído com sucesso!");
    } catch (erro) {
        console.error("Erro:", erro);
        mostrarMensagem("Não foi possível excluir o jogo.", "erro");
    }
}

function limparFormulario() {
    formJogo.reset();
    idJogo.value = "";
    tituloFormulario.textContent = "Cadastrar jogo";
    botaoSalvar.textContent = "Cadastrar";
}

botaoCancelar.addEventListener("click", limparFormulario);
pesquisa.addEventListener("input", aplicarFiltros);
filtroStatus.addEventListener("change", aplicarFiltros);

carregarJogos();
