const STORAGE_KEY = "swipecard-live-demo-deck-v3";
const LIVE_KEY = "swipecard-live-demo-state-v3";
const channel = "BroadcastChannel" in window ? new BroadcastChannel("swipecard-live") : null;
const DEFAULT_TEXT_SIZES = {
    title: 114,
    body: 48,
    band: 60,
    memo: 48
};
const PREVIEW_FONT_SCALE = 0.38;
const backgroundOptions = [
    { label: "背景なし", value: "" }
];

const demoDeck = {
    id: "demo-deck",
    title: "SwipeCard Demo",
    pages: [
        {
            id: "fv",
            group: "1",
            label: "1",
            title: "0→1営業支援ツール",
            body: "名刺交換を営業の入口に変える\nスキルの見える化\n信用の見える化",
            band: "紙名刺や普通のプロフィールでは伝わらない\n実力と信頼を、その場で見せるための仕組みです。",
            memo: "SwipeCardは単なるWeb名刺ではない\n対面プレゼンのために",
            titleSize: DEFAULT_TEXT_SIZES.title,
            bodySize: DEFAULT_TEXT_SIZES.body,
            bandSize: DEFAULT_TEXT_SIZES.band,
            memoSize: DEFAULT_TEXT_SIZES.memo,
            ctaEnabled: true,
            ctaLabel: "詳しく見る",
            ctaUrl: "#",
            background: "",
            align: "top"
        },
        {
            id: "problem-image",
            group: "2",
            label: "2",
            title: "学びはあるのに\n見せる形がない",
            body: "講座を受けても\n卒業しても\nそれを仕事につながる形で\n見せられない人が多くいます",
            band: "受講直後の\n「何を見せれば仕事につながるのか分からない」\nそれを埋めるのがこのサービスの役目",
            memo: "実績が少ない\n人ほど\n不安が大きい",
            titleSize: DEFAULT_TEXT_SIZES.title,
            bodySize: DEFAULT_TEXT_SIZES.body,
            bandSize: DEFAULT_TEXT_SIZES.band,
            memoSize: DEFAULT_TEXT_SIZES.memo,
            ctaEnabled: false,
            ctaLabel: "",
            ctaUrl: "",
            background: "",
            align: "top"
        },
        {
            id: "problem-a",
            group: "3",
            label: "3-1",
            title: "紙名刺だけでは伝わらない",
            body: "実力・信頼・学びの履歴は、紙面だけでは残りません。\n対面で見せながら説明できる入口が必要です。",
            band: "",
            memo: "",
            titleSize: DEFAULT_TEXT_SIZES.title,
            bodySize: DEFAULT_TEXT_SIZES.body,
            bandSize: DEFAULT_TEXT_SIZES.band,
            memoSize: DEFAULT_TEXT_SIZES.memo,
            ctaEnabled: true,
            ctaLabel: "次の視点へ",
            ctaUrl: "#",
            background: "",
            align: "top"
        },
        {
            id: "problem-b",
            group: "3",
            label: "3-2",
            title: "横展開はタップで迷わせない",
            body: "横スワイプは不安定になりやすいため使いません。\n大きなボタンで、補足ページへ明確に移動します。",
            band: "",
            memo: "",
            titleSize: DEFAULT_TEXT_SIZES.title,
            bodySize: DEFAULT_TEXT_SIZES.body,
            bandSize: DEFAULT_TEXT_SIZES.band,
            memoSize: DEFAULT_TEXT_SIZES.memo,
            ctaEnabled: true,
            ctaLabel: "理解しました",
            ctaUrl: "#",
            background: "",
            align: "top"
        },
        {
            id: "proof",
            group: "4",
            label: "4",
            title: "学びと評価を営業資産に変える",
            body: "名刺交換後に、実績・評価・次の行動を1つのURLで見せます。\n相手のスマホでも軽く表示できる構成を優先します。",
            band: "",
            memo: "",
            titleSize: DEFAULT_TEXT_SIZES.title,
            bodySize: DEFAULT_TEXT_SIZES.body,
            bandSize: DEFAULT_TEXT_SIZES.band,
            memoSize: DEFAULT_TEXT_SIZES.memo,
            ctaEnabled: true,
            ctaLabel: "相談する",
            ctaUrl: "https://example.com",
            background: "",
            align: "bottom"
        },
        {
            id: "cta",
            group: "4",
            label: "4-2",
            title: "その場で次の約束へ",
            body: "QR / NFC / URL共有から、フォーム・電話・vCard保存へ。\nLive終了後は自由閲覧に戻ります。",
            band: "",
            memo: "",
            titleSize: DEFAULT_TEXT_SIZES.title,
            bodySize: DEFAULT_TEXT_SIZES.body,
            bandSize: DEFAULT_TEXT_SIZES.band,
            memoSize: DEFAULT_TEXT_SIZES.memo,
            ctaEnabled: true,
            ctaLabel: "vCardを保存",
            ctaUrl: "#",
            background: "",
            align: "bottom"
        }
    ]
};

