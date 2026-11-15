#!/usr/bin/env node
/**
 * 邮件通道自测
 *
 *   node tools/mail-test.js --dry                 # 只打印三种模板，不发信
 *   SMTP_USER=me@suo.ma SMTP_PASS=xxx node tools/mail-test.js you@example.com
 *
 * 可选环境变量：SMTP_HOST / SMTP_PORT / SMTP_SECURE / MAIL_FROM
 */
const mail = require('../lib/mail');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const to = args.find((a) => !a.startsWith('--'));

const sample = { name: '示例博客', url: 'https://example.com', description: '一个用来测试的站点', avatar: 'https://example.com/avatar.png', email: to || 'applicant@example.com', issueUrl: 'https://github.com/Winn9910/suoma-blog.github.io/issues/1', time: '2026-11-15 22:00', ip: '1.2.3.4' };

(async () => {
    const cfg = mail.readConfig();
    console.log('SMTP:', cfg.host + ':' + cfg.port, 'secure=' + cfg.secure, 'user=' + (cfg.user || '(未配置)'));
    console.log('收件人默认值 MAIL_TO:', cfg.to || '(未配置，回落到 SMTP_USER)');

    const tpls = [
        mail.ownerApplicationMail(sample),
        mail.applicantApprovedMail(sample)
    ];

    if (dry) {
        for (const t of tpls) {
            console.log('\n================================================');
            console.log('主题：' + t.subject);
            console.log('------------------------------------------------');
            console.log(t.text);
        }
        console.log('\n[dry] 未实际发信。去掉 --dry 并配置 SMTP_USER / SMTP_PASS 即可真发。');
        return;
    }

    if (!to) {
        console.error('请指定收件地址：node tools/mail-test.js you@example.com');
        process.exit(1);
    }
    if (!mail.isConfigured()) {
        console.error('缺少 SMTP_USER / SMTP_PASS，无法发信。可先加 --dry 看模板。');
        process.exit(1);
    }

    const info = await mail.send({ ...tpls[1], to });
    console.log('\n已发送：', info.messageId, info.response);
})().catch((e) => {
    console.error('失败：', e && e.message);
    process.exit(1);
});
