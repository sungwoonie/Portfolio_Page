const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 스크롤 등장 애니메이션. 화면 밖으로 나가면 되돌려서 다시 볼 때도 움직인다
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => entry.target.classList.toggle('visible', entry.isIntersecting));
}, { threshold: 0.02 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// 상단 내비: 지금 읽는 섹션을 표시한다. 화면 위쪽 40% 지점을 지나는 섹션이 지금 섹션이다
const navLinks = new Map(
    [...document.querySelectorAll('.topbar ul a')].map(a => [a.getAttribute('href').slice(1), a])
);
const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a, id) => a.classList.toggle('active', id === entry.target.id));
    });
}, { rootMargin: '-40% 0px -59% 0px' });
document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));

// 커리어 경력 자동 계산 (기타 이력과 스튜디오 행이 섞이지 않도록 .career-jobs 범위로 한정)
(function calcCareerDuration() {
    const items = document.querySelectorAll('.career-jobs .job .period');
    let totalMonths = 0;
    items.forEach(el => {
        const parts = el.textContent.trim().split('~').map(s => s.trim());
        const [startY, startM] = parts[0].split('.').map(Number);
        let endY, endM;
        if (parts[1] === '현재') {
            const now = new Date();
            endY = now.getFullYear();
            endM = now.getMonth() + 2; // 이번 달 포함
        } else {
            [endY, endM] = parts[1].split('.').map(Number);
        }
        totalMonths += (endY - startY) * 12 + (endM - startM);
    });
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    let label = '';
    if (years > 0) label += years + '년 ';
    if (months > 0) label += months + '개월';
    if (!label) label = '0개월';
    document.getElementById('career-duration').textContent = label.trim();
})();

// ---------- GitHub 잔디 ----------
// 개인 계정과 스튜디오 계정의 공개 잔디를 받아 날짜별로 합친 뒤 페이지 색으로 다시 그린다.
// 한쪽이 실패하면 받은 쪽만 그리고, 둘 다 실패하면 링크만 남긴다
const GH_ACCOUNTS = ['sungwoonie', 'StarCloudgames-Official'];

async function fetchContributions(user) {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return data.contributions || [];
}

// 0 은 빈 칸, 나머지는 기여가 있던 날들의 사분위로 4단계. 하루 몰아친 날 때문에 나머지가 다 옅어지지 않게 한다
function levelScale(counts) {
    const nz = counts.filter(c => c > 0).sort((a, b) => a - b);
    const q = p => nz[Math.min(nz.length - 1, Math.floor(nz.length * p))] || 0;
    const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
    return c => (!c ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);
}

(async function drawContributions() {
    const graph = document.getElementById('gh-graph');
    const total = document.getElementById('gh-total');
    if (!graph) return;
    const results = await Promise.allSettled(GH_ACCOUNTS.map(fetchContributions));
    const byDate = new Map();
    results.forEach(r => {
        if (r.status !== 'fulfilled') return;
        r.value.forEach(d => byDate.set(d.date, (byDate.get(d.date) || 0) + (d.count || 0)));
    });
    if (!byDate.size) {
        graph.closest('.gh-scroll').hidden = true;
        document.querySelector('.gh-legend').hidden = true;
        total.textContent = '-';
        return;
    }
    const days = [...byDate.entries()].sort((x, y) => (x[0] < y[0] ? -1 : 1));
    const levelOf = levelScale(days.map(([, c]) => c));
    // 첫 주는 요일만큼 빈 칸을 채워 일요일부터 시작하게 한다
    const pad = new Date(days[0][0] + 'T00:00:00').getDay();
    let html = '<i class="gh-pad"></i>'.repeat(pad);
    let sum = 0;
    for (const [date, count] of days) {
        sum += count;
        html += `<i class="gh-l${levelOf(count)}" title="${date} · ${count}"></i>`;
    }
    graph.innerHTML = html;
    total.textContent = sum.toLocaleString('ko-KR');
    // 좁은 화면에선 최근 쪽이 먼저 보이게 오른쪽 끝으로 민다
    const scroller = graph.parentElement;
    scroller.scrollLeft = scroller.scrollWidth;
})();

// ---------- 프로젝트 탭 ----------
// 영상은 탭이 보이고 카드가 화면 안에 있을 때만 받아서 재생한다. 안 보이는 영상은 멈춘다
function panelVideos(panel) {
    return panel ? [...panel.querySelectorAll('.game-media video')] : [];
}

function playPanel(panel) {
    if (reduceMotion) return;
    panelVideos(panel).forEach(v => {
        if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
        v.play().catch(() => {});
    });
}

