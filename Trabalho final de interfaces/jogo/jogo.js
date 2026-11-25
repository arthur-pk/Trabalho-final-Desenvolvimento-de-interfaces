
// "fraco" = a magia que causa dano DOBRADO num boss deste elemento
const ELEMENTOS = {
  fogo:  { nome: "Fogo",      icone: "🔥", cor: "#ff6b3d", fraco: "agua"  },
  agua:  { nome: "Água",      icone: "💧", cor: "#4aa8ff", fraco: "raio"  },
  terra: { nome: "Terra",     icone: "⛰️", cor: "#b08850", fraco: "agua"  },
  raio:  { nome: "Relâmpago", icone: "⚡", cor: "#ffd84a", fraco: "terra" },
};

const DANO_ESPADA = [13, 18];   
const DANO_MAGIA = 25;
const DANO_ESPECIAL = 90;
const CURA_POCAO = 40;
const DANO_BOSS = [15, 22];
const TURNOS_PARA_TROCAR = 2;   

// Nome vem da tela de login (se não tiver, usa "Herói")
const jogador = {
  nome: sessionStorage.getItem("jogador") || "Herói",
  vida: 120, vidaMax: 120,
  pocoes: 3,
  especial: 0,            // vai de 0 a 100
};

const boss = { nome: "Demonio Imortal", vida: 250, vidaMax: 250, elemento: "fogo" };

let turnosBoss = 0;   // quantos turnos o boss já jogou
let ocupado = false;  // true enquanto uma animação/turno acontece (trava os botões)

   /*
   2. PEGANDO OS ELEMENTOS DO HTML
    */
const cena = document.getElementById("cena");
const spriteJogador = document.getElementById("sprite-jogador");
const spriteBoss = document.getElementById("sprite-boss");
const caixaMensagem = document.getElementById("mensagem");

   /* 
   3. FUNÇÕES AUXILIARES
   */

