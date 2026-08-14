/**
 * 站点字数统计插件
 * 
 * 原理：通过 Hexo 的 template_locals 过滤器，在所有模板渲染前
 * 遍历全部文章，去掉 HTML 标签和空白字符，统计总字数。
 * 统计结果注入到模板变量 site_stats 中，可在 EJS 里直接使用。
 *
 * 用法：模板中 <%= site_stats.posts %>、<%= site_stats.chars %> 等
 */

hexo.extend.filter.register('template_locals', function (locals) {
    var posts = locals.site.posts;
    var totalChars = 0;
    var totalPosts = 0;

    posts.forEach(function (post) {
        totalPosts++;
        // post.content 是 Hexo 渲染后的 HTML，去掉标签和空白
        var content = (post.content || '')
            .replace(/<[^>]+>/g, '')    // 去 HTML 标签
            .replace(/&[a-z]+;/gi, '')  // 去 HTML 实体
            .replace(/[\s\n\r\t]/g, ''); // 去空白
        totalChars += content.length;
    });

    // 中文阅读速度约 300-500 字/分钟，取 400
    var readMin = Math.ceil(totalChars / 400);

    locals.site_stats = {
        posts: totalPosts,
        chars: totalChars,
        // 超过万用「万字」显示，否则直接数字
        charsLabel: totalChars >= 10000
            ? (totalChars / 10000).toFixed(1) + ' 万'
            : totalChars.toLocaleString(),
        readMin: readMin,
        // 阅读时长：超过 60 分钟显示 X 小时 Y 分钟
        readLabel: readMin >= 60
            ? Math.floor(readMin / 60) + ' 小时 ' + (readMin % 60) + ' 分钟'
            : readMin + ' 分钟'
    };

    return locals;
});
