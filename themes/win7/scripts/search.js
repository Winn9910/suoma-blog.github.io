/*
 * win7 theme — search index generator.
 * Emits public/search.json consumed by the client-side search in theme.js.
 * No external dependency: pure Node + Hexo locals.
 */
"use strict";

function strip(html) {
  if (!html) return "";
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = function (hexo) {
  hexo.extend.generator.register("win7_search", function (locals) {
    var tcfg = (hexo.theme && hexo.theme.config) || {};
    if (tcfg.search === false) return;

    function recordOf(doc, type) {
      var text = strip(doc.content);
      var excerpt = strip(doc.excerpt) || text.slice(0, 180);
      return {
        type: type,
        title: doc.title || "",
        path: doc.path,
        date: doc.date ? doc.date.format("YYYY-MM-DD") : "",
        cats: (doc.categories ? doc.categories : []).toArray
          ? doc.categories.toArray().map(function (c) { return c.name; })
          : [],
        tags: (doc.tags ? doc.tags : []).toArray
          ? doc.tags.toArray().map(function (t) { return t.name; })
          : [],
        text: text.slice(0, 5000),
        excerpt: excerpt.slice(0, 200)
      };
    }

    var posts = locals.posts.toArray().map(function (p) { return recordOf(p, "post"); });
    var pages = locals.pages.toArray()
      .filter(function (p) { return p.layout && p.layout !== "home" && p.layout !== "page" && p.source && p.source.indexOf("_posts") === -1; })
      .map(function (p) { return recordOf(p, "page"); });

    var payload = { posts: posts.concat(pages) };
    return {
      path: "search.json",
      data: JSON.stringify(payload)
    };
  });
};
