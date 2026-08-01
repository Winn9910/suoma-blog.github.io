module.exports = async (req, res) => {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, message: '方法不允许' });
    }

    // 解析请求体（Vercel 自动解析 JSON Content-Type）
    const { name, url, description, avatar, email, website } = req.body || {};

    // Honeypot 检查 - 隐藏字段被填了说明是机器人
    if (website) {
        return res.status(400).json({ ok: false, message: '提交失败' });
    }

    // 必填字段校验
    if (!name || !url || !email) {
        return res.status(400).json({ ok: false, message: '请填写必填项（站名、网址、邮箱）' });
    }

    // 网址格式校验
    try {
        new URL(url);
    } catch {
        return res.status(400).json({ ok: false, message: '网址格式不正确' });
    }

    // 读取环境变量
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER || 'Winn9910';
    const repo = process.env.GITHUB_REPO_NAME || 'suoma-blog.github.io';

    if (!token) {
        return res.status(500).json({ ok: false, message: '服务器配置错误，请联系站长' });
    }

    // 构建 Issue 内容
    const issueBody = [
        '## 友链申请信息',
        '',
        '- **站名**: ' + name,
        '- **网址**: ' + url,
        '- **描述**: ' + (description || '无'),
        '- **头像**: ' + (avatar || '无'),
        '- **联系邮箱**: ' + email,
        '',
        '---',
        '审核通过请在本 Issue 添加 `approved` 标签，友链将自动添加到 links 页面。',
        '拒绝请直接关闭本 Issue。'
    ].join('\n');

    const ghHeaders = {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'suoma-blog-friend-link'
    };

    try {
        // 确保所需 labels 存在（已存在则忽略 422 错误）
        const labels = ['friend-link', 'pending-review', 'approved'];
        for (const label of labels) {
            await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/labels', {
                method: 'POST',
                headers: ghHeaders,
                body: JSON.stringify({ name: label, color: label === 'approved' ? '2cbe4e' : 'fbca04', description: '友链申请' })
            });
        }

        // 创建 Issue
        const resp = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/issues', {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify({
                title: '[友链申请] ' + name,
                body: issueBody,
                labels: ['friend-link', 'pending-review']
            })
        });

        const data = await resp.json();

        if (resp.ok) {
            res.status(200).json({
                ok: true,
                message: '申请已提交！审核通过后将自动出现在友链列表中。',
                issueUrl: data.html_url
            });
        } else {
            console.error('GitHub API error:', data);
            res.status(resp.status).json({
                ok: false,
                message: '提交失败：' + (data.message || 'GitHub API 错误')
            });
        }
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ ok: false, message: '服务器错误，请稍后重试' });
    }
};
