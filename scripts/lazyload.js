'use strict';

// 给文章正文图片自动补懒加载 + 异步解码
// <img src="x.jpg">  →  <img src="x.jpg" loading="lazy" decoding="async">
// 已带 loading 属性的图片（如手工写过的）不重复处理
hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content) return data;

  data.content = data.content.replace(/<img\b[^>]*>/gi, function (tag) {
    if (/\bloading\s*=/i.test(tag)) return tag;
    var stripped = tag.replace(/\/\s*>$/, '').replace(/>$/, '');
    return stripped + ' loading="lazy" decoding="async">';
  });

  return data;
});
