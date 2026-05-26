const { chromium } = require('playwright');

async function main() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Listen for page console logs
    page.on('console', msg => {
        console.log(`PAGE LOG: [${msg.type()}] ${msg.text()}`);
    });

    // Listen for page errors
    page.on('pageerror', err => {
        console.error('PAGE ERROR:', err.message);
    });

    const path = require('path');
    const filePath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
    console.log('Navigating to ' + filePath + ' ...');
    await page.goto(filePath);

    // Wait for loader to fade out (or bypass it)
    console.log('Bypassing loader...');
    await page.evaluate(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    });

    // Click the music button
    console.log('Clicking music button...');
    await page.click('#music-btn');

    // Wait a brief moment
    await page.waitForTimeout(1000);

    // Fast-forward music to 25s
    console.log('Skipping audio to 25 seconds...');
    const result = await page.evaluate(() => {
        const bgMusic = document.getElementById('bg-music');
        const lyricsContainer = document.getElementById('lyrics-container');
        const currentLyric = document.querySelector('.lyrics-current');
        const nextLyric = document.querySelector('.lyrics-next');
        const scrollIndicator = document.getElementById('scroll-indicator');

        if (!bgMusic) return { error: 'bg-music not found' };

        bgMusic.currentTime = 25;

        // Force a timeupdate/render check
        return {
            audioPaused: bgMusic.paused,
            audioTime: bgMusic.currentTime,
            containerClass: lyricsContainer ? lyricsContainer.className : 'no container',
            currentText: currentLyric ? currentLyric.textContent : 'no current',
            nextText: nextLyric ? nextLyric.textContent : 'no next',
            scrollOpacity: scrollIndicator ? window.getComputedStyle(scrollIndicator).opacity : 'no scroll'
        };
    });

    console.log('Results:', JSON.stringify(result, null, 2));

    await browser.close();
}

main().catch(console.error);
