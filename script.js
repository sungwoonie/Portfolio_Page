// 스크롤 등장 애니메이션
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else {
            entry.target.classList.remove('visible');
        }
    });
}, { threshold: 0.05 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// 모바일 메뉴
const navList = document.querySelector('nav ul');
document.querySelector('.menu-toggle').addEventListener('click', () => {
    navList.classList.toggle('open');
});
navList.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navList.classList.remove('open'));
});

// 커리어 경력 자동 계산 (기타 이력 항목이 섞이지 않도록 .career-jobs 범위로 한정)
(function calcCareerDuration() {
    const items = document.querySelectorAll('.career-jobs .career-item .period');
    let totalMonths = 0;
    items.forEach(el => {
        const text = el.textContent.trim();
        const parts = text.split('~').map(s => s.trim());
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

// Project modal
const overlay = document.getElementById('projectOverlay');
const modal = document.getElementById('projectModal');

let carouselIndex = 0;
let carouselTotal = 0;

function buildPreviewCarousel(folder, count) {
    const container = modal.querySelector('.modal-preview-carousel');
    if (!folder || count <= 0) {
        container.innerHTML = '';
        return;
    }

    let imagesHtml = '';
    for (let i = 1; i <= count; i++) {
        imagesHtml += `<img src="Resources/${folder}/Preview_${i}.png" alt="Preview ${i}" draggable="false">`;
    }

    container.innerHTML = `
        <div class="preview-carousel">
            <button class="preview-carousel-btn prev" onclick="event.stopPropagation(); moveCarousel(-1)">&#8249;</button>
            <div class="preview-carousel-track">${imagesHtml}</div>
            <button class="preview-carousel-btn next" onclick="event.stopPropagation(); moveCarousel(1)">&#8250;</button>
            <div class="preview-carousel-dots">
                ${Array.from({ length: count }, (_, i) => `<button class="dot${i === 0 ? ' active' : ''}" onclick="event.stopPropagation(); goToSlide(${i})"></button>`).join('')}
            </div>
        </div>
    `;

    carouselIndex = 0;
    carouselTotal = count;
    updateCarouselButtons();
}

function moveCarousel(dir) {
    goToSlide(carouselIndex + dir);
}

function goToSlide(index) {
    if (index < 0 || index >= carouselTotal) return;
    carouselIndex = index;
    const track = modal.querySelector('.preview-carousel-track');
    if (track) {
        track.style.transform = `translateX(-${carouselIndex * 100}%)`;
    }
    updateCarouselButtons();
}

function updateCarouselButtons() {
    const prevBtn = modal.querySelector('.preview-carousel-btn.prev');
    const nextBtn = modal.querySelector('.preview-carousel-btn.next');
    if (prevBtn) prevBtn.classList.toggle('disabled', carouselIndex === 0);
    if (nextBtn) nextBtn.classList.toggle('disabled', carouselIndex === carouselTotal - 1);

    const dots = modal.querySelectorAll('.preview-carousel-dots .dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === carouselIndex);
    });
}

function openModal(card) {
    modal.classList.remove('source-video-mode');
    // 카드에서 데이터 추출
    const img = card.querySelector('.project-thumb img');
    const title = card.querySelector('.project-info h3').textContent;
    const desc = card.querySelector('.project-info > p').textContent;
    const tags = card.querySelector('.project-info .tags').innerHTML;
    const links = card.querySelector('.project-info .store-links').innerHTML;
    const detailsEl = card.querySelector('.project-details .project-details-inner');

    // 모달에 데이터 삽입
    modal.querySelector('.modal-thumb img').src = img.src;
    modal.querySelector('.modal-thumb img').alt = img.alt;
    modal.querySelector('.modal-info h3').textContent = title;
    modal.querySelector('.modal-info > p').textContent = desc;
    modal.querySelector('.modal-info .tags').innerHTML = tags;
    modal.querySelector('.modal-info .store-links').innerHTML = links;

    // 동영상을 별도 컨테이너에 분리
    const videoContainer = modal.querySelector('.modal-video');
    const sourceVideo = detailsEl.querySelector('video');
    if (sourceVideo) {
        videoContainer.innerHTML = `<video src="${sourceVideo.src}" controls preload="metadata" playsinline></video>`;
        videoContainer.style.display = '';
    } else {
        videoContainer.innerHTML = '';
        videoContainer.style.display = 'none';
    }

    // 동영상 제외한 나머지 상세 내용 삽입
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = detailsEl.innerHTML;
    const tempVideo = tempDiv.querySelector('video');
    if (tempVideo) tempVideo.remove();
    modal.querySelector('.modal-details').innerHTML = tempDiv.innerHTML;

    // 프리뷰 이미지 캐러셀 빌드
    const folder = card.dataset.folder || '';
    const previews = parseInt(card.dataset.previews) || 0;
    buildPreviewCarousel(folder, previews);

    // 모달 열기
    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

const SOURCE_VIDEO_EXTENSIONS = ['mov', 'mp4', 'webm'];
const MAX_SOURCE_PREVIEW_VIDEOS = 30;
const SOURCE_VIDEO_PREFIX_PATTERN = /^PreviewVideo_(\d+)(?:_(.+))?\.[^.]+$/i;

function videoResourceExists(url) {
    return new Promise(resolve => {
        const video = document.createElement('video');
        let settled = false;

        const finish = exists => {
            if (settled) return;
            settled = true;
            video.removeAttribute('src');
            video.load();
            resolve(exists);
        };

        video.preload = 'metadata';
        video.muted = true;
        video.onloadedmetadata = () => finish(true);
        video.oncanplay = () => finish(true);
        video.onerror = () => finish(false);
        video.src = url;
        video.load();

        setTimeout(() => finish(false), 2500);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function findSourcePreviewVideos(card) {
    const projectName = card.dataset.project;
    const configuredVideos = card.dataset.previewVideoFiles;
    if (configuredVideos) {
        return configuredVideos.split(',')
            .map(fileName => fileName.trim())
            .filter(Boolean)
            .map(fileName => {
                const match = fileName.match(SOURCE_VIDEO_PREFIX_PATTERN);
                return {
                    index: match ? parseInt(match[1], 10) : 0,
                    title: match && match[2] ? match[2] : fileName.replace(/\.[^.]+$/, ''),
                    url: `Resources/Git/${projectName}/${fileName}`
                };
            })
            .sort((a, b) => a.index - b.index);
    }

    const videos = [];
    for (let i = 1; i <= MAX_SOURCE_PREVIEW_VIDEOS; i++) {
        let foundCurrentIndex = false;
        for (const extension of SOURCE_VIDEO_EXTENSIONS) {
            const url = `Resources/Git/${projectName}/PreviewVideo_${i}.${extension}`;
            if (await videoResourceExists(url)) {
                videos.push({ index: i, title: `PreviewVideo_${i}`, url });
                foundCurrentIndex = true;
                break;
            }
        }

        if (!foundCurrentIndex) {
            break;
        }
    }
    return videos;
}

function openSourcePreviewModal(card) {
    const projectName = card.dataset.project;
    const title = card.querySelector('.source-info h3').textContent;
    const desc = card.querySelector('.source-info > p').textContent;
    const tags = card.querySelector('.source-info .tags').innerHTML;
    const links = card.querySelector('.source-info .store-links').innerHTML;
    const videos = JSON.parse(card.dataset.previewVideos || '[]');

    modal.classList.add('source-video-mode');
    modal.querySelector('.modal-thumb img').src = '';
    modal.querySelector('.modal-thumb img').alt = '';
    modal.querySelector('.modal-info h3').textContent = `${title} 프리뷰 영상`;
    modal.querySelector('.modal-info > p').textContent = desc;
    modal.querySelector('.modal-info .tags').innerHTML = tags;
    modal.querySelector('.modal-info .store-links').innerHTML = links;
    modal.querySelector('.modal-info .source-preview-btn')?.remove();
    modal.querySelector('.modal-video').innerHTML = '';
    modal.querySelector('.modal-video').style.display = 'none';
    modal.querySelector('.modal-preview-carousel').innerHTML = '';
    modal.querySelector('.modal-details').innerHTML = `
        <div class="source-video-list">
            ${videos.map(video => `
                <div class="source-video-item">
                    <h4>${escapeHtml(video.title)}</h4>
                    <video src="${video.url}" controls preload="metadata" playsinline></video>
                </div>
            `).join('')}
        </div>
    `;

    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.querySelectorAll('video').forEach(video => video.pause());
    overlay.classList.remove('active');
    modal.classList.remove('active');
    modal.classList.remove('source-video-mode');
    document.body.style.overflow = '';
}

// 카드 클릭
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', (e) => {
        if (e.target.closest('.store-links')) return;
        openModal(card);
    });
});

document.querySelectorAll('.source-card[data-project]').forEach(async card => {
    const button = card.querySelector('.source-preview-btn');
    if (!button) return;

    const videos = await findSourcePreviewVideos(card);
    if (videos.length === 0) return;

    card.dataset.previewVideos = JSON.stringify(videos);
    button.style.display = '';
    button.addEventListener('click', () => openSourcePreviewModal(card));
});

// 닫기
modal.querySelector('.modal-close').addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});
