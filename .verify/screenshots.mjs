// C10: 320/768/1440px 실제 렌더 스크린샷 + 가로스크롤 검사.
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const shots = path.join(here, 'shots');
fs.mkdirSync(shots, { recursive: true });

const WIDTHS = [320, 768, 1440];

const browser = await chromium.launch();
let failed = false;

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  // 범위 밖으로 합의된 SCG002 영상 404 3건이 콘솔을 채우므로 무시한다.
  page.on('pageerror', (err) => {
    console.log(`  \x1b[31mFAIL\x1b[0m  C10  ${width}px JS 에러: ${err.message}`);
    failed = true;
  });

  await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  // 스크롤 등장 애니메이션은 뷰포트 밖 섹션을 opacity 0 으로 둔다.
  // 전체 페이지를 찍으려면 먼저 펼쳐야 한다. 레이아웃 자체는 이 클래스와 무관하다.
  await page.evaluate(() => {
    document.querySelectorAll('.fade-up').forEach((el) => el.classList.add('visible'));
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const over = [];
    // 어느 요소가 넘치는지까지 짚어준다. 원인 없이 실패만 알리면 고칠 수가 없다.
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)) {
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string'
          ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
        over.push(`${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 70));
      }
    }
    return {
      scrollWidth: doc.scrollWidth,
      innerWidth: window.innerWidth,
      culprits: [...new Set(over)].slice(0, 5),
    };
  });

  await page.screenshot({ path: path.join(shots, `${width}.png`), fullPage: true });

  // C13 네비는 데스크톱에서 한 줄이어야 한다. 링크들의 top 이 전부 같은지로 판정한다
  if (width >= 1024) {
    const navRows = await page.evaluate(() => {
      const tops = [...document.querySelectorAll('nav ul a')].map((a) => Math.round(a.getBoundingClientRect().top));
      return new Set(tops).size;
    });
    if (navRows > 1) {
      console.log(`  \x1b[31mFAIL\x1b[0m  C13  ${width}px 네비가 ${navRows}줄로 접힘`);
      failed = true;
    } else {
      console.log(`  \x1b[32mPASS\x1b[0m  C13  ${width}px 네비 한 줄`);
    }

    // C11 AI 카드 4장의 렌더 폭이 같은지
    const widths = await page.evaluate(() =>
      [...document.querySelectorAll('.ai-card')].map((c) => Math.round(c.getBoundingClientRect().width)));
    if (widths.length !== 4 || new Set(widths).size !== 1) {
      console.log(`  \x1b[31mFAIL\x1b[0m  C11  ${width}px AI 카드 폭이 제각각: ${widths.join(', ')}`);
      failed = true;
    } else {
      console.log(`  \x1b[32mPASS\x1b[0m  C11  ${width}px AI 카드 4장 동일 폭 ${widths[0]}px`);
    }
  }

  // C14 AI 카드를 누르면 모달이 열려야 한다
  await page.click('.ai-card');
  await page.waitForTimeout(500);
  const modalOpen = await page.evaluate(() => {
    const m = document.getElementById('projectModal');
    return m && m.classList.contains('active') && m.classList.contains('ai-mode')
      && (m.querySelector('.modal-info h3')?.textContent || '').trim().length > 0;
  });
  if (!modalOpen) {
    console.log(`  \x1b[31mFAIL\x1b[0m  C14  ${width}px AI 카드 클릭에도 모달이 안 열림`);
    failed = true;
  } else {
    console.log(`  \x1b[32mPASS\x1b[0m  C14  ${width}px AI 카드 모달 열림`);
    await page.screenshot({ path: path.join(shots, `${width}-modal.png`) });
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  if (overflow.scrollWidth > overflow.innerWidth + 1) {
    console.log(
      `  \x1b[31mFAIL\x1b[0m  C10  ${width}px 가로스크롤: scrollWidth ${overflow.scrollWidth} > ${overflow.innerWidth}` +
      (overflow.culprits.length ? `\n              범인 후보: ${overflow.culprits.join(', ')}` : '')
    );
    failed = true;
  } else {
    console.log(`  \x1b[32mPASS\x1b[0m  C10  ${width}px 가로스크롤 없음 (shots/${width}.png)`);
  }

  await page.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
