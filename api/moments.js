const FEED_URL = 'https://gov.box/admin.rss';

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

function formatDate(pub) {
    const d = new Date(pub);
    if (isNaN(d.getTime())) return '';
    const p = n => (n < 10 ? '0' : '') + n;
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function parseFeed(xml, limit) {
    const out = [];
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (const item of items) {
        const pick = tag => {
            const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
            return m ? m[1] : '';
        };
        const text = toPlain(pick('description')) || toPlain(pick('title'));
        const url = decodeEntities(pick('link')).trim();
        if (!text || !url) continue;

        out.push({
            text: text.length > 70 ? text.slice(0, 70) + '…' : text,
            url,
            date: formatDate(pick('pubDate'))
        });
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
