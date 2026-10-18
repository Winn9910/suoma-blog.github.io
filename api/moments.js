const FEED_URL = 'https://gov.box/admin.rss';
const LIMIT = 1;
const MAX_IMAGES = 4;

function decodeEntities(str) {
    return str
        .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(parseInt(d, 10)))
        .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
}

function toPlain(html) {
    return decodeEntities(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// 从 description 中抽取图片地址（snac 附件：figure > img）
function pickImages(html) {
    const imgs = [];
    const re = /<img[^>]+src=["']?([^"'\s>]+)/gi;
    const decoded = decodeEntities(html);
    let m;
    while ((m = re.exec(decoded)) !== null && imgs.length < MAX_IMAGES) {
        const src = m[1].trim();
        if (/^https?:\/\//i.test(src) && imgs.indexOf(src) === -1) imgs.push(src);
    }
    return imgs;
}

function formatDate(pub) {
    const d = new Date(pub);
    if (isNaN(d.getTime())) return '';
    // 统一按北京时间（UTC+8）显示，避免 Vercel 服务器 UTC 造成偏差
    const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    const p = n => (n < 10 ? '0' : '') + n;
    return `${p(bj.getUTCMonth() + 1)}-${p(bj.getUTCDate())} ${p(bj.getUTCHours())}:${p(bj.getUTCMinutes())}`;
}

function parseFeed(xml, limit) {
    const out = [];
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (const item of items) {
        const pick = tag => {
            const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
            return m ? m[1] : '';
        };
        const desc = pick('description');
        const images = pickImages(desc);
        const text = toPlain(desc) || toPlain(pick('title'));
        const url = decodeEntities(pick('link')).trim();
        if ((!text && !images.length) || !url) continue;

        const moment = {
            text: text.length > 70 ? text.slice(0, 70) + '…' : text,
            url,
            date: formatDate(pick('pubDate'))
        };
        if (images.length) moment.images = images;

        out.push(moment);
        if (out.length >= limit) break;
    }
    return out;
}

module.exports = async (req, res) => {
    try {
        const resp = await fetch(FEED_URL, {
            headers: { 'User-Agent': 'suoma-blog/1.0', 'Accept': 'application/rss+xml' }
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);

        const moments = parseFeed(await resp.text(), 1);
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        res.status(200).json({ ok: true, moments });
    } catch (err) {
        console.error('moments api error:', err);
        res.status(502).json({ ok: false, moments: [], message: 'feed unavailable' });
    }
};
