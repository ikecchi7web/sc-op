const STORAGE_KEY = "swipecard-live-demo-deck-v5";
const LIVE_KEY = "swipecard-live-demo-state-v5";
const CHANNEL_NAME = "swipecard-live-v5";
const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;

const DEFAULT_TEXT_SIZES = {
    title: 114,
    body: 48,
    band: 60,
    memo: 48
};

const PREVIEW_FONT_SCALE = 0.27;
const MAX_ROWS = 12;
const MAX_COLUMNS = 6;

const demoCopy = [
    {
        title: "0→1営業支援ツール",
        body: "名刺交換を営業の入口に変える\nスキルの見える化\n信用の見える化",
        band: "学びと評価を\n自分の意思で営業資産に変える",
        memo: "紙名刺や普通のプロフィールでは伝わらない\n実力と信頼を、その場で見せるための仕組みです。",
        ctaEnabled: true,
        ctaLabel: "詳しく見る",
        ctaUrl: "#"
    },
    {
        title: "SwipeCardとは",
        body: "対面で説明しながら\n相手のスマホへ資料を届ける\n新しい営業の入口です。",
        band: "横展開は大きなボタンで移動",
        memo: "左右スワイプを使わず、迷わない操作を優先します。"
    },
    {
        title: "学びはあるのに\n見せる形がない",
        body: "講座を受けても\n卒業しても\n仕事につながる形で見せられない",
        band: "実績が少ない人ほど\n不安が大きい",
        memo: "何を見せれば仕事につながるのか。その空白を埋めます。"
    },
    {
        title: "紙名刺だけでは伝わらない",
        body: "実力・信頼・学びの履歴は\n小さな紙面だけでは残りません。",
        band: "その場で見せる入口が必要です",
        memo: "補足ページは左右のボタンで行き来します。"
    },
    {
        title: "学びと評価を\n営業資産に変える",
        body: "実績・評価・次の行動を\n1つのURLで見せます。",
        band: "相手のスマホでも軽く表示",
        memo: "完成WebPとHTMLテキストを組み合わせます。"
    },
    {
        title: "Liveで同じページを見る",
        body: "管理者がページを指定すると\n相手画面も同じ位置へ移動します。",
        band: "対面プレゼンの一体感",
        memo: "Live終了後は自由閲覧へ戻ります。"
    },
    {
        title: "その場で次の約束へ",
        body: "QR・URL共有から\nフォーム・電話・vCard保存へ。",
        band: "説明から行動までを短くする",
        memo: "CTAはページごとに表示・非表示を選べます。",
        ctaEnabled: true,
        ctaLabel: "相談する",
        ctaUrl: "https://example.com"
    },
    {
        title: "SwipeCard Demo",
        body: "ここまでが縦4行・横2列の\n基本デモです。",
        band: "管理画面から構成を変更できます",
        memo: "縦行・横列を増減するとページ枠を自動調整します。"
    }
];

const demoDeck = createDeck(4, 2);
let deck = loadDeck();
let liveState = loadLiveState();
let currentView = new URLSearchParams(location.search).get("view") || "preview";
let activePageId = liveState.currentPageId || deck.pages[0].id;
let groupSelections = {};
let backgroundOptions = [{ label: "背景なし", value: "" }];
let scrollTimer = null;

const views = {
    preview: document.getElementById("previewView"),
    admin: document.getElementById("adminView"),
    editor: document.getElementById("editorView")
};
const deckViewport = document.getElementById("deckViewport");
const qrDialog = document.getElementById("qrDialog");

function createDeck(rows, columns) {
    const pages = [];
    for (let row = 1; row <= rows; row += 1) {
        for (let column = 1; column <= columns; column += 1) {
            pages.push(createPage(row, column, demoCopy[pages.length]));
        }
    }
    return {
        id: "demo-deck",
        title: "SwipeCard Demo",
        structure: { rows, columns },
        pages
    };
}

