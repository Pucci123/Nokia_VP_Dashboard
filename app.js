// Minimal, dependency-free client-side app

// Section titles as requested
const SECTION_TITLES = {
  academic: 'Customer Value Propositions (Academic/General Sources)',
  nokia: 'Nokia',
  competitors: 'Nokia’s Competitors',
  quantum: 'Quantum Security',
};

// In-memory store per section
const state = {
  academic: { files: [], items: [], filtered: [] },
  nokia: { files: [], items: [], filtered: [] },
  competitors: { files: [], items: [], filtered: [] },
  quantum: { files: [], items: [], filtered: [] },
};

// Utility: debounce
const debounce = (fn, delay = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

// Tabs
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-tab');
      document.getElementById(`panel-${key}`).classList.add('active');
    });
  });
}

// Uploader components
function setupUploaders() {
  document.querySelectorAll('.uploader').forEach((node) => {
    const key = node.getAttribute('data-key');
    renderUploader(node, key);
  });
}

function renderUploader(node, key) {
  node.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = SECTION_TITLES[key];

  const uploadArea = document.createElement('label');
  uploadArea.className = 'upload-area w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 p-6 text-center text-gray-600 cursor-pointer transition-colors';
  uploadArea.innerHTML = `
    <div class=\"text-sm\">Drag & drop files here or <span class=\"underline\">click to upload</span></div>
    <div class=\"mt-1 text-xs text-gray-500\">Accepted: .pdf .docx .xlsx .url</div>
    <input type=\"file\" multiple class=\"sr-only\" accept=\".pdf,.docx,.xlsx,.url\" />
  `;

  const input = uploadArea.querySelector('input');
  uploadArea.addEventListener('click', () => input.click());
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-blue-500');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('border-blue-500'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-blue-500');
    handleFiles(key, e.dataTransfer.files);
  });
  input.addEventListener('change', (e) => handleFiles(key, e.target.files));

  const fileList = document.createElement('ul');
  fileList.className = 'file-list';

  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.innerHTML = `
    <button class="btn primary" data-action="extract">Extract CVPs</button>
    <button class="btn" data-action="classify-res">Classify Resources</button>
    <button class="btn" data-action="classify-pop">Classify PoP/PoD</button>
    <button class="btn success" data-action="download">Download CSV</button>
    <button class="btn warn" data-action="clear">Clear Extraction</button>
    <div class="search"><input type="search" placeholder="Search table..." /></div>
  `;

  // Manual URL form
  const manual = document.createElement('div');
  manual.className = 'inline-form';
  manual.innerHTML = `
    <input type="url" placeholder="Paste URL (https://...)" />
    <button class="btn" data-action="add-url">Add URL</button>
  `;

  const tableWrap = document.createElement('div');
  tableWrap.innerHTML = tableTemplate();

  // Post-extraction analysis uploader
  const analysisCard = document.createElement('div');
  analysisCard.className = 'card';
  analysisCard.style.marginTop = '12px';
  analysisCard.innerHTML = `
    <div class="title">Additional Analysis</div>
    <label class="upload-area">
      <div><strong>Upload files for analysis</strong> (PDF, DOCX, CSV)</div>
      <div style="margin-top:6px; font-size:12px;">Accepted: .pdf .docx .csv</div>
      <input type="file" multiple style="display:none" accept=".pdf,.docx,.csv" />
    </label>
    <ul class="file-list" data-role="analysis-list"></ul>
    <div class="controls">
      <button class="btn primary" data-action="analyze">Analyze</button>
      <div id="analysis-result" style="margin-left:auto; color: var(--muted);"></div>
    </div>
  `;

  card.appendChild(title);
  card.appendChild(uploadArea);
  card.appendChild(fileList);
  card.appendChild(manual);
  card.appendChild(controls);
  card.appendChild(tableWrap);
  card.appendChild(analysisCard);
  node.appendChild(card);

  // Event wiring
  controls.querySelector('[data-action="extract"]').addEventListener('click', () => extractCVPs(key));
  controls.querySelector('[data-action="classify-res"]').addEventListener('click', () => classifyResources(key));
  controls.querySelector('[data-action="classify-pop"]').addEventListener('click', () => classifyPoP(key));
  controls.querySelector('[data-action="download"]').addEventListener('click', () => downloadCSV(key));
  controls.querySelector('[data-action="clear"]').addEventListener('click', () => clearSection(key));
  const searchInput = controls.querySelector('input[type="search"]');
  searchInput.addEventListener('input', debounce(() => applySearch(key, searchInput.value)));

  // URL and Text handlers
  const urlInput = manual.querySelector('input[type="url"]');
  manual.querySelector('[data-action="add-url"]').addEventListener('click', async () => {
    const url = (urlInput.value || '').trim();
    if (!url) return;
    addUrlEntry(key, url);
    urlInput.value = '';
  });

  // Save dom references for this section
  const analysisInput = analysisCard.querySelector('input[type="file"]');
  const analysisList = analysisCard.querySelector('[data-role="analysis-list"]');
  const analysisBtn = analysisCard.querySelector('[data-action="analyze"]');
  const analysisResult = analysisCard.querySelector('#analysis-result');

  analysisCard.querySelector('.upload-area').addEventListener('click', () => analysisInput.click());
  analysisInput.addEventListener('change', (e) => handleAnalysisFiles(key, e.target.files));
  analysisBtn.addEventListener('click', () => analyzeFiles(key));

  state[key].dom = { fileList, tbody: tableWrap.querySelector('tbody'), searchInput, analysisList, analysisResult };
  renderFileList(key);
  renderTable(key);
}

