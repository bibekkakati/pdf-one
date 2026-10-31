import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';

const checkDraft = String.raw`
import asyncio, base64, json, os
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 1800})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        await page.goto('http://localhost:8080')
        await page.evaluate('(data) => sessionStorage.setItem("pdfData", JSON.stringify({name:"Draft test.pdf", type:"application/pdf", data}))', os.environ['DRAFT_TEST_PDF'])
        await page.goto('http://localhost:8080/workspace')
        aside = page.locator('aside').filter(has=page.get_by_role('button', name='Sign', exact=True))
        await aside.get_by_placeholder('Your full name').wait_for()
        method = os.environ['DRAFT_TEST_METHOD']
        acc = lambda name: aside.locator('button[data-orientation=vertical]', has_text=name)
        if method == 'Type':
            await aside.get_by_placeholder('Your full name').fill('Taylor Draft')
            await aside.get_by_role('button', name='Place signature', exact=True).wait_for()
        elif method == 'Upload':
            await acc('Upload').click()
            image = await page.evaluate('''() => {
                const c = document.createElement('canvas'); c.width=200; c.height=80;
                const ctx=c.getContext('2d'); ctx.fillStyle='white';ctx.fillRect(0,0,200,80);
                ctx.fillStyle='black';ctx.font='30px serif';ctx.fillText('Taylor',10,50);
                return c.toDataURL('image/png').split(',')[1];
            }''')
            await aside.locator('input[type=file]').first.set_input_files({'name':'signature.png','mimeType':'image/png','buffer':base64.b64decode(image)})
            await aside.get_by_alt_text('Processed signature').wait_for()
            draft = await aside.get_by_alt_text('Processed signature').get_attribute('src')
        else:
            await acc('Draw').click()
            await aside.get_by_role('button', name='Draw Sign', exact=True).click()
            dialog = page.get_by_role('dialog')
            box = await dialog.locator('canvas').bounding_box()
            await page.mouse.move(box['x']+40,box['y']+80)
            await page.mouse.down()
            await page.mouse.move(box['x']+200,box['y']+130,steps=15)
            await page.mouse.up()
            await dialog.get_by_role('button',name='Use signature',exact=True).click()
            draft = await aside.get_by_alt_text('Your drawn signature').get_attribute('src')

        async def assert_draft():
            if method == 'Type':
                assert await aside.get_by_placeholder('Your full name').input_value() == 'Taylor Draft'
            else:
                alt = 'Processed signature' if method == 'Upload' else 'Your drawn signature'
                assert await aside.get_by_alt_text(alt).get_attribute('src') == draft
            assert await aside.get_by_role('button', name='Place signature', exact=True).is_visible()

        await acc(method).click()
        await acc(method).click()
        await assert_draft()
        other = 'Upload' if method != 'Upload' else 'Type'
        await acc(other).click()
        await acc(method).click()
        await assert_draft()
        await page.get_by_role('button', name='Hide tools panel').click()
        await page.get_by_role('button', name='Show tools panel').click()
        await assert_draft()
        await aside.get_by_role('button', name='Image', exact=True).click()
        await aside.get_by_role('button', name='Sign', exact=True).click()
        await assert_draft()
        await aside.get_by_role('button', name='Place signature', exact=True).click()
        await aside.get_by_role('button', name='Remove', exact=True).wait_for()
        await aside.get_by_role('button', name='Sign', exact=True).click()
        await assert_draft()
        out = Path('/tmp/browser/signature-persistence'); out.mkdir(parents=True, exist_ok=True)
        await aside.screenshot(path=str(out / (method + '.png')))
        assert not errors, errors
        await browser.close()

asyncio.run(main())
`;

for (const method of ['Type', 'Upload', 'Draw']) {
  test(`${method} signature survives accordion, sidebar, tool and selection changes`, async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    const result = spawnSync('python3', ['-c', checkDraft], {
      env: { ...process.env, DRAFT_TEST_METHOD: method, DRAFT_TEST_PDF: Buffer.from(await pdf.save()).toString('base64') },
      encoding: 'utf8',
    });
    expect(result.stderr).not.toContain('Traceback');
    expect(result.status).toBe(0);
  }, 60000);
}