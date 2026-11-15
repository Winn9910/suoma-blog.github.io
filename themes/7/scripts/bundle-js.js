'use strict';

const fs = require('fs');
const path = require('path');

const ORDER = [
  'code-dblclick.js',
  'scroll-page.js',
  'view-sort.js',
  'mobile-menu.js',
  'row-preview.js',
  'img-lazy.js',
  'search.js',
  'context-menu.js',
  'draggable-window.js',
  'attachments.js'
];

hexo.extend.generator.register('theme_js_bundle', function () {
  const jsDir = path.join(this.theme_dir, 'source', 'js');
  const parts = [];
  ORDER.forEach(function (name) {
    const file = path.join(jsDir, name);
    if (fs.existsSync(file)) {
      parts.push('/* ' + name + ' */\n' + fs.readFileSync(file, 'utf8'));
    }
  });
  const data = parts.join('\n;\n');
  return {
    path: 'js/bundle.js',
    data: data
  };
});