function clearSection(key) {
  state[key].files = [];
  state[key].items = [];
  state[key].filtered = [];
  if (state[key].dom?.fileList) state[key].dom.fileList.innerHTML = '';
  if (state[key].dom?.searchInput) state[key].dom.searchInput.value = '';
  if (state[key].dom?.tbody) state[key].dom.tbody.innerHTML = '';
}

function handleFiles(key, files) {
  const arr = Array.from(files);
  const wrapped = arr.map((f) => ({ kind: 'file', file: f }));
  state[key].files.push(...wrapped);
  renderFileList(key);
}

function addUrlEntry(key, url) {
  state[key].files.push({ kind: 'url', url });
  renderFileList(key);
}

// (Removed pasted text support)

function renderFileList(key) {
  const ul = state[key].dom.fileList;
  ul.innerHTML = '';
  state[key].files.forEach((entry) => {
    const li = document.createElement('li');
    if (entry.kind === 'file') {
      const f = entry.file;
      li.textContent = `${f.name} (${formatSize(f.size)})`;
    } else if (entry.kind === 'url') {
      li.textContent = `URL: ${entry.url}`;
    }
    ul.appendChild(li);
  });
  // Analysis list
  if (!state[key].analysisFiles) state[key].analysisFiles = [];
  const al = state[key].dom.analysisList;
  if (al) {
    al.innerHTML = '';
    state[key].analysisFiles.forEach((f) => {
      const li = document.createElement('li');
      li.textContent = `${f.name} (${formatSize(f.size)})`;
      al.appendChild(li);
    });
  }
}

function handleAnalysisFiles(key, files) {
  const arr = Array.from(files);
  if (!state[key].analysisFiles) state[key].analysisFiles = [];
  state[key].analysisFiles.push(...arr);
  renderFileList(key);
}

