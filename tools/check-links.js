'use strict';

/**
 * 友链自动巡检脚本（由 GitHub Actions 每日定时调用）
 * 读取 source/_data/links.yml，逐个探测站点与头像可达性，
 * 结果写入 source/_data/link-health.json（含历史 failCount / lastOk）。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LINKS_FILE = path.join(ROOT, 'source/_data/links.yml');
const HEALTH_FILE = path.join(ROOT, 'source/_data/link-health.json');
const TIMEOUT = 25000; // 单个请求超时（部分友链站点较慢，放宽到 25 秒）
const CONCURRENCY = 5; // 并发数，对目标站友好一点
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 suoma-blog-link-check';

// ---------- 简易 YAML 解析（结构固定，够用） ----------
function parseLinksYaml(text) {
    const result = {};
    let section = null;
    let current = null;
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.replace(/#.*$/, '').trimEnd();
        if (!line.trim() || line.trim().startsWith('#')) continue;

        const sectionMatch = line.match(/^([A-Za-z_][\w-]*):\s*$/);
        if (sectionMatch) { section = sectionMatch[1]; result[section] = []; continue; }

        const entryMatch = line.match(/^\s*-\s+name:\s*(.*)$/);
        if (entryMatch && section) {
            current = { name: stripQuotes(entryMatch[1]) };
            result[section].push(current);
            continue;
        }

        const fieldMatch = line.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/);
        if (fieldMatch && current) {
            current[fieldMatch[1]] = stripQuotes(fieldMatch[2]);
        }
    }
    return result;
}

function stripQuotes(v) {
    v = (v || '').trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        return v.slice(1, -1);
    }
    return v;
}

// ---------- 探测 ----------
async function probe(url) {
    const started = Date.now();
    const opts = {
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT),
        headers: { 'User-Agent': UA, 'Accept': '*/*' }
    };
    try {
        const res = await fetch(url, { ...opts, method: 'HEAD' });
        if (res.ok || isSoftBlock(res.status)) return { ok: true, code: res.status, ms: Date.now() - started };
        throw new Error('HTTP ' + res.status);
    } catch (e1) {
        // 部分站点不支持 HEAD，降级 GET 再试一次
        try {
            const res = await fetch(url, { ...opts, method: 'GET' });
            if (res.ok || isSoftBlock(res.status)) return { ok: true, code: res.status, ms: Date.now() - started };
            return { ok: false, code: res.status, ms: Date.now() - started };
        } catch (e2) {
            return { ok: false, code: (e2.cause && e2.cause.code) || e2.message || 'ERROR', ms: Date.now() - started };
        }
    }
}

// 403/405/429 说明站点活着只是拦机器人，不算失联
function isSoftBlock(code) {
    return code === 403 || code === 405 || code === 429;
}

async function mapLimit(items, limit, fn) {
    const out = new Array(items.length);
    let i = 0;
    async function worker() {
        while (i < items.length) {
            const idx = i++;
            out[idx] = await fn(items[idx], idx);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return out;
}

// ---------- 主流程 ----------
(async () => {
    if (!fs.existsSync(LINKS_FILE)) {
        console.error('找不到 links.yml');
        process.exit(1);
    }

    const data = parseLinksYaml(fs.readFileSync(LINKS_FILE, 'utf8'));
    const entries = [];
    for (const key of Object.keys(data)) {
        for (const item of (data[key] || [])) {
            if (item.url) entries.push(item);
        }
    }

    // 读取历史，累计失败次数
    let prev = { sites: {}, avatars: {} };
    try {
        prev = JSON.parse(fs.readFileSync(HEALTH_FILE, 'utf8'));
    } catch (e) { /* 首次运行无历史 */ }

    const now = new Date();
    const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const p = n => (n < 10 ? '0' : '') + n;
    const checkedAt = bj.getUTCFullYear() + '-' + p(bj.getUTCMonth() + 1) + '-' + p(bj.getUTCDate())
        + ' ' + p(bj.getUTCHours()) + ':' + p(bj.getUTCMinutes());

    console.log('开始巡检 ' + entries.length + ' 个友链...');

    const sites = {};
    const avatars = {};

    // 站点巡检
    await mapLimit(entries, CONCURRENCY, async (item) => {
        const r = await probe(item.url);
        const old = (prev.sites && prev.sites[item.url]) || {};
        const failCount = r.ok ? 0 : ((old.failCount || 0) + 1);
        sites[item.url] = {
            name: item.name,
            ok: r.ok,
            code: r.code,
            ms: r.ms,
            failCount: failCount,
            lastOk: r.ok ? checkedAt : (old.lastOk || '从未成功')
        };
        console.log((r.ok ? '  ✓ ' : '  ✗ ') + item.name + ' (' + item.url + ') ' + r.code + ' ' + r.ms + 'ms'
            + (r.ok ? '' : ' [连续失败 ' + failCount + ' 次]'));
    });

    // 头像巡检（仅记录数据，不影响页面展示）
    const withAvatar = entries.filter(item => item.avatar && item.avatar.trim());
    await mapLimit(withAvatar, CONCURRENCY, async (item) => {
        const r = await probe(item.avatar);
        avatars[item.avatar] = { ok: r.ok, code: r.code };
    });
    const brokenAvatars = Object.keys(avatars).filter(u => !avatars[u].ok);
    if (brokenAvatars.length) {
        console.log('头像加载失败 ' + brokenAvatars.length + ' 个（页面已有占位兜底）');
    }

    const health = { checkedAt, sites, avatars };
    fs.writeFileSync(HEALTH_FILE, JSON.stringify(health, null, 2) + '\n', 'utf8');

    const dead = Object.values(sites).filter(s => !s.ok);
    console.log('巡检完成：' + (entries.length - dead.length) + ' 正常 / ' + dead.length + ' 失联');
    process.exit(0);
})();