// Sorteia um número inteiro entre min e max
function sortear([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Espera um tempo (em milissegundos). Usada com "await".
function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Liga uma classe CSS por um tempo (é assim que as animações rodam)
async function animar(elemento, classe, ms) {
  elemento.classList.add(classe);
  await esperar(ms);
  elemento.classList.remove(classe);
}

function mensagem(texto) {
  caixaMensagem.textContent = texto;
}

// Número flutuante de dano ou cura
function mostrarDano(alvo, valor, cura = false) {
  const numero = document.createElement("div");
  numero.className = "numero-dano" + (cura ? " cura" : "");
  numero.textContent = (cura ? "+" : "-") + valor;
  const a = alvo.getBoundingClientRect();
  const c = cena.getBoundingClientRect();
  numero.style.left = a.left - c.left + a.width / 2 + "px";
  numero.style.top = a.top - c.top + "px";
  cena.appendChild(numero);
  setTimeout(() => numero.remove(), 900);
}

   /* 
   4. ATUALIZAR A TELA
   Chamada sempre que um número muda (vida, especial, etc.)
  */
function atualizarTela() {
  const el = ELEMENTOS[boss.elemento];

  document.getElementById("boss-nome").textContent = boss.nome;
  document.getElementById("boss-elemento").textContent = `${el.icone} ${el.nome}`;
  document.getElementById("boss-vida").style.width = (boss.vida / boss.vidaMax) * 100 + "%";
  spriteBoss.style.setProperty("--cor-elemento", el.cor);

  document.getElementById("jogador-nome").textContent = jogador.nome;
  document.getElementById("jogador-vida-texto").textContent = `${jogador.vida}/${jogador.vidaMax}`;
  document.getElementById("jogador-vida").style.width = (jogador.vida / jogador.vidaMax) * 100 + "%";

  document.getElementById("especial-barra").style.width = jogador.especial + "%";
  document.getElementById("especial-texto").textContent = Math.floor(jogador.especial) + "%";
  document.getElementById("btn-especial").disabled = jogador.especial < 100;

  document.getElementById("qtd-pocoes").textContent = jogador.pocoes;
}

   /* 
   5. AÇÕES DO JOGADOR
   Cada ação devolve false se NÃO gastou o turno.
   */

async function danoNoBoss(valor, carregarEspecial = true) {
  boss.vida = Math.max(0, boss.vida - valor);
  if (carregarEspecial) {
    jogador.especial = Math.min(100, jogador.especial + valor); // dano carrega o especial
  }
  mostrarDano(spriteBoss, valor);
  atualizarTela();
  await animar(spriteBoss, "sofrer", 400);
}

async function ataqueEspada() {
  mensagem(`${jogador.nome} ataca com a espada!`);
  await animar(spriteJogador, "avancar-direita", 300);
  await danoNoBoss(sortear(DANO_ESPADA));
}

async function usarMagia(elemento) {
  const magia = ELEMENTOS[elemento];
  let dano = DANO_MAGIA;
  let texto = `${magia.icone} ${jogador.nome} lança ${magia.nome}!`;

  if (ELEMENTOS[boss.elemento].fraco === elemento) {
    dano *= 2;
    texto += " É super efetivo!";
  } else if (boss.elemento === elemento) {
    dano = Math.round(dano / 2);
    texto += " O boss resiste...";
  }

  mensagem(texto);
  await animar(spriteJogador, "avancar-direita", 300);
  await danoNoBoss(dano);
}

async function usarPocao() {
  if (jogador.pocoes <= 0) {
    mensagem("Você não tem mais poções!");
    return false;
  }
  jogador.pocoes--;
  const cura = Math.min(CURA_POCAO, jogador.vidaMax - jogador.vida);
  jogador.vida += cura;
  mensagem(`${jogador.nome} bebe uma poção e recupera ${cura} de vida.`);
  mostrarDano(spriteJogador, cura, true);
  atualizarTela();
  await esperar(700);
}

async function ataqueEspecial() {
  if (jogador.especial < 100) {
    mensagem("O especial ainda não está carregado!");
    return false;
  }
  jogador.especial = 0;
  mensagem(`💥 ${jogador.nome} libera o ATAQUE ESPECIAL!`);
  atualizarTela();
  await animar(spriteJogador, "avancar-direita", 400);
  await danoNoBoss(DANO_ESPECIAL, false); // o especial não carrega o próprio especial
}

   /* 
   6. TURNO DO BOSS
   */
function trocarElemento() {
  const outros = Object.keys(ELEMENTOS).filter((e) => e !== boss.elemento);
  boss.elemento = outros[Math.floor(Math.random() * outros.length)];
  const el = ELEMENTOS[boss.elemento];
  mensagem(`O boss mudou de elemento: ${el.icone} ${el.nome}!`);
  atualizarTela();
}

async function turnoDoBoss() {
  mensagem(`${boss.nome} ataca!`);
  await animar(spriteBoss, "avancar-esquerda", 350);

  const dano = sortear(DANO_BOSS);
  jogador.vida = Math.max(0, jogador.vida - dano);
  mostrarDano(spriteJogador, dano);
  atualizarTela();
  await animar(spriteJogador, "sofrer", 400);

  turnosBoss++;
  if (jogador.vida > 0 && turnosBoss % TURNOS_PARA_TROCAR === 0) {
    await esperar(500);
    trocarElemento();
    await esperar(900);
  }
}

   /* 
   7. CONTROLE DOS TURNOS
   Toda ação do jogador passa por aqui:
   jogador age -> confere vitória -> boss age -> confere derrota
   */
async function jogar(acao) {
  if (ocupado) return;
  ocupado = true;
  fecharSubmenus();

  const resultado = await acao();
  if (resultado === false) {   // ação inválida: não gasta o turno
    ocupado = false;
    return;
  }

  if (boss.vida <= 0) return fimDeJogo(true);

  await esperar(700);
  await turnoDoBoss();

  if (jogador.vida <= 0) return fimDeJogo(false);

  mensagem("Sua vez! Escolha uma ação.");
  ocupado = false;
}

function fimDeJogo(venceu) {
  (venceu ? spriteBoss : spriteJogador).classList.add("morto");
  document.getElementById("fim-titulo").textContent = venceu ? "VITÓRIA!" : "DERROTA...";
  setTimeout(() => document.getElementById("fim").classList.remove("oculto"), 1000);
}

   /*
   8. BOTÕES E MENUS
   */
function fecharSubmenus() {
  document.getElementById("submenu-magia").classList.add("oculto");
  document.getElementById("submenu-inventario").classList.add("oculto");
}

function alternarSubmenu(id) {
  if (ocupado) return;
  const submenu = document.getElementById(id);
  const estavaFechado = submenu.classList.contains("oculto");
  fecharSubmenus();
  if (estavaFechado) submenu.classList.remove("oculto");
}

document.getElementById("btn-atacar").addEventListener("click", () => jogar(ataqueEspada));
document.getElementById("btn-especial").addEventListener("click", () => jogar(ataqueEspecial));
document.getElementById("btn-pocao").addEventListener("click", () => jogar(usarPocao));
document.getElementById("btn-magia").addEventListener("click", () => alternarSubmenu("submenu-magia"));
document.getElementById("btn-inventario").addEventListener("click", () => alternarSubmenu("submenu-inventario"));
document.getElementById("btn-reiniciar").addEventListener("click", () => location.reload());

// Cada botão de magia tem data-magia="fogo", "agua"...
document.querySelectorAll("[data-magia]").forEach((botao) => {
  botao.addEventListener("click", () => jogar(() => usarMagia(botao.dataset.magia)));
});

   /*
   9. COMEÇO DO JOGO
   */
atualizarTela();
mensagem(`Um ${boss.nome} bloqueia o caminho! Escolha uma ação.`);
