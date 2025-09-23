
function setupCards(data){
  const cards = document.getElementById('cards');
  const tagsBar = document.querySelector('.tag-filters');
  const countsBar = document.getElementById('counts');

  const allTags = Array.from(new Set(data.flatMap(d => d.tags || []))).sort();
  const activeTags = new Set();

  // Counts summary
  const primaries = ['Value Proposition Foundations','Nokia-Specific Sources','Competitor Sources','Quantum Security Industry Context'];
  const counts = Object.fromEntries(primaries.map(p=>[p,0]));
  data.forEach(d=>{ if (counts[d.primary] !== undefined) counts[d.primary]++; });
  const total = data.length;
  if (countsBar) {
    countsBar.innerHTML = [`Total: ${total}`].concat(
      primaries.map(p=>`${p}: ${counts[p]||0}`)
    ).map(s=>`<span class="count-badge">${escapeHtml(s)}</span>`).join(' ');
  }

  function render(filterPrimary){
    cards.innerHTML = '';
    const filtered = data.filter(d => (filterPrimary==='all' || d.primary===filterPrimary) &&
      (activeTags.size===0 || (d.tags||[]).some(t => activeTags.has(t))));

    filtered.forEach(d => {
      const el = document.createElement('div');
      el.className = 'card';
      const tagsHtml = (d.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
      el.innerHTML = `
        <h3>${escapeHtml(d.title)}</h3>
        <div class="meta">${escapeHtml(d.primary)} • ${escapeHtml(d.file)}</div>
        <div class="snippet">${escapeHtml(d.snippet || '')}</div>
        <div class="tags">${tagsHtml}</div>
      `;
      el.onclick = () => {
        const mdPath = '../md/' + d.slug + '.md';
        window.open(mdPath, '_blank');
      };
      cards.appendChild(el);
    });
  }

  // Primary filter buttons
  let current='all';
  document.querySelectorAll('.filters button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      current = btn.dataset.filter;
      render(current);
    };
  });

  // Tag filters
  tagsBar.innerHTML = allTags.map(t=>`<button data-tag="${t}">${t}</button>`).join('');
  tagsBar.querySelectorAll('button').forEach(b=>{
    b.onclick = () => {
      const t = b.dataset.tag;
      if (activeTags.has(t)) { activeTags.delete(t); b.classList.remove('active'); }
      else { activeTags.add(t); b.classList.add('active'); }
      render(current);
    };
  });

  render(current);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
}