let deck = loadDeck();
let liveState = loadLiveState();
let mode = new URLSearchParams(location.search).get("mode") || "preview";
let activePageId = liveState.currentPageId || deck.pages[0].id;

const deckViewport = document.getElementById("deckViewport");
const livePanel = document.getElementById("livePanel");
const cmsPanel = document.getElementById("cmsPanel");
const liveStatusLabel = document.getElementById("liveStatusLabel");
const deckTitleLabel = document.getElementById("deckTitleLabel");
const viewerUrlText = document.getElementById("viewerUrlText");

function loadDeck() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(demoDeck);
    try {
        return JSON.parse(saved);
    } catch {
        return structuredClone(demoDeck);
    }
}

function saveDeck() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    broadcast({ type: "deck-updated" });
}

function loadLiveState() {
    const saved = localStorage.getItem(LIVE_KEY);
    if (!saved) {
        return {
            deckId: demoDeck.id,
            currentPageId: demoDeck.pages[0].id,
            presentationMode: false,
            updatedAt: new Date().toISOString()
        };
    }
    try {
        return JSON.parse(saved);
    } catch {
        return {
            deckId: demoDeck.id,
            currentPageId: demoDeck.pages[0].id,
            presentationMode: false,
            updatedAt: new Date().toISOString()
        };
    }
}

function saveLiveState(nextState) {
    liveState = {
        ...liveState,
        ...nextState,
        updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LIVE_KEY, JSON.stringify(liveState));
    broadcast({ type: "live-updated", state: liveState });
    updateLiveStatus();
}

function broadcast(message) {
    if (channel) channel.postMessage(message);
}

function groupedPages() {
    return deck.pages.reduce((groups, page) => {
        if (!groups.has(page.group)) groups.set(page.group, []);
        groups.get(page.group).push(page);
        return groups;
    }, new Map());
}

function currentPageForGroup(pages) {
    if (pages.some((page) => page.id === activePageId)) {
        return pages.find((page) => page.id === activePageId);
    }
    return pages[0];
}

function renderDeck() {
    deckTitleLabel.textContent = deck.title;
    const groups = groupedPages();
    deckViewport.innerHTML = Array.from(groups.entries()).map(([groupId, pages], groupIndex) => {
        const page = currentPageForGroup(pages);
        const hasBackground = Boolean(page.background);
        const style = hasBackground ? `style="background-image: url('${escapeAttribute(page.background)}')"` : "";
        const sideNav = pages.length > 1 ? renderSideNav(groupId, pages, page.id) : "";
        const verticalHint = groupIndex < groups.size - 1 ? `<div class="vertical-hint">下へスワイプ</div>` : "";
        const hasCopy = Boolean(page.title || page.body || page.band || page.memo || (page.ctaEnabled !== false && page.ctaLabel));
        const titleStyle = `style="font-size: ${previewFontSize(page.titleSize || DEFAULT_TEXT_SIZES.title)}px"`;
        const bodyStyle = `style="font-size: ${previewFontSize(page.bodySize || DEFAULT_TEXT_SIZES.body)}px"`;
        const bandStyle = `style="font-size: ${previewFontSize(page.bandSize || DEFAULT_TEXT_SIZES.band)}px"`;
        const memoStyle = `style="font-size: ${previewFontSize(page.memoSize || DEFAULT_TEXT_SIZES.memo)}px"`;

        return `
            <article class="deck-row" data-group="${escapeAttribute(groupId)}" data-active-page="${escapeAttribute(page.id)}">
                <section class="deck-card ${hasBackground ? "has-bg" : ""}" ${style}>
                    ${hasCopy ? `
                        <div class="deck-copy ${page.align === "bottom" ? "align-bottom" : ""}">
                            ${page.title ? `<h2 ${titleStyle}>${escapeHtml(page.title)}</h2>` : ""}
                            ${page.body ? `<p class="deck-body" ${bodyStyle}>${escapeHtml(page.body)}</p>` : ""}
                            ${page.memo ? `<div class="deck-memo" ${memoStyle}>${escapeHtml(page.memo)}</div>` : ""}
                            ${page.band ? `<div class="deck-band" ${bandStyle}>${escapeHtml(page.band)}</div>` : ""}
                            ${page.ctaEnabled !== false && page.ctaLabel ? `<a class="cta-link" href="${escapeAttribute(page.ctaUrl || "#")}">${escapeHtml(page.ctaLabel)}</a>` : ""}
                        </div>
                    ` : ""}
                    ${sideNav}
                    ${verticalHint}
                </section>
            </article>
        `;
    }).join("");
    renderPageControls();
    renderCmsOptions();
    updateLiveStatus();
}