async function analyzeFiles(key) {
  const files = state[key].analysisFiles || [];
  if (!files.length) {
    state[key].dom.analysisResult.textContent = 'No files selected.';
    return;
  }
  state[key].dom.analysisResult.textContent = 'Analyzing...';
  let totalChars = 0;
  let docCount = 0;
  for (const f of files) {
    try {
      const ext = f.name.toLowerCase().split('.').pop();
      if (ext === 'csv') {
        const t = await readAsText(f);
        totalChars += t.length;
        docCount++;
      } else {
        const units = await fileToMarkdownUnits(f);
        const text = units.map(u => u.text).join('\n');
        totalChars += text.length;
        docCount++;
      }
    } catch (e) {
      console.warn('Analyze failed for', f.name, e);
    }
  }
  state[key].dom.analysisResult.textContent = `Analyzed ${docCount} file(s). Extracted ~${totalChars.toLocaleString()} characters.`;
}

function tableTemplate() {
  return `
    <table>
      <thead>
        <tr>
          <th class="col-extracted">Extracted Text</th>
          <th class="col-source">Source</th>
          <th class="col-page">Page</th>
          <th class="col-class">Classification</th>
          <th class="col-class">PoP/PoD</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
}

function renderTable(key) {
  const tbody = state[key].dom.tbody;
  const rows = state[key].filtered.length ? state[key].filtered : state[key].items;
  tbody.innerHTML = '';
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    const resCell = row.resourceClass ? tag(row.resourceClass) : '<span class="tag" style="color:#6b7280;border-color:#e5e7eb;background:#fff">Unclassified</span>';
    const popCell = row.pop ? tag(row.pop) : '<span class="tag" style="color:#6b7280;border-color:#e5e7eb;background:#fff">Unclassified</span>';
    tr.innerHTML = `
      <td>${escapeHtml(row.text)}</td>
      <td class="col-source">${escapeHtml(row.source)}</td>
      <td class="col-page">${row.page ?? ''}</td>
      <td>${resCell}</td>
      <td>${popCell}</td>
    `;
    tbody.appendChild(tr);
  });
}

function tag(kind) {
  const map = { firm: 'Firm-Based', market: 'Market-Based', mixed: 'Mixed', pop: 'PoP', pod: 'PoD' };
  const cls = kind === 'pop' || kind === 'pod' ? kind : kind; // style hooks
  return `<span class="tag ${cls}">${map[kind] || kind}</span>`;
}

function applySearch(key, q) {
  const rows = state[key].items;
  const needle = (q || '').toLowerCase();
  state[key].filtered = needle
    ? rows.filter((r) => [r.text, r.source, String(r.page || '')].some((x) => (x || '').toLowerCase().includes(needle)))
    : [];
  renderTable(key);
}

function downloadCSV(key) {
  const rows = state[key].filtered.length ? state[key].filtered : state[key].items;
  const header = ['Extracted Text', 'Source', 'Page', 'Classification', 'PoP/PoD'];
  const csv = [header]
    .concat(
      rows.map((r) => [r.text, r.source, r.page ?? '', prettyClass(r.resourceClass), prettyClass(r.pop)].map(csvEscape).join(','))
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${key}-cvps.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function prettyClass(k) {
  if (!k) return '';
  const map = { firm: 'Firm-Based', market: 'Market-Based', mixed: 'Mixed', pop: 'PoP', pod: 'PoD' };
  return map[k] || k;
}

function csvEscape(s) {
  const str = String(s ?? '');
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Extraction Pipeline
async function extractCVPs(key) {
  const files = state[key].files;
  if (!files.length) return alert('Please upload at least one file.');

  const extracted = [];
  for (const entry of files) {
    try {
      if (entry.kind === 'file') {
        const f = entry.file;
        const unitsWithPages = await fileToMarkdownUnits(f);
        unitsWithPages.forEach(({ text, page }) => {
          const units = splitIntoUnits(text);
          units.forEach((u) => {
            if (isCVP(u)) extracted.push({ text: u.trim(), source: f.name, page: page ?? '' });
          });
        });
      } else if (entry.kind === 'url') {
        const units = await urlToTextUnits(entry.url);
        units.forEach(({ text, page }) => {
          const split = splitIntoUnits(text);
          split.forEach((u) => {
            if (isCVP(u)) extracted.push({ text: u.trim(), source: entry.url, page: page ?? '' });
          });
        });
    }
    } catch (e) {
      console.warn('Failed to parse source', entry, e);
    }
  }

  state[key].items = dedupeByText(extracted);
  state[key].filtered = [];
  // Auto-run classification for convenience
  classifyResources(key);
  classifyPoP(key);
  renderTable(key);
}

// Refined heuristics for CVP criteria (Payne et al.)
const LEX = {
  benefitsCosts: [
    'benefit', 'benefits', 'value', 'outcome', 'outcomes', 'improve', 'enhance', 'optimize', 'save time', 'save cost', 'reduce cost', 'lower cost', 'cost savings', 'efficiency', 'effectiveness', 'reliability', 'trust', 'security', 'scalable', 'performance', 'usability', 'experience', 'roi', 'return on investment', 'total cost of ownership', 'tco'
  ],
  costsOnly: ['price', 'cost', 'risk', 'time-to-market', 'maintenance', 'operational cost', 'capex', 'opex'],
  differentiation: ['differentiate', 'differentiated', 'unique', 'only', 'unmatched', 'best-in-class', 'competitive advantage', 'distinctive', 'proprietary', 'patented', 'one-of-a-kind', 'superior'],
  competitors: ['vs competitor', 'than competitors', 'compared to', 'benchmark', 'market leader', 'leaders', 'alternative', 'alternatives'],
  valueFunctional: ['functional', 'performance', 'availability', 'reliability', 'scalability', 'latency', 'throughput', 'interoperability', 'compliance', 'security', 'privacy'],
  valueExperiential: ['experiential', 'experience', 'ease of use', 'usability', 'design', 'aesthetics', 'brand', 'support', 'service', 'customer success', 'onboarding'],
  lifecycle: ['before use', 'pre-sale', 'onboarding', 'during use', 'in-use', 'after use', 'post-sale', 'renewal', 'adoption', 'retention', 'customer journey', 'lifecycle', 'co-create', 'co-created', 'co-creation'],
  resourceSharing: ['partner', 'partners', 'alliance', 'alliances', 'ecosystem', 'integration with', 'joint', 'co-innovate', 'co-develop', 'collaborat', 'api', 'platform partnership'],
  configuration: ['configure', 'configured', 'configuration', 'orchestrate', 'orchestration', 'bundle', 'bundled', 'solutioning', 'process', 'processes', 'operating model', 'capability', 'capabilities', 'resource', 'resources', 'platform', 'architecture', 'framework'],
  designSegment: ['for enterprises', 'for smb', 'for consumers', 'for operators', 'for manufacturers', 'segment', 'vertical', 'for banks', 'for healthcare', 'for government', 'for telco', 'for education', 'for retail', 'target customers', 'customer segment', 'persona']
};

function countHits(text, words) {
  const t = text.toLowerCase();
  return words.reduce((acc, w) => (t.includes(w) ? acc + 1 : acc), 0);
}

function matchCriteria(text) {
  const t = text.toLowerCase();
  const c = {
    benefitsCosts: countHits(t, LEX.benefitsCosts) + countHits(t, LEX.costsOnly) > 0,
    differentiation: countHits(t, LEX.differentiation) + countHits(t, LEX.competitors) > 0,
    valueElements: (countHits(t, LEX.valueFunctional) > 0) || (countHits(t, LEX.valueExperiential) > 0),
    lifecycle: countHits(t, LEX.lifecycle) > 0,
    resourceSharing: countHits(t, LEX.resourceSharing) > 0,
    configuration: countHits(t, LEX.configuration) > 0,
    designSegment: countHits(t, LEX.designSegment) > 0,
  };
  c.count = Object.values(c).filter(Boolean).length;
  c.hasVPWord = /\b(cvps?|value\s+proposition(s)?)\b/i.test(t);
  // Bonus if both functional and experiential appear
  c.valueBoth = (countHits(t, LEX.valueFunctional) > 0) && (countHits(t, LEX.valueExperiential) > 0);
  return c;
}

function isCVP(text) {
  if (!preFilterUnit(text)) return false;
  const c = matchCriteria(text);
  // Higher precision: require at least 3 criteria
  let ok = c.count >= 3;
  // Strong combos allowed
  const strongPair = (c.resourceSharing && c.configuration) || (c.differentiation && c.valueElements);
  const targetedStrong = (c.differentiation || c.configuration || c.resourceSharing) && c.designSegment;
  if (strongPair || targetedStrong || c.valueBoth) ok = true;
  // If it merely mentions VP but is otherwise weak, reject
  if (c.hasVPWord && c.count < 3 && !strongPair && !c.valueBoth) ok = false;
  return ok;
}

function splitIntoUnits(text) {
  if (!text) return [];
  const cleaned = normalizeTextForUnits(text);
  const paras = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const units = [];
  for (const p of paras) {
    const sentences = p.length > 160 ? p.split(/(?<=[\.!?])\s+(?=[A-Z(\[])/) : [p];
    for (const s of sentences) {
      const st = s.trim();
      if (preFilterUnit(st)) units.push(st);
    }
  }
  return units;
}

function normalizeTextForUnits(text) {
  return text
    .replace(/[\u00AD\u200B\u200C\u200D]/g, '')
    .replace(/\n\s*-{2,}\s*\n/g, '\n')
    .replace(/\n?\s*Page\s+\d+(\s+of\s+\d+)?\s*\n/gi, '\n')
    .replace(/\n?\s*Confidential\s*\n/gi, '\n')
    .replace(/[\t\r]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function preFilterUnit(s) {
  const text = s.trim();
  if (!text) return false;
  const len = text.length;
  const words = text.split(/\s+/).length;
  if (len < 50 || len > 500) return false;
  if (words < 8) return false;
  if ((text.match(/[;,]/g) || []).length >= 4) return false;
  if (/^figure\b|^table\b|^appendix\b|^references\b/i.test(text)) return false;
  if (/copyright|cookie|privacy|terms|subscribe|login|table of contents/i.test(text)) return false;
  const tokens = text.split(/\s+/);
  const numish = tokens.filter((t) => /[\d%$]/.test(t)).length;
  if (numish / tokens.length > 0.5) return false;
  return true;
}

function dedupeByText(items) {
  const seen = new Set();
  const out = [];
  items.forEach((it) => {
    const key = it.text.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(it); }
  });
  return out;
}

// Resource classification per RBT
function classifyResources(key) {
  const items = state[key].items;
  items.forEach((r) => {
    const t = r.text.toLowerCase();
    const firmHits = countHits(t, [
      'leadership', 'strategy', 'strategic alignment', 'internal', 'capability', 'capabilities', 'process', 'processes', 'product knowledge', 'technical expertise', 'operations', 'operational', 'platform', 'infrastructure', 'scalable architecture'
    ]);
    const marketHits = countHits(t, [
      'customer', 'client', 'consumer', 'market', 'competitor', 'brand', 'branding', 'relationship', 'insight', 'market insight', 'innovation', 'innovative', 'culture', 'co-create', 'partnership', 'ecosystem', 'partner'
    ]);
    r.resourceClass = firmHits && marketHits ? 'mixed' : firmHits ? 'firm' : marketHits ? 'market' : undefined;
  });
  renderTable(key);
}

// PoP vs PoD classification
function classifyPoP(key) {
  const items = state[key].items;
  items.forEach((r) => {
    const t = r.text.toLowerCase();
    const podHits = countHits(t, [
      'unique', 'only', 'first', 'leading', 'best-in-class', 'differentiated', 'proprietary', 'patented', 'exclusive', 'distinctive', 'unmatched', 'state-of-the-art'
    ]);
    const popHits = countHits(t, [
      'standard', 'compliant', 'compliance', 'baseline', 'expected', 'required', 'industry standard', 'best practice', 'meets requirements', 'mandatory'
    ]);
    r.pop = podHits > popHits ? 'pod' : popHits > 0 && podHits === 0 ? 'pop' : undefined;
  });
  renderTable(key);
}

// File to markdown-ish text with page hints when possible
async function fileToMarkdownUnits(file) {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'url') {
    const text = await readAsText(file);
    // .url (Windows InternetShortcut) format
    // e.g., [InternetShortcut]\nURL=https://...
    const urlMatch = text.match(/URL=(.+)/i);
    const url = urlMatch ? urlMatch[1].trim() : text.trim();
    return [{ text: `# ${file.name}\n\nSource URL: ${url}`, page: null }];
  }
  if (ext === 'pdf') {
    try {
      if (window.pdfjsLib) {
        const pages = await extractPdfWithPdfjs(file);
        if (pages && pages.length) return pages;
      }
    } catch (e) {
      console.warn('pdf.js extraction failed, falling back to heuristic', e);
    }
    const ab = await readAsArrayBuffer(file);
    const pages = extractPrintableTextWithPages(new Uint8Array(ab), ext);
    return pages.length ? pages : [{ text: extractPrintableText(new Uint8Array(ab)), page: null }];
  }
  if (ext === 'docx') {
    const ab = await readAsArrayBuffer(file);
    try {
      if (window.mammoth && window.mammoth.convertToHtml) {
        const res = await window.mammoth.convertToHtml({ arrayBuffer: ab });
        const html = res.value || '';
        const text = htmlToPlainText(html);
        return [{ page: null, text }];
      }
    } catch (e) {
      console.warn('mammoth.js extraction failed, fallback to heuristic', e);
    }
    const pages = extractPrintableTextWithPages(new Uint8Array(ab), ext);
    return pages.length ? pages : [{ text: extractPrintableText(new Uint8Array(ab)), page: null }];
  }
  if (ext === 'xlsx') {
    const ab = await readAsArrayBuffer(file);
    try {
      if (window.XLSX) {
        const wb = window.XLSX.read(ab, { type: 'array' });
        const out = [];
        wb.SheetNames.forEach((name) => {
          const ws = wb.Sheets[name];
          if (!ws) return;
          // Convert to CSV for readable text extraction
          const csv = window.XLSX.utils.sheet_to_csv(ws, { blankrows: false });
          const text = `Sheet: ${name}\n\n${csv}`;
          out.push({ page: null, text });
        });
        if (out.length) return out;
      }
    } catch (e) {
      console.warn('SheetJS extraction failed, fallback to heuristic', e);
    }
    const pages = extractPrintableTextWithPages(new Uint8Array(ab), ext);
    return pages.length ? pages : [{ text: extractPrintableText(new Uint8Array(ab)), page: null }];
  }
  // Fallback as text
  try { return [{ text: await readAsText(file), page: null }]; } catch { return [{ text: `# ${file.name}`, page: null }]; }
}

