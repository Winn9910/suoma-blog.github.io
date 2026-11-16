/**
 * 统一邮件发送模块（SMTP）
 *
 * 需要的环境变量：
 *   SMTP_HOST   默认 eu1.workspace.org
 *   SMTP_PORT   默认 465
 *   SMTP_SECURE true / false，不填时按端口推断（465 => true，其它 => STARTTLS）
 *   SMTP_USER   发件邮箱（同时也是 SMTP 登录名）
 *   SMTP_PASS   密码 / 授权码
 *   MAIL_FROM   发件人显示，留空则用 SMTP_USER
 *   MAIL_TO     站长收件地址，留空则用 SMTP_USER
 */
const nodemailer = require('nodemailer');

function env(key, fallback) {
    const v = process.env[key];
    return v === undefined || v === null || v === '' ? fallback : v;
}

function readConfig() {
    const port = parseInt(env('SMTP_PORT', '465'), 10) || 465;
    const secure = String(env('SMTP_SECURE', port === 465 ? 'true' : 'false')).toLowerCase() !== 'false';
    return {
        host: env('SMTP_HOST', 'eu1.workspace.org'),
        port,
        secure,
        user: env('SMTP_USER', ''),
        pass: env('SMTP_PASS', ''),
        from: env('MAIL_FROM', ''),
        to: env('MAIL_TO', '')
    };
}

let cachedTransport = null;
let cachedKey = '';

function getTransport(cfg) {
    const key = [cfg.host, cfg.port, cfg.secure, cfg.user].join('|');
    if (cachedTransport && cachedKey === key) return cachedTransport;
    cachedTransport = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
        tls: { minVersion: 'TLSv1.2' }
    });
    cachedKey = key;
    return cachedTransport;
}

function isConfigured() {
    const cfg = readConfig();
    return Boolean(cfg.user && cfg.pass);
}

/**
 * @param {{to?: string, subject: string, text: string, html?: string, replyTo?: string}} opts
 */
async function send(opts) {
    const cfg = readConfig();
    if (!cfg.user || !cfg.pass) throw new Error('SMTP_NOT_CONFIGURED');
    const transport = getTransport(cfg);
    const from = cfg.from || cfg.user;
    return transport.sendMail({
        from,
        to: opts.to || cfg.to || cfg.user,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        // 默认让收件人直接回复发件邮箱；List-Unsubscribe 是 QQ / 163 判断
        // 「通知类邮件」的重要正向信号，能明显降低进垃圾箱的概率。
        replyTo: opts.replyTo || cfg.user,
        headers: {
            'List-Unsubscribe': '<mailto:' + cfg.user + '?subject=unsubscribe>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'X-Auto-Response-Suppress': 'OOF, AutoReply',
            'Auto-Submitted': 'auto-generated'
        }
    });
}

/* ---------------- 邮件模板（内联样式，兼容常见邮箱客户端） ---------------- */

function esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function layout(title, innerHtml) {
    return [
        '<div style="margin:0;padding:24px 12px;background:#eaf2fa;font-family:-apple-system,\'Segoe UI\',\'Microsoft YaHei\',Arial,sans-serif;">',
        '<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #b8cfe4;border-radius:8px;overflow:hidden;box-shadow:0 6px 20px rgba(20,60,100,.12);">',
        '<div style="padding:14px 20px;background:linear-gradient(180deg,#3d8fd4,#1f6bab);color:#fff;font-size:15px;font-weight:600;letter-spacing:.3px;">',
        esc(title),
        '</div>',
        '<div style="padding:20px;color:#22303d;font-size:14px;line-height:1.75;">',
        innerHtml,
        '</div>',
        '<div style="padding:12px 20px;background:#f5f9fd;border-top:1px solid #dce8f3;color:#8095a8;font-size:12px;">',
        '此邮件由 suo.ma 友链系统自动发送，请勿直接回复系统通知。',
        '</div>',
        '</div>',
        '</div>'
    ].join('');
}

