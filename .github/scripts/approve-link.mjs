import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// 从环境变量获取 Issue 信息
const body = process.env.ISSUE_BODY || '';
const issueNumber = process.env.ISSUE_NUMBER || '';

// 解析 Issue body 中的字段
function getField(name) {
    const regex = new RegExp(`\\*\\*${name}\\*\\*:\\s*([^\\r\\n]+)`);
    const match = body.match(regex);
    return match ? match[1].trim() : '';
}

const name = getField('站名');
const url = getField('网址');
const description = getField('描述');
const avatar = getField('头像');

console.log('Parsed fields:');
console.log('  name:', name);
console.log('  url:', url);
console.log('  description:', description);
console.log('  avatar:', avatar);

// 校验必填字段
if (!name || !url) {
    console.error('Missing required fields (name or url)');
    process.exit(1);
}

// 校验网址格式
try {
    new URL(url);
} catch {
    console.error('Invalid URL:', url);
    process.exit(1);
}

// 转义 YAML 字符串中的特殊字符
function escapeYamlString(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// 构建新条目
let entry = `  - name: "${escapeYamlString(name)}"\n    url: "${escapeYamlString(url)}"`;
if (description && description !== '无') {
    entry += `\n    description: "${escapeYamlString(description)}"`;
}
if (avatar && avatar !== '无') {
    entry += `\n    avatar: "${escapeYamlString(avatar)}"`;
}
entry += '\n';

// 读取现有 links.yml
const linksPath = 'source/_data/links.yml';
let content = '';
if (existsSync(linksPath)) {
    content = readFileSync(linksPath, 'utf8');
} else {
    // 如果文件不存在，创建基础结构
    content = '# 友链数据（自动维护，请勿手动编辑）\nblogs:\n\ncircles:\n';
}

// 在 blogs: 行之后插入新条目
const blogsRegex = /^blogs:\n/m;
if (blogsRegex.test(content)) {
    content = content.replace(blogsRegex, `blogs:\n${entry}`);
} else {
    // 如果没有 blogs 段，追加
    content += `\nblogs:\n${entry}`;
}

writeFileSync(linksPath, content, 'utf8');
console.log('Successfully updated', linksPath);