function pausePanel(panel) {
    panelVideos(panel).forEach(v => v.pause());
}

const visibleShowcases = new Set();

function activePanel(showcase) {
    return showcase.querySelector('.game:not([hidden])');
}

function selectTab(showcase, targetId) {
    showcase.querySelectorAll('.tab').forEach(tab => {
        const on = tab.dataset.target === targetId;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    showcase.querySelectorAll('.game').forEach(panel => {
        const on = panel.id === targetId;
        if (on) {
            panel.hidden = false;
            if (visibleShowcases.has(showcase)) playPanel(panel);
        } else {
            pausePanel(panel);
            panel.hidden = true;
        }
    });
}

const showcaseSpy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const sc = entry.target;
        if (entry.isIntersecting) {
            visibleShowcases.add(sc);
            playPanel(activePanel(sc));
        } else {
            visibleShowcases.delete(sc);
            pausePanel(activePanel(sc));
        }
    });
}, { threshold: 0.25 });

document.querySelectorAll('.showcase').forEach(sc => {
    showcaseSpy.observe(sc);
    sc.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => selectTab(sc, tab.dataset.target));
    });
    // 좌우 화살표로 탭 이동
    sc.querySelector('.tabs').addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const tabs = [...sc.querySelectorAll('.tab')];
        const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        selectTab(sc, next.dataset.target);
        next.focus();
    });
});

// 출시작 아이콘, 경력의 게임 칩: 해당 탭을 열고 카드로 내려간다
function openGame(id, smooth = true) {
    const panel = document.getElementById(id);
    if (!panel || !panel.classList.contains('game')) return false;
    const sc = panel.closest('.showcase');
    selectTab(sc, id);
    sc.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'auto', block: 'start' });
    return true;
}

document.querySelectorAll('a[data-tab]').forEach(a => {
    a.addEventListener('click', (e) => {
        if (openGame(a.dataset.tab)) {
            e.preventDefault();
            history.replaceState(null, '', '#' + a.dataset.tab);
        }
    });
});

if (location.hash.startsWith('#g-')) openGame(location.hash.slice(1), false);

// ---------- 모달 ----------
const overlay = document.getElementById('projectOverlay');
const modal = document.getElementById('projectModal');

// body 만 잠그면 html 이 스크롤러라 페이지가 계속 밀린다. 스크롤 위치를 고정해 되돌린다
let lockedScrollY = 0;
function lockScroll(on) {
    if (on) {
        lockedScrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${lockedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
    } else {
        // html 에 scroll-behavior: smooth 가 걸려 있어 그냥 되돌리면
        // 제자리로 굴러가는 게 눈에 보인다. 복원 동안만 끈다
        const root = document.documentElement;
        const prev = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, lockedScrollY);
        root.style.scrollBehavior = prev;
    }
}

const previewSrc = (folder, i) => `Resources/${folder}/Preview_${i}.png`;
let carouselIndex = 0;
let carouselTotal = 0;

function buildPreviewCarousel(folder, count) {
    const container = modal.querySelector('.modal-preview-carousel');
    carouselIndex = 0;
    carouselTotal = 0;
    if (!folder || count <= 0) {
        container.innerHTML = '';
        return;
    }

    let imagesHtml = '';
    for (let i = 1; i <= count; i++) {
        imagesHtml += `<img src="${previewSrc(folder, i)}" alt="Preview ${i}" draggable="false">`;
    }

    container.innerHTML = `
        <div class="preview-carousel">
            <button class="preview-carousel-btn prev" aria-label="이전" onclick="event.stopPropagation(); moveCarousel(-1)">&#8249;</button>
            <div class="preview-carousel-track">${imagesHtml}</div>
            <button class="preview-carousel-btn next" aria-label="다음" onclick="event.stopPropagation(); moveCarousel(1)">&#8250;</button>
            <span class="preview-carousel-count"></span>
        </div>
        <div class="preview-carousel-dots">
            ${Array.from({ length: count }, (_, i) => `<button class="dot${i === 0 ? ' active' : ''}" aria-label="${i + 1}번" onclick="event.stopPropagation(); goToSlide(${i})"></button>`).join('')}
        </div>
    `;

    carouselTotal = count;
    goToSlide(0);
}

function moveCarousel(dir) {
    goToSlide(carouselIndex + dir);
}

