'use strict';

// hexo new 时自动：
// 1. 把文件名改为数字编号（如 94.md）
// 2. 在 front-matter 插入 url: /编号/
// 逻辑：扫描 source/_posts/ 下所有 数字.md 文件，取最大值 +1

hexo.on('new', function (post) {
  const fs = require('fs');
  const path = require('path');

  const postsDir = path.join(hexo.base_dir, 'source', '_posts');
  if (!fs.existsSync(postsDir)) return;

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

  let maxNum = 0;
  const numFiles = [];
  files.forEach(function (f) {
    const match = f.match(/^(\d+)\.md$/);
    if (match) {
      const n = parseInt(match[1], 10);
      numFiles.push(n);
      if (n > maxNum) maxNum = n;
    }
  });

  numFiles.sort(function (a, b) { return a - b; });
  hexo.log.info('扫描到数字文章: ' + (numFiles.length > 0 ? numFiles.join(', ') : '无') + '，最大编号: ' + maxNum);

  // 从 maxNum+1 开始找第一个不存在的编号
  let nextNum = maxNum + 1;
  const oldPath = post.path;
  const dir = path.dirname(oldPath);

  // 如果新创建的文件本身已经是数字.md，不需要重命名
  const oldName = path.basename(oldPath);
  const isAlreadyNumbered = /^\d+\.md$/.test(oldName);

  if (isAlreadyNumbered) {
    nextNum = parseInt(oldName.match(/^(\d+)\.md$/)[1], 10);
  }

  // 确保编号不与已有文件冲突
  while (fs.existsSync(path.join(dir, nextNum + '.md')) && path.join(dir, nextNum + '.md') !== oldPath) {
    nextNum++;
  }

  const newPath = path.join(dir, nextNum + '.md');

  // 读取刚生成的文章
  let content = fs.readFileSync(oldPath, 'utf8');

  // 在 date 行后面插入 url: /编号/
  if (content.indexOf('url:') === -1) {
    content = content.replace(
      /^(date:.*)$/m,
      '$1\nurl: /' + nextNum + '/'
    );
  }

  if (isAlreadyNumbered) {
    // 文件名已经是数字，只写入 url
    fs.writeFileSync(oldPath, content, 'utf8');
    hexo.log.info('已插入 url: /' + nextNum + '/ → ' + oldName);
  } else {
    // 重命名为数字.md
    fs.writeFileSync(newPath, content, 'utf8');
    fs.unlinkSync(oldPath);
    hexo.log.info('已重命名 → ' + nextNum + '.md (url: /' + nextNum + '/)');
  }
});