function createPage(row, column, source = {}) {
    return {
        id: `page-${row}-${column}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        group: String(row),
        column,
        label: column === 1 ? String(row) : `${row}-${column}`,
        title: source.title || `ページ ${row}-${column}`,
        body: source.body || "ここに本文を入力します。",
        band: source.band || "",
        memo: source.memo || "",
        titleSize: source.titleSize || DEFAULT_TEXT_SIZES.title,
        bodySize: source.bodySize || DEFAULT_TEXT_SIZES.body,
        bandSize: source.bandSize || DEFAULT_TEXT_SIZES.band,
        memoSize: source.memoSize || DEFAULT_TEXT_SIZES.memo,
        ctaEnabled: Boolean(source.ctaEnabled),
        ctaLabel: source.ctaLabel || "",
        ctaUrl: source.ctaUrl || "",
        background: source.background || "",
        aspect: source.aspect || "5:7"
    };
}

function normalizeDeck(value) {
    const result = value && Array.isArray(value.pages) ? value : structuredClone(demoDeck);
    result.structure ||= {};
    const rows = clampNumber(result.structure.rows || Math.max(...result.pages.map((page) => Number(page.group) || 1)), 1, MAX_ROWS);
    const columns = clampNumber(result.structure.columns || Math.max(...result.pages.map((page) => Number(page.column) || 1)), 1, MAX_COLUMNS);
    result.structure = { rows, columns };
    result.pages.forEach((page, index) => {
        page.group = String(page.group || Math.floor(index / columns) + 1);
        page.column = Number(page.column || (index % columns) + 1);
        page.label = page.column === 1 ? page.group : `${page.group}-${page.column}`;
        page.aspect ||= "5:7";
        page.titleSize ||= DEFAULT_TEXT_SIZES.title;
        page.bodySize ||= DEFAULT_TEXT_SIZES.body;
        page.bandSize ||= DEFAULT_TEXT_SIZES.band;
        page.memoSize ||= DEFAULT_TEXT_SIZES.memo;
    });
    return result;
}

function loadDeck() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return normalizeDeck(saved ? JSON.parse(saved) : structuredClone(demoDeck));
    } catch {
        return structuredClone(demoDeck);
    }
}

function saveDeck() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    broadcast({ type: "deck-updated" });
}

function loadLiveState() {
    try {
        const saved = localStorage.getItem(LIVE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // 初期値へフォールバックする。
    }
    return {
        deckId: demoDeck.id,
        currentPageId: demoDeck.pages[0].id,
        presentationMode: false,
        updatedAt: new Date().toISOString()
    };
}

function saveLiveState(nextState) {
    liveState = {
        ...liveState,
        ...nextState,
        updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LIVE_KEY, JSON.stringify(liveState));
    broadcast({ type: "live-updated", state: liveState });
    renderLiveStatus();
}

function broadcast(message) {
    channel?.postMessage(message);
}

function orderedPages() {
    return [...deck.pages].sort((a, b) => {
        const groupDiff = Number(a.group) - Number(b.group);
        return groupDiff || Number(a.column) - Number(b.column);
    });
}

function pagesForRow(row) {
    return orderedPages().filter((page) => Number(page.group) === Number(row));
}

function pageAt(row, column) {
    return deck.pages.find((page) => Number(page.group) === Number(row) && Number(page.column) === Number(column));
}

function activePage() {
    return deck.pages.find((page) => page.id === activePageId) || orderedPages()[0];
}

function selectedPageForRow(row) {
    const pages = pagesForRow(row);
    const selectedId = groupSelections[row];
    return pages.find((page) => page.id === selectedId) || pages[0];
}

function renderAll() {
    renderDeck();
    renderAdmin();
    renderEditorPageOptions();
    fillEditorForm(activePageId);
    renderLiveStatus();
}

function renderDeck() {
    document.getElementById("deckTitleLabel").textContent = deck.title;
    const rows = Array.from({ length: deck.structure.rows }, (_, index) => index + 1);
    deckViewport.innerHTML = rows.map((row) => {
        const pages = pagesForRow(row);
        const page = selectedPageForRow(row);
        if (!page) return "";
        const columnIndex = pages.findIndex((item) => item.id === page.id);
        const isDetail = columnIndex > 0;
        return `
            <article class="deck-row ${isDetail ? "horizontal-detail" : ""}" data-row="${row}" data-page-id="${escapeAttribute(page.id)}">
                <div class="page-layout ${isDetail ? "no-vertical" : ""}">
                    ${renderPageCard(page)}
                    ${isDetail ? "" : renderVerticalNav(row, page)}
                    ${pages.length > 1 ? renderHorizontalNav(pages, columnIndex, page) : ""}
                </div>
            </article>
        `;
    }).join("");
}

function renderPageCard(page) {
    const backgroundStyle = page.background ? `style="background-image:url('${escapeAttribute(page.background)}')"` : "";
    return `
        <section class="deck-card ${page.background ? "has-bg" : ""} ${page.aspect === "9:16" ? "aspect-9-16" : ""}" ${backgroundStyle}>
            <div class="deck-copy">
                ${page.title ? `<h2 class="deck-title" style="font-size:${previewFontSize(page.titleSize)}px">${escapeHtml(page.title)}</h2>` : ""}
                ${page.body ? `<p class="deck-body" style="font-size:${previewFontSize(page.bodySize)}px">${escapeHtml(page.body)}</p>` : ""}
                ${page.band ? `<div class="deck-band" style="font-size:${previewFontSize(page.bandSize)}px">${escapeHtml(page.band)}</div>` : ""}
                ${page.ctaEnabled && page.ctaLabel ? `<a class="cta-link" href="${escapeAttribute(page.ctaUrl || "#")}">${escapeHtml(page.ctaLabel)}</a>` : ""}
                ${page.memo ? `<div class="deck-memo" style="font-size:${previewFontSize(page.memoSize)}px">${escapeHtml(page.memo)}</div>` : ""}
            </div>
        </section>
    `;
}

function renderVerticalNav(row, page) {
    return `
        <nav class="vertical-nav" aria-label="縦ページ移動">
            <button class="nav-arrow" type="button" data-row-move="-1" data-row="${row}" ${row <= 1 ? "disabled" : ""} aria-label="前の縦ページ">▲</button>
            <span class="nav-dot" aria-hidden="true"></span>
            <span class="nav-current">${escapeHtml(page.label)}</span>
            <span class="nav-dot" aria-hidden="true"></span>
            <button class="nav-arrow" type="button" data-row-move="1" data-row="${row}" ${row >= deck.structure.rows ? "disabled" : ""} aria-label="次の縦ページ">▼</button>
        </nav>
    `;
}

function renderHorizontalNav(pages, columnIndex, page) {
    return `
        <nav class="horizontal-nav" aria-label="横補足ページ移動">
            <button class="nav-arrow" type="button" data-horizontal-page="${pages[columnIndex - 1]?.id || ""}" ${columnIndex === 0 ? "disabled" : ""} aria-label="左のページ">◀</button>
            <span class="nav-dot" aria-hidden="true"></span>
            <span class="nav-current">${escapeHtml(page.label)}</span>
            <span class="nav-dot" aria-hidden="true"></span>
            <button class="nav-arrow" type="button" data-horizontal-page="${pages[columnIndex + 1]?.id || ""}" ${columnIndex >= pages.length - 1 ? "disabled" : ""} aria-label="右のページ">▶</button>
        </nav>
    `;
}

function renderAdmin() {
    const page = activePage();
    document.getElementById("adminPageTitle").textContent = page.title || "無題のページ";
    document.getElementById("adminPageLabel").textContent = page.label;
    document.getElementById("structureSummary").textContent = `縦${deck.structure.rows} × 横${deck.structure.columns}`;
    renderMiniPreview(document.getElementById("adminPreview"), page);

    const grid = document.getElementById("adminPageGrid");
    grid.style.setProperty("--page-columns", deck.structure.columns);
    grid.innerHTML = orderedPages().map((item) => `
        <button class="page-map-button ${item.id === page.id ? "active" : ""}" type="button" data-admin-page="${escapeAttribute(item.id)}">
            <strong>${escapeHtml(item.label)}</strong>
            <small>${escapeHtml(shorten(item.title, 26))}</small>
        </button>
    `).join("");
}

function renderMiniPreview(target, page) {
    target.classList.toggle("aspect-9-16", page.aspect === "9:16");
    target.style.backgroundImage = page.background ? `url("${page.background.replaceAll('"', '\\"')}")` : "";
    target.innerHTML = `
        <div class="mini-copy">
            <strong>${escapeHtml(page.title || "無題")}</strong>
            ${page.memo ? `<span>${escapeHtml(page.memo)}</span>` : ""}
        </div>
    `;
}

function renderEditorPageOptions() {
    const select = document.getElementById("cmsPageSelect");
    const previous = select.value || activePageId;
    select.innerHTML = orderedPages().map((page) => `
        <option value="${escapeAttribute(page.id)}">${escapeHtml(page.label)}　${escapeHtml(shorten(page.title, 34))}</option>
    `).join("");
    select.value = deck.pages.some((page) => page.id === previous) ? previous : activePageId;
    document.getElementById("verticalRowsInput").value = deck.structure.rows;
    document.getElementById("horizontalColumnsInput").value = deck.structure.columns;
}

function fillEditorForm(pageId) {
    const page = deck.pages.find((item) => item.id === pageId) || activePage();
    if (!page) return;
    document.getElementById("cmsPageSelect").value = page.id;
    document.getElementById("cmsGroupInput").value = page.group;
    document.getElementById("cmsColumnInput").value = page.column;
    document.getElementById("cmsAspectInput").value = page.aspect || "5:7";
    const backgroundSelect = document.getElementById("cmsBackgroundSelect");
    backgroundSelect.value = backgroundOptions.some((option) => option.value === page.background) ? page.background : "";
    document.getElementById("cmsBackgroundInput").value = page.background || "";
    document.getElementById("cmsTitleInput").value = page.title || "";
    document.getElementById("cmsTitleSizeInput").value = page.titleSize || DEFAULT_TEXT_SIZES.title;
    document.getElementById("cmsBodyInput").value = page.body || "";
    document.getElementById("cmsBodySizeInput").value = page.bodySize || DEFAULT_TEXT_SIZES.body;
    document.getElementById("cmsBandInput").value = page.band || "";
    document.getElementById("cmsBandSizeInput").value = page.bandSize || DEFAULT_TEXT_SIZES.band;
    document.getElementById("cmsMemoInput").value = page.memo || "";
    document.getElementById("cmsMemoSizeInput").value = page.memoSize || DEFAULT_TEXT_SIZES.memo;
    document.getElementById("cmsCtaEnabledInput").checked = Boolean(page.ctaEnabled);
    document.getElementById("cmsCtaLabelInput").value = page.ctaLabel || "";
    document.getElementById("cmsCtaUrlInput").value = page.ctaUrl || "";
    renderMiniPreview(document.getElementById("editorPreview"), page);
}

async function loadBackgroundCatalog() {
    try {
        const response = await fetch("assets/backgrounds/catalog.json", { cache: "no-store" });
        if (!response.ok) throw new Error("catalog unavailable");
        const catalog = await response.json();
        backgroundOptions = [
            { label: "背景なし", value: "" },
            ...catalog.filter((item) => item?.label && item?.src).map((item) => ({ label: item.label, value: item.src }))
        ];
    } catch {
        backgroundOptions = [{ label: "背景なし", value: "" }];
    }
    const select = document.getElementById("cmsBackgroundSelect");
    select.innerHTML = backgroundOptions.map((option) => `
        <option value="${escapeAttribute(option.value)}">${escapeHtml(option.label)}</option>
    `).join("");
    fillEditorForm(activePageId);
}

function setView(nextView) {
    currentView = views[nextView] ? nextView : "preview";
    Object.entries(views).forEach(([name, element]) => {
        element.hidden = name !== currentView;
    });
    document.querySelectorAll(".mode-tab").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === currentView);
    });
    if (currentView === "admin") renderAdmin();
    if (currentView === "editor") fillEditorForm(activePageId);
}

function setActivePage(pageId, options = {}) {
    const page = deck.pages.find((item) => item.id === pageId);
    if (!page) return;
    activePageId = page.id;
    groupSelections[page.group] = page.id;
    renderDeck();
    renderAdmin();
    renderEditorPageOptions();
    fillEditorForm(page.id);
    if (options.scroll !== false) {
        requestAnimationFrame(() => {
            const row = deckViewport.querySelector(`[data-row="${CSS.escape(page.group)}"]`);
            row?.scrollIntoView({ behavior: options.instant ? "auto" : "smooth", block: "start" });
        });
    }
    if (options.sync) {
        saveLiveState({ currentPageId: page.id, presentationMode: true });
    }
}

function moveVertical(row, delta, sync = liveState.presentationMode) {
    const nextRow = clampNumber(Number(row) + Number(delta), 1, deck.structure.rows);
    const target = pageAt(nextRow, 1);
    if (target) setActivePage(target.id, { sync });
}

function moveHorizontal(pageId, sync = liveState.presentationMode) {
    if (pageId) setActivePage(pageId, { scroll: false, sync });
}

function resizeDeck(rows, columns) {
    const nextRows = clampNumber(rows, 1, MAX_ROWS);
    const nextColumns = clampNumber(columns, 1, MAX_COLUMNS);
    const shrinking = nextRows < deck.structure.rows || nextColumns < deck.structure.columns;
    if (shrinking && !window.confirm("範囲外のページが削除されます。ページ構成を変更しますか？")) {
        renderEditorPageOptions();
        return;
    }

    const nextPages = [];
    for (let row = 1; row <= nextRows; row += 1) {
        for (let column = 1; column <= nextColumns; column += 1) {
            const existing = pageAt(row, column);
            const page = existing || createPage(row, column);
            page.group = String(row);
            page.column = column;
            page.label = column === 1 ? String(row) : `${row}-${column}`;
            nextPages.push(page);
        }
    }
    deck.pages = nextPages;
    deck.structure = { rows: nextRows, columns: nextColumns };
    if (!deck.pages.some((page) => page.id === activePageId)) activePageId = deck.pages[0].id;
    groupSelections = {};
    saveDeck();
    renderAll();
    setActivePage(activePageId, { instant: true, scroll: false, sync: liveState.presentationMode });
}

function saveCurrentPage() {
    const pageId = document.getElementById("cmsPageSelect").value;
    const page = deck.pages.find((item) => item.id === pageId);
    if (!page) return;
    page.aspect = document.getElementById("cmsAspectInput").value;
    page.background = document.getElementById("cmsBackgroundInput").value.trim();
    page.title = document.getElementById("cmsTitleInput").value.trim();
    page.titleSize = Number(document.getElementById("cmsTitleSizeInput").value || DEFAULT_TEXT_SIZES.title);
    page.body = document.getElementById("cmsBodyInput").value.trim();
    page.bodySize = Number(document.getElementById("cmsBodySizeInput").value || DEFAULT_TEXT_SIZES.body);
    page.band = document.getElementById("cmsBandInput").value.trim();
    page.bandSize = Number(document.getElementById("cmsBandSizeInput").value || DEFAULT_TEXT_SIZES.band);
    page.memo = document.getElementById("cmsMemoInput").value.trim();
    page.memoSize = Number(document.getElementById("cmsMemoSizeInput").value || DEFAULT_TEXT_SIZES.memo);
    page.ctaEnabled = document.getElementById("cmsCtaEnabledInput").checked;
    page.ctaLabel = document.getElementById("cmsCtaLabelInput").value.trim();
    page.ctaUrl = document.getElementById("cmsCtaUrlInput").value.trim();
    saveDeck();
    setActivePage(page.id, { scroll: false, sync: liveState.presentationMode });
}

function renderLiveStatus() {
    const isLive = Boolean(liveState.presentationMode);
    const front = document.getElementById("liveStatusLabel");
    const admin = document.getElementById("adminLiveStatus");
    front.textContent = isLive ? "Live中" : "自由閲覧";
    admin.textContent = isLive ? "Live中" : "待機中";
    front.classList.toggle("live", isLive);
    admin.classList.toggle("live", isLive);
}

function showQrDialog() {
    const viewerUrl = `${location.origin}${location.pathname}?view=preview`;
    document.getElementById("viewerUrlText").textContent = viewerUrl;
    const target = document.getElementById("qrCode");
    target.innerHTML = "";
    if (typeof qrcode === "function") {
        const qr = qrcode(0, "M");
        qr.addData(viewerUrl);
        qr.make();
        target.innerHTML = qr.createImgTag(7, 8, "SwipeCard閲覧URL");
    } else {
        target.textContent = "QRコードライブラリを読み込めませんでした。URLをご利用ください。";
    }
    qrDialog.showModal();
}

function updateActiveFromScroll() {
    if (!deckViewport.children.length) return;
    const viewportTop = deckViewport.getBoundingClientRect().top;
    const rows = [...deckViewport.querySelectorAll(".deck-row")];
    const closest = rows.reduce((best, row) => {
        const distance = Math.abs(row.getBoundingClientRect().top - viewportTop);
        return !best || distance < best.distance ? { row, distance } : best;
    }, null);
    const pageId = closest?.row.dataset.pageId;
    if (pageId && pageId !== activePageId) {
        activePageId = pageId;
        renderAdmin();
        fillEditorForm(pageId);
        if (liveState.presentationMode) saveLiveState({ currentPageId: pageId });
    }
}

function previewFontSize(size) {
    return Math.max(12, Math.round(Number(size || 12) * PREVIEW_FONT_SCALE));
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(Number(value) || min, min), max);
}

function shorten(value, maxLength) {
    const text = String(value || "").replaceAll("\n", " ");
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
}

document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) setView(viewButton.dataset.view);

    const rowButton = event.target.closest("[data-row-move]");
    if (rowButton) moveVertical(rowButton.dataset.row, rowButton.dataset.rowMove);

    const horizontalButton = event.target.closest("[data-horizontal-page]");
    if (horizontalButton?.dataset.horizontalPage) moveHorizontal(horizontalButton.dataset.horizontalPage);

    const adminPageButton = event.target.closest("[data-admin-page]");
    if (adminPageButton) setActivePage(adminPageButton.dataset.adminPage, { sync: liveState.presentationMode });
});

deckViewport.addEventListener("scroll", () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(updateActiveFromScroll, 90);
}, { passive: true });

document.getElementById("startLiveButton").addEventListener("click", () => {
    saveLiveState({ presentationMode: true, currentPageId: activePageId });
});

document.getElementById("endLiveButton").addEventListener("click", () => {
    saveLiveState({ presentationMode: false });
});

document.getElementById("openEditorButton").addEventListener("click", () => setView("editor"));
document.getElementById("backToAdminButton").addEventListener("click", () => setView("admin"));
document.getElementById("showQrButton").addEventListener("click", showQrDialog);
document.getElementById("closeQrButton").addEventListener("click", () => qrDialog.close());

document.getElementById("cmsPageSelect").addEventListener("change", (event) => {
    setActivePage(event.target.value, { scroll: false, sync: false });
});

document.getElementById("cmsBackgroundSelect").addEventListener("change", (event) => {
    document.getElementById("cmsBackgroundInput").value = event.target.value;
});

document.getElementById("applyStructureButton").addEventListener("click", () => {
    resizeDeck(
        document.getElementById("verticalRowsInput").value,
        document.getElementById("horizontalColumnsInput").value
    );
});

document.getElementById("saveCmsButton").addEventListener("click", saveCurrentPage);

document.getElementById("resetDemoButton").addEventListener("click", () => {
    if (!window.confirm("編集内容を消して初期デモに戻しますか？")) return;
    deck = structuredClone(demoDeck);
    activePageId = deck.pages[0].id;
    groupSelections = {};
    saveDeck();
    renderAll();
});

if (channel) {
    channel.addEventListener("message", (event) => {
        if (event.data.type === "live-updated") {
            liveState = event.data.state;
            if (liveState.presentationMode) {
                setActivePage(liveState.currentPageId, { sync: false });
            }
            renderLiveStatus();
        }
        if (event.data.type === "deck-updated") {
            deck = loadDeck();
            renderAll();
        }
    });
}

window.addEventListener("storage", (event) => {
    if (event.key === LIVE_KEY) {
        liveState = loadLiveState();
        if (liveState.presentationMode) setActivePage(liveState.currentPageId, { sync: false });
        renderLiveStatus();
    }
    if (event.key === STORAGE_KEY) {
        deck = loadDeck();
        renderAll();
    }
});

setView(currentView);
renderAll();
loadBackgroundCatalog();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
        // ローカルファイルで開いた場合などは登録できないため静かに無視する。
    });
}
