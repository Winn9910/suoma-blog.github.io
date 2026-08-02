'use strict';

// hexo new 时自动在 front-matter 插入 url: /下一个编号/
// 逻辑：扫描 source/_posts/ 下所有 .md 文件名中的数字，取最大值 +1

hexo.on('new', function (post) {
  const fs = require('fs');
  const path = require('path');

  const postsDir = path.join(hexo.base_dir, 'source', '_posts');
  if (!fs.existsSync(postsDir)) return;

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

  let maxNum = 0;
  files.forEach(function (f) {
    const match = f.match(/^(\d+)\.md$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });

  const nextNum = maxNum + 1;

  // 读取刚生成的文章
  const filePath = post.path;
  let content = fs.readFileSync(filePath, 'utf8');

  // 在 date 行后面插入 url: /编号/
  if (content.indexOf('url:') === -1) {
    content = content.replace(
      /^(date:.*)$/m,
      '$1\nurl: /' + nextNum + '/'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    hexo.log.info('自动插入 url: /' + nextNum + '/');
  }
});
