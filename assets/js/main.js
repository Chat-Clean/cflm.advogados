(() => {
  'use strict';

  // WhatsApp de cada sócio (contatos oficiais divulgados pelo escritório)
  // e qual sócio recebe a mensagem de cada área. Ajuste aqui se a distribuição mudar.
  const WHATSAPP = {
    capuxu: '5584991044841',
    fiuza: '5584994050953',
    lima: '5584994317732',
    marinho: '5584999766601',
  };
  const SOCIO_PADRAO = 'marinho';
  const SOCIO_POR_AREA = {
    'Direito Previdenciário': 'capuxu',
    'Direito Civil': 'marinho',
    'Direito Trabalhista': 'lima',
    'Direito Registral e Notarial': 'lima',
    'Direito Administrativo': 'fiuza',
    'Direito Penal': 'fiuza',
  };

  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- Curvas de relevo do herói ----------
  const relevo = $('.heroi__relevo');
  if (relevo) {
    const L = 1200, A = 800, cx = 820, cy = 380;
    const curvas = [];
    for (let i = 0; i < 15; i++) {
      const r = 46 + i * 44;
      let d = '';
      for (let p = 0; p <= 96; p++) {
        const t = (p / 96) * Math.PI * 2;
        const onda = Math.sin(t * 3 + i * 0.35) * 0.09 + Math.sin(t * 5 - i * 0.22) * 0.05 + Math.sin(t * 2 + 1.3) * 0.12;
        const raio = r * (1 + onda);
        d += `${p ? 'L' : 'M'}${(cx + Math.cos(t) * raio * 1.25).toFixed(1)} ${(cy + Math.sin(t) * raio).toFixed(1)}`;
      }
      curvas.push(`<path d="${d}Z"/>`);
    }
    relevo.innerHTML = `<svg viewBox="0 0 ${L} ${A}" preserveAspectRatio="xMidYMid slice">${curvas.join('')}</svg>`;
  }

  // ---------- Topo ----------
  const topo = $('.topo');
  // No máximo uma leitura de rolagem por quadro, e só mexe no DOM quando o estado muda
  let rolou = null, quadroPedido = false;
  const aoRolar = () => {
    quadroPedido = false;
    const agora = window.scrollY > 24;
    if (agora !== rolou) { rolou = agora; topo.classList.toggle('rolou', agora); }
  };
  aoRolar();
  window.addEventListener('scroll', () => {
    if (!quadroPedido) { quadroPedido = true; requestAnimationFrame(aoRolar); }
  }, { passive: true });

  // Laços (relevo, brasão, faixa) pausam enquanto estão fora da tela
  const heroi = $('.heroi');
  let heroiVisivel = true;
  if ('IntersectionObserver' in window) {
    const obsLacos = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        e.target.classList.toggle('fora-da-tela', !e.isIntersecting);
        if (e.target === heroi) heroiVisivel = e.isIntersecting;
      });
    });
    [heroi, $('.faixa')].forEach((el) => el && obsLacos.observe(el));
  }

  const botaoMenu = $('.topo__menu');
  const nav = $('.nav');
  const alternarMenu = (abrir) => {
    nav.classList.toggle('aberta', abrir);
    topo.classList.toggle('menu-aberto', abrir);
    botaoMenu.setAttribute('aria-expanded', String(abrir));
    $('.so-leitor', botaoMenu).textContent = abrir ? 'Fechar menu' : 'Abrir menu';
    document.body.style.overflow = abrir ? 'hidden' : '';
  };
  botaoMenu.addEventListener('click', () => alternarMenu(!nav.classList.contains('aberta')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) alternarMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('aberta')) { alternarMenu(false); botaoMenu.focus(); }
  });

  // Link ativo conforme a seção visível
  const links = $$('.nav > a[href^="#"]:not(.botao)');
  const secoes = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const obsNav = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === `#${e.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secoes.forEach((s) => obsNav.observe(s));
  }

  // ---------- Revelações ao rolar ----------
  const revelaveis = $$('[data-reveal]');
  if (semMovimento || !('IntersectionObserver' in window)) {
    revelaveis.forEach((el) => el.classList.add('visivel'));
  } else {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('visivel');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revelaveis.forEach((el) => obs.observe(el));
  }

  // ---------- Brasão: quadrante e nome acendem juntos ----------
  const nomes = $$('.brasao__nomes span');
  const acender = (socio) => nomes.forEach((n) => n.classList.toggle('aceso', n.dataset.socio === socio));
  const quads = $$('.quad');
  const brasao = $('.brasao');
  let emUso = false; // visitante com o mouse ou o foco no brasão: o laço espera

  quads.forEach((q) => {
    ['mouseenter', 'focus'].forEach((ev) => q.addEventListener(ev, () => acender(q.dataset.socio)));
    ['mouseleave', 'blur'].forEach((ev) => q.addEventListener(ev, () => acender(null)));
  });

  // Laço: um quadrante por vez vira, mostra o sócio e volta
  if (brasao && !semMovimento) {
    const VIRADO = 2400, INTERVALO = 4200;
    let vez = 0;
    const desvirar = () => quads.forEach((q) => q.classList.remove('virado'));
    const pausar = () => { emUso = true; desvirar(); };
    const retomar = () => { emUso = false; acender(null); };
    brasao.addEventListener('mouseenter', pausar);
    brasao.addEventListener('mouseleave', retomar);
    brasao.addEventListener('focusin', pausar);
    brasao.addEventListener('focusout', retomar);

    setTimeout(() => setInterval(() => {
      if (emUso || document.hidden || !heroiVisivel) return;
      const q = quads[vez % quads.length];
      vez += 1;
      q.classList.add('virado');
      acender(q.dataset.socio);
      setTimeout(() => {
        q.classList.remove('virado');
        if (!emUso) acender(null);
      }, VIRADO);
    }, INTERVALO), 1600);
  }

  // ---------- Áreas de atuação (abas) ----------
  const abas = $$('.areas__lista [role="tab"]');
  const selecionar = (aba, focar) => {
    abas.forEach((a) => {
      const ativa = a === aba;
      a.setAttribute('aria-selected', String(ativa));
      a.tabIndex = ativa ? 0 : -1;
      document.getElementById(a.getAttribute('aria-controls')).hidden = !ativa;
    });
    if (focar) aba.focus();
    aba.scrollIntoView({ block: 'nearest', inline: 'center', behavior: semMovimento ? 'auto' : 'smooth' });
  };
  abas.forEach((aba, i) => {
    aba.addEventListener('click', () => selecionar(aba, false));
    aba.addEventListener('keydown', (e) => {
      const passo = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      let alvo = null;
      if (passo) alvo = abas[(i + passo + abas.length) % abas.length];
      if (e.key === 'Home') alvo = abas[0];
      if (e.key === 'End') alvo = abas[abas.length - 1];
      if (alvo) { e.preventDefault(); selecionar(alvo, true); }
    });
  });

  // Botões "Enviar mensagem sobre…" já deixam o assunto escolhido no formulário
  const campoArea = $('#area');
  $$('[data-area]').forEach((b) => b.addEventListener('click', () => { campoArea.value = b.dataset.area; }));

  // ---------- Formulário → WhatsApp ----------
  const form = $('#mensagem');
  const validar = (campo) => {
    const erro = $(`#erro-${campo.id}`);
    const vazio = !campo.value.trim();
    campo.setAttribute('aria-invalid', String(vazio));
    if (vazio) campo.setAttribute('aria-describedby', erro.id); else campo.removeAttribute('aria-describedby');
    erro.hidden = !vazio;
    return !vazio;
  };
  const obrigatorios = [$('#nome'), $('#texto')];
  obrigatorios.forEach((c) => c.addEventListener('input', () => { if (c.getAttribute('aria-invalid') === 'true') validar(c); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalidos = obrigatorios.filter((c) => !validar(c));
    if (invalidos.length) { invalidos[0].focus(); return; }

    const area = campoArea.value;
    const numero = WHATSAPP[SOCIO_POR_AREA[area] || SOCIO_PADRAO];
    const linhas = [
      `Olá! Meu nome é ${$('#nome').value.trim()}.`,
      area ? `Assunto: ${area}.` : null,
      '',
      $('#texto').value.trim(),
    ].filter((l) => l !== null);
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
  });

  $('#ano').textContent = new Date().getFullYear();
})();