function renderSideNav(groupId, pages, activeId) {
    const index = pages.findIndex((page) => page.id === activeId);
    const prev = pages[index - 1];
    const next = pages[index + 1];
    return `
        <div class="side-nav" aria-label="横展開ページ移動">
            <button type="button" ${prev ? "" : "disabled"} data-jump-page="${prev ? escapeAttribute(prev.id) : ""}">← 前の補足</button>
            <button type="button" ${next ? "" : "disabled"} data-jump-page="${next ? escapeAttribute(next.id) : ""}">次の補足 →</button>
        </div>
    `;
}

function renderPageControls() {
    const pageControlList = document.getElementById("pageControlList");
    if (!pageControlList) return;

    pageControlList.innerHTML = deck.pages.map((page) => `
        <button type="button" class="${page.id === activePageId ? "active" : ""}" data-live-page="${escapeAttribute(page.id)}">
            <span>${escapeHtml(page.label)}</span>
            <strong>${escapeHtml(page.title)}</strong>
        </button>
    `).join("");
}

function renderCmsOptions() {
    const select = document.getElementById("cmsPageSelect");
    if (!select) return;
    renderBackgroundOptions();
    const previous = select.value || activePageId;
    select.innerHTML = deck.pages.map((page) => `<option value="${escapeAttribute(page.id)}">${escapeHtml(page.label)} ${escapeHtml(page.title)}</option>`).join("");
    select.value = deck.pages.some((page) => page.id === previous) ? previous : deck.pages[0].id;
    fillCmsForm(select.value);
}

function renderBackgroundOptions() {
    const select = document.getElementById("cmsBackgroundSelect");
    if (!select || select.options.length) return;
    select.innerHTML = backgroundOptions.map((option) => `<option value="${escapeAttribute(option.value)}">${escapeHtml(option.label)}</option>`).join("");
}

function fillCmsForm(pageId) {
    const page = deck.pages.find((item) => item.id === pageId);
    if (!page) return;
    document.getElementById("cmsGroupInput").value = page.group || "";
    document.getElementById("cmsLabelInput").value = page.label || "";
    const backgroundSelect = document.getElementById("cmsBackgroundSelect");
    if (backgroundSelect) {
        const hasOption = backgroundOptions.some((option) => option.value === (page.background || ""));
        backgroundSelect.value = hasOption ? (page.background || "") : "";
    }
    document.getElementById("cmsBackgroundInput").value = page.background || "";
    document.getElementById("cmsTitleInput").value = page.title || "";
    document.getElementById("cmsTitleSizeInput").value = page.titleSize || DEFAULT_TEXT_SIZES.title;
    document.getElementById("cmsBodySizeInput").value = page.bodySize || DEFAULT_TEXT_SIZES.body;
    document.getElementById("cmsBodyInput").value = page.body || "";
    document.getElementById("cmsBandInput").value = page.band || "";
    document.getElementById("cmsBandSizeInput").value = page.bandSize || DEFAULT_TEXT_SIZES.band;
    document.getElementById("cmsMemoInput").value = page.memo || "";
    document.getElementById("cmsMemoSizeInput").value = page.memoSize || DEFAULT_TEXT_SIZES.memo;
    document.getElementById("cmsCtaEnabledInput").checked = page.ctaEnabled !== false;
    document.getElementById("cmsCtaLabelInput").value = page.ctaLabel || "";
    document.getElementById("cmsCtaUrlInput").value = page.ctaUrl || "";
}

