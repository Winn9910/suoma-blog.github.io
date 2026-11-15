/**
 * 友链审核通过后，给申请人发信
 *
 * 用法（在 GitHub Actions 里）：
 *   ISSUE_BODY=<issue body>
 *
 * 依赖 ../../lib/mail.js 里的模板，因此需要在仓库根目录执行。
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const mail = require('../../lib/mail.js');

const body = process.env.ISSUE_BODY || '';

function getField(name) {
    const m = body.match(new RegExp(`\\*\\*${name}\\*\\*:\\s*([^\\r\\n]+)`));
    return m ? m[1].trim() : '';
}

const name = getField('站名');
const url = getField('网址');
const email = getField('联系邮箱');

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.log('::warning::Issue 里没有有效的联系邮箱，跳过邮件通知');
    process.exit(0);
}

if (!mail.isConfigured()) {
    console.log('::warning::未配置 SMTP_USER / SMTP_PASS，跳过邮件通知');
    process.exit(0);
}

const tpl = mail.applicantApprovedMail({ name, url });

let lastErr = null;
for (let attempt = 1; attempt <= 2; attempt++) {
    try {
        const info = await mail.send({ ...tpl, to: email });
        console.log(`已发送通过通知到 ${email}（messageId: ${info.messageId}）`);
        process.exit(0);
    } catch (err) {
        lastErr = err;
        console.error(`第 ${attempt} 次发送失败：`, err && err.message);
        if (attempt < 2) await new Promise((r) => setTimeout(r, 3000));
    }
}

console.log('::error::友链审核邮件发送失败：' + (lastErr && lastErr.message));
process.exit(1);
