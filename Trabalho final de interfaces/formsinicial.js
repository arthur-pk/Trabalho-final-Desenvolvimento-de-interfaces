const form   = document.getElementById("login-form");
const painel = form;
const erro   = document.getElementById("erro");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const senha   = document.getElementById("senha").value.trim();

  if (!usuario || !senha) {
    erro.textContent = "Preencha usuário e senha para entrar.";
    painel.classList.remove("tremer");
    void painel.offsetWidth;
    painel.classList.add("tremer");
    return;
  }

  erro.textContent = "";

  try { sessionStorage.setItem("jogador", usuario); } catch (_) {}

  iniciarJogo(usuario);
});

function iniciarJogo(nome) {
  window.location.href = "jogo/jogo.html";
}