function setMode(nextMode) {
    mode = nextMode;
    document.querySelectorAll(".mode-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.mode === mode);
    });
    livePanel.hidden = mode !== "live";
    cmsPanel.hidden = mode !== "cms";
}

function setActivePage(pageId, shouldSync = false) {
    const page = deck.pages.find((item) => item.id === pageId);
    if (!page) return;
    activePageId = page.id;
    renderDeck();
    requestAnimationFrame(() => {
        const row = deckViewport.querySelector(`[data-group="${CSS.escape(page.group)}"]`);
        if (row) row.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    if (shouldSync) {
        saveLiveState({ currentPageId: page.id, presentationMode: true });
    }
}

function moveBy(delta) {
    const currentIndex = deck.pages.findIndex((page) => page.id === activePageId);
    const nextPage = deck.pages[Math.min(Math.max(currentIndex + delta, 0), deck.pages.length - 1)];
    if (nextPage) setActivePage(nextPage.id, true);
}

function updateLiveStatus() {
    liveStatusLabel.textContent = liveState.presentationMode ? "Live中" : "自由閲覧";
    liveStatusLabel.classList.toggle("live", liveState.presentationMode);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
}

function previewFontSize(size) {
    return Math.max(12, Math.round(Number(size) * PREVIEW_FONT_SCALE));
}

document.addEventListener("click", (event) => {
    const jumpButton = event.target.closest("[data-jump-page]");
    if (jumpButton && jumpButton.dataset.jumpPage) {
        setActivePage(jumpButton.dataset.jumpPage, liveState.presentationMode);
    }

    const liveButton = event.target.closest("[data-live-page]");
    if (liveButton) {
        setActivePage(liveButton.dataset.livePage, true);
    }

    const modeButton = event.target.closest(".mode-tab");
    if (modeButton) {
        setMode(modeButton.dataset.mode);
    }
});

document.getElementById("startLiveButton").addEventListener("click", () => {
    saveLiveState({ presentationMode: true, currentPageId: activePageId });
});

document.getElementById("endLiveButton").addEventListener("click", () => {
    saveLiveState({ presentationMode: false });
});

document.getElementById("prevPageButton").addEventListener("click", () => moveBy(-1));
document.getElementById("nextPageButton").addEventListener("click", () => moveBy(1));
document.getElementById("firstPageButton").addEventListener("click", () => setActivePage(deck.pages[0].id, true));

document.getElementById("cmsPageSelect").addEventListener("change", (event) => {
    fillCmsForm(event.target.value);
    setActivePage(event.target.value, false);
});

document.getElementById("cmsBackgroundSelect").addEventListener("change", (event) => {
    document.getElementById("cmsBackgroundInput").value = event.target.value;
});

document.getElementById("saveCmsButton").addEventListener("click", () => {
    const pageId = document.getElementById("cmsPageSelect").value;
    const page = deck.pages.find((item) => item.id === pageId);
    if (!page) return;
    page.group = document.getElementById("cmsGroupInput").value.trim() || page.group;
    page.label = document.getElementById("cmsLabelInput").value.trim() || page.label;
    page.background = document.getElementById("cmsBackgroundInput").value.trim();
    page.title = document.getElementById("cmsTitleInput").value.trim();
    page.titleSize = Number(document.getElementById("cmsTitleSizeInput").value || DEFAULT_TEXT_SIZES.title);
    page.bodySize = Number(document.getElementById("cmsBodySizeInput").value || DEFAULT_TEXT_SIZES.body);
    page.body = document.getElementById("cmsBodyInput").value.trim();
    page.band = document.getElementById("cmsBandInput").value.trim();
    page.bandSize = Number(document.getElementById("cmsBandSizeInput").value || DEFAULT_TEXT_SIZES.band);
    page.memo = document.getElementById("cmsMemoInput").value.trim();
    page.memoSize = Number(document.getElementById("cmsMemoSizeInput").value || DEFAULT_TEXT_SIZES.memo);
    page.ctaEnabled = document.getElementById("cmsCtaEnabledInput").checked;
    page.ctaLabel = document.getElementById("cmsCtaLabelInput").value.trim();
    page.ctaUrl = document.getElementById("cmsCtaUrlInput").value.trim();
    saveDeck();
    setActivePage(page.id, liveState.presentationMode);
});

document.getElementById("addPageButton").addEventListener("click", () => {
    const currentPage = deck.pages.find((item) => item.id === document.getElementById("cmsPageSelect").value) || deck.pages.at(-1);
    const nextNumber = deck.pages.length + 1;
    const newPage = {
        id: `page-${Date.now()}`,
        group: currentPage ? String(Number(currentPage.group || nextNumber) + 1) : String(nextNumber),
        label: String(nextNumber),
        title: "新しいページ",
        body: "ここに本文を入力します。",
        band: "",
        memo: "",
        titleSize: DEFAULT_TEXT_SIZES.title,
        bodySize: DEFAULT_TEXT_SIZES.body,
        bandSize: DEFAULT_TEXT_SIZES.band,
        memoSize: DEFAULT_TEXT_SIZES.memo,
        ctaEnabled: false,
        ctaLabel: "",
        ctaUrl: "",
        background: "",
        align: "top"
    };
    deck.pages.push(newPage);
    saveDeck();
    renderDeck();
    document.getElementById("cmsPageSelect").value = newPage.id;
    fillCmsForm(newPage.id);
    setActivePage(newPage.id, liveState.presentationMode);
});

document.getElementById("duplicatePageButton").addEventListener("click", () => {
    const source = deck.pages.find((item) => item.id === document.getElementById("cmsPageSelect").value);
    if (!source) return;
    const copy = {
        ...structuredClone(source),
        id: `page-${Date.now()}`,
        label: `${source.label}-copy`,
        title: source.title ? `${source.title} コピー` : ""
    };
    const sourceIndex = deck.pages.findIndex((item) => item.id === source.id);
    deck.pages.splice(sourceIndex + 1, 0, copy);
    saveDeck();
    renderDeck();
    document.getElementById("cmsPageSelect").value = copy.id;
    fillCmsForm(copy.id);
    setActivePage(copy.id, liveState.presentationMode);
});

document.getElementById("deletePageButton").addEventListener("click", () => {
    if (deck.pages.length <= 1) return;
    const pageId = document.getElementById("cmsPageSelect").value;
    const index = deck.pages.findIndex((item) => item.id === pageId);
    if (index < 0) return;
    deck.pages.splice(index, 1);
    const nextPage = deck.pages[Math.max(0, index - 1)];
    saveDeck();
    renderDeck();
    setActivePage(nextPage.id, liveState.presentationMode);
});

document.getElementById("resetDemoButton").addEventListener("click", () => {
    deck = structuredClone(demoDeck);
    saveDeck();
    setActivePage(deck.pages[0].id, false);
});

if (channel) {
    channel.addEventListener("message", (event) => {
        if (event.data.type === "live-updated") {
            liveState = event.data.state;
            if (liveState.presentationMode) setActivePage(liveState.currentPageId, false);
            updateLiveStatus();
        }
        if (event.data.type === "deck-updated") {
            deck = loadDeck();
            renderDeck();
        }
    });
}

window.addEventListener("storage", (event) => {
    if (event.key === LIVE_KEY) {
        liveState = loadLiveState();
        if (liveState.presentationMode) setActivePage(liveState.currentPageId, false);
        updateLiveStatus();
    }
    if (event.key === STORAGE_KEY) {
        deck = loadDeck();
        renderDeck();
    }
});

viewerUrlText.textContent = `${location.origin}${location.pathname}?mode=preview`;
setMode(mode);
renderDeck();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
        // ローカルファイルで開いた場合などは登録できないため、静かに無視する。
    });
}