function extractPrintableText(bytes) {
  // Heuristic: collect sequences of printable ASCII/UTF-8 bytes into words.
  // This is crude but may recover visible text from some PDFs/DOCX/XLSX.
  let out = '';
  let run = [];
  const flush = () => {
    if (run.length) {
      try {
        // Interpret as UTF-8 where possible
        const txt = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(run));
        if (/\w/.test(txt)) out += txt + ' ';
      } catch {}
      run = [];
    }
  };
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Allow common UTF-8 range and ASCII punctuation/spaces
    const printable = (b >= 32 && b <= 126) || (b >= 160);
    if (printable) run.push(b);
    else flush();
  }
  flush();
  // Replace long runs of spaces and odd separators, add newlines at plausible places
  return out
    .replace(/[\r\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/(\.|!|\?)\s+/g, '$1\n');
}

function extractPrintableTextWithPages(bytes, ext) {
  // Returns array of { text, page }
  // Heuristics focused on PDF; DOCX/XLSX usually lack page info in raw content
  const text = extractPrintableText(bytes);
  const lines = text.split(/\n+/);

  // Strategy 1: detect explicit 'Page N' markers and segment
  let segments = [];
  let current = { page: null, text: [] };
  let lastPage = null;
  const pageRegex = /^\s*(page|pg)\s*(\d{1,4})\b/i;
  for (const line of lines) {
    const m = line.match(pageRegex);
    if (m) {
      // Flush previous
      if (current.text.length) segments.push({ page: current.page, text: current.text.join('\n') });
      lastPage = parseInt(m[2], 10);
      current = { page: lastPage, text: [] };
      continue;
    }
    current.text.push(line);
  }
  if (current.text.length) segments.push({ page: current.page, text: current.text.join('\n') });

  // Strategy 2: if no explicit page markers and extension is pdf, try splitting by long separators
  if ((!segments.length || segments.every(s => s.page == null)) && ext === 'pdf') {
    const altPages = text.split(/\f|\n\s*-{5,}\s*\n/g); // form-feed or long dashes as pseudo page breaks
    if (altPages.length > 1) {
      segments = altPages.map((t, i) => ({ page: i + 1, text: t }));
    }
  }

  // Fallback single segment
  if (!segments.length) return [{ page: null, text }];
  return segments;
}