function goToSlide(index) {
    if (index < 0 || index >= carouselTotal) return;
    carouselIndex = index;
    const track = modal.querySelector('.preview-carousel-track');
    if (track) track.style.transform = `translateX(-${carouselIndex * 100}%)`;

    const prevBtn = modal.querySelector('.preview-carousel-btn.prev');
    const nextBtn = modal.querySelector('.preview-carousel-btn.next');
    if (prevBtn) prevBtn.classList.toggle('disabled', carouselIndex === 0);
    if (nextBtn) nextBtn.classList.toggle('disabled', carouselIndex === carouselTotal - 1);
    modal.querySelectorAll('.preview-carousel-dots .dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === carouselIndex);
    });
    const count = modal.querySelector('.preview-carousel-count');
    if (count) count.textContent = `${String(carouselIndex + 1).padStart(2, '0')} / ${String(carouselTotal).padStart(2, '0')}`;
}

function openModal(card) {
    const isAi = card.classList.contains('ai-card');
    // AI 카드는 앱 아이콘이 아니라 화면 캡처를 머리에 둔다
    modal.classList.toggle('ai-mode', isAi);
    // 개발 중 카드는 아이콘이 없다. 머리엔 제목만, 화면은 본문의 스크린샷 줄로
    modal.classList.toggle('wip-mode', card.classList.contains('wip-card'));

    const img = card.querySelector('.project-thumb img');
    const meta = card.querySelector('.game-meta, .ai-meta, .wip-meta');
    const detailsEl = card.querySelector('.project-details .project-details-inner');

    modal.querySelector('.modal-thumb img').src = img.src;
    modal.querySelector('.modal-thumb img').alt = img.alt;
    modal.querySelector('.modal-head-text h3').textContent = card.querySelector('h3').textContent;
    modal.querySelector('.modal-meta').textContent = meta ? meta.textContent : '';
    modal.querySelector('.modal-desc').textContent = card.querySelector('.project-info > p').textContent;
    // AI 카드는 비공개 저장소라 스토어 링크가 없다. 없으면 빈 칸으로 둔다
    modal.querySelector('.modal-info .tags').innerHTML = card.querySelector('.project-info .tags')?.innerHTML || '';
    modal.querySelector('.modal-info .store-links').innerHTML = card.querySelector('.project-info .store-links')?.innerHTML || '';

    // 영상은 본문에서 떼어 위로 모은다. 여러 개면 data-title 을 캡션으로 단다
    const body = document.createElement('div');
    body.innerHTML = detailsEl ? detailsEl.innerHTML : '';
    const videos = [...body.querySelectorAll('video')];
    videos.forEach(v => v.remove());
    modal.querySelector('.modal-video').innerHTML = videos.map(v => {
        const caption = v.dataset.title ? `<figcaption>${v.dataset.title}</figcaption>` : '';
        return `<figure><video src="${v.getAttribute('src')}" controls preload="metadata" playsinline></video>${caption}</figure>`;
    }).join('');
    modal.querySelector('.modal-details').innerHTML = body.innerHTML;

    buildPreviewCarousel(card.dataset.folder || '', parseInt(card.dataset.previews, 10) || 0);

    // 모달이 떠 있는 동안 뒤 카드의 미리보기 영상은 멈춘다
    document.querySelectorAll('.game-media video').forEach(v => v.pause());

    modal.querySelector('.modal-scroll').scrollTop = 0;
    overlay.classList.add('active');
    modal.classList.add('active');
    lockScroll(true);
}

function closeModal() {
    if (!modal.classList.contains('active')) return;
    modal.querySelectorAll('video').forEach(video => video.pause());
    overlay.classList.remove('active');
    modal.classList.remove('active');
    modal.classList.remove('ai-mode', 'wip-mode');
    lockScroll(false);
    visibleShowcases.forEach(sc => playPanel(activePanel(sc)));
}

// 게임 카드는 미디어나 상세 보기 버튼, AI·개발 중 카드는 어디를 눌러도 연다. 스토어 링크는 그대로 새 탭으로
document.querySelectorAll('.game').forEach(card => {
    card.querySelector('.game-media').addEventListener('click', () => openModal(card));
    card.querySelector('.more-btn').addEventListener('click', () => openModal(card));
});
document.querySelectorAll('.ai-card, .wip-card').forEach(card => {
    card.addEventListener('click', () => openModal(card));
});

// 닫기: 버튼 · 배경 · Esc
modal.querySelector('.modal-close').addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);
// 모달 컨테이너가 화면 전체를 덮으므로 여백을 눌렀을 때도 닫아야 한다.
// 내용 안을 누른 건 e.target 이 자식이라 걸리지 않는다
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (!modal.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') moveCarousel(-1);
    if (e.key === 'ArrowRight') moveCarousel(1);
});