function row(label, value, isLink) {
    const v = isLink
        ? '<a href="' + esc(value) + '" style="color:#1a5fa8;word-break:break-all;">' + esc(value) + '</a>'
        : esc(value);
    return (
        '<tr>' +
        '<td style="padding:6px 12px 6px 0;color:#7b8b9a;white-space:nowrap;vertical-align:top;width:72px;">' +
        esc(label) +
        '</td>' +
        '<td style="padding:6px 0;color:#22303d;word-break:break-all;">' +
        v +
        '</td>' +
        '</tr>'
    );
}

/** 有人提交友链申请 → 通知站长 */
function ownerApplicationMail(info) {
    const subject = '[友链申请] ' + info.name;
    const text = [
        '收到一条新的友链申请',
        '',
        '站名：' + info.name,
        '网址：' + info.url,
        '描述：' + (info.description || '无'),
        '头像：' + (info.avatar || '无'),
        '联系邮箱：' + info.email,
        '申请时间：' + (info.time || ''),
        '来源 IP：' + (info.ip || ''),
        '',
        '审核入口：' + (info.issueUrl || 'https://github.com/Winn9910/suoma-blog.github.io/issues'),
        '',
        '通过 → 在 Issue 上打 approved 标签（会自动合并友链并给申请人发信）',
        '拒绝 → 直接关闭 Issue（会自动给申请人发信）'
    ].join('\n');

    const html = layout(
        '收到一条新的友链申请',
        [
            '<p style="margin:0 0 14px;">有人提交了友链申请，请前往 Issue 审核：</p>',
            '<table style="border-collapse:collapse;font-size:14px;width:100%;">',
            row('站名', info.name),
            row('网址', info.url, true),
            row('描述', info.description || '无'),
            row('头像', info.avatar || '无', true),
            row('邮箱', info.email),
            row('时间', info.time || ''),
            row('IP', info.ip || ''),
            '</table>',
            '<p style="margin:18px 0 8px;">',
            info.issueUrl
                ? '<a href="' + esc(info.issueUrl) + '" style="display:inline-block;padding:8px 16px;background:linear-gradient(180deg,#4a9ddd,#1d6aab);color:#fff;text-decoration:none;border-radius:4px;border:1px solid #1a5c94;">打开 Issue 审核</a>'
                : '',
            '</p>',
            '<p style="margin:16px 0 0;color:#7b8b9a;font-size:13px;">通过 = 打 <b>approved</b> 标签（自动合并并回信）；拒绝 = 直接关闭 Issue（自动回信告知）。</p>'
        ].join('')
    );

    return { subject, text, html };
}

/** 审核通过 → 通知申请人 */
function applicantApprovedMail(info) {
    const subject = '【索玛的博客】友链申请已通过：' + info.name;
    const text = [
        '你好，',
        '',
        '你提交的友链申请已经通过审核，「' + info.name + '」已添加到 https://www.suo.ma/links/',
        '',
        '网址：' + info.url,
        '',
        '感谢你的关注，欢迎常来。',
        '',
        '索玛 · https://www.suo.ma'
    ].join('\n');

    const html = layout(
        '友链申请已通过',
        [
            '<p style="margin:0 0 14px;">你好，</p>',
            '<p style="margin:0 0 14px;">你提交的友链申请已经通过审核，站点已上线到友链页。</p>',
            '<table style="border-collapse:collapse;font-size:14px;width:100%;">',
            row('站名', info.name),
            row('网址', info.url, true),
            '</table>',
            '<p style="margin:18px 0 0;">',
            '<a href="https://www.suo.ma/links/" style="display:inline-block;padding:8px 16px;background:linear-gradient(180deg,#4a9ddd,#1d6aab);color:#fff;text-decoration:none;border-radius:4px;border:1px solid #1a5c94;">查看友链页</a>',
            '</p>',
            '<p style="margin:16px 0 0;color:#7b8b9a;font-size:13px;">感谢你的关注，欢迎常来。</p>'
        ].join('')
    );

    return { subject, text, html };
}

module.exports = { send, isConfigured, readConfig, ownerApplicationMail, applicantApprovedMail };
