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