async function extractPdfWithPdfjs(file) {
  const ab = await readAsArrayBuffer(file);
  const pdfjs = window.pdfjsLib;
  const task = pdfjs.getDocument({ data: ab });
  const pdf = await task.promise;
  const results = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const raw = content.items.map((it) => (it.str || '')).join(' ');
    const text = raw
      .replace(/[\t\r]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/([\.!?])\s+/g, '$1\n')
      .trim();
    if (text) results.push({ page: pageNum, text });
  }
  return results;
}

function htmlToPlainText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  // Remove non-content elements
  tmp.querySelectorAll('script,style,nav,footer,header,aside,form').forEach((el) => el.remove());
  tmp.querySelectorAll('[role="navigation"], [aria-hidden="true"]').forEach((el) => el.remove());
  const blockTags = new Set(['P','DIV','LI','H1','H2','H3','H4','H5','H6','TABLE','TR']);
  const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT, null);
  let lastBlock = null;
  let text = '';
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent) continue;
    const isHidden = parent.closest('[hidden], [aria-hidden="true"], style[display="none"]');
    if (isHidden) continue;
    const isBlock = blockTags.has(parent.tagName);
    const content = node.nodeValue.replace(/[\s\u00A0]+/g, ' ').trim();
    if (!content) continue;
    if (isBlock && lastBlock !== parent) {
      text += (text ? '\n' : '');
      lastBlock = parent;
    } else if (text) {
      text += ' ';
    }
    text += content;
  }
  return text
    .replace(/[\t\r]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/([\.!?])\s+/g, '$1\n')
    .trim();
}

async function urlToTextUnits(url) {
  // Try to fetch the URL and extract visible text; if CORS/restricted, return a placeholder unit
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      const html = await res.text();
      const text = htmlToPlainText(html);
      return [{ page: null, text }];
    }
    if (ct.includes('application/pdf')) {
      // Stream into pdf.js is complex from cross-origin; fallback to note
      return [{ page: null, text: `Source URL (PDF): ${url}` }];
    }
    const text = await res.text();
    return [{ page: null, text }];
  } catch (e) {
    console.warn('URL fetch failed, using placeholder', e);
    return [{ page: null, text: `Source URL: ${url}` }];
  }
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(String(fr.result));
    fr.readAsText(file);
  });
}

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(fr.result);
    fr.readAsArrayBuffer(file);
  });
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupUploaders();
});
