(function () {
  "use strict";

  var LANG_KEY = "devlog_lang";
  var EXCERPT_LEN = 220;
  var state = { lang: localStorage.getItem(LANG_KEY) || "en", posts: [] };

  var feed = document.getElementById("feed");
  var langButtons = document.querySelectorAll("[data-lang-btn]");

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function inlineFormat(s) {
    // odd parts are `code` spans — left untouched by bold/italic
    return s
      .split(/`([^`]+)`/)
      .map(function (part, i) {
        if (i % 2 === 1) {
          return "<code>" + part + "</code>";
        }
        return part
          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
          .replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>");
      })
      .join("");
  }

  var IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s"]+)\)$/;
  var HEADING_RE = /^(#{2,3})\s+(.+)$/;

  // "![alt](src)" on its own line, optional following lines = caption
  function renderFigure(lines) {
    var m = IMAGE_RE.exec(lines[0].trim());
    var alt = escapeHtml(m[1]).replace(/"/g, "&quot;");
    var caption = lines.slice(1).join(" ").trim().replace(/^\*(.+)\*$/, "$1");
    return (
      '<figure><img src="' +
      escapeHtml(m[2]) +
      '" alt="' +
      alt +
      '" loading="lazy">' +
      (caption ? "<figcaption>" + inlineFormat(escapeHtml(caption)) + "</figcaption>" : "") +
      "</figure>"
    );
  }

  function renderBody(raw) {
    var blocks = raw.trim().split(/\n\s*\n/);
    return blocks
      .map(function (block) {
        var lines = block.split("\n");
        if (IMAGE_RE.test(lines[0].trim())) {
          return renderFigure(lines);
        }
        var heading = lines.length === 1 && HEADING_RE.exec(block.trim());
        if (heading) {
          // "##" -> h3, "###" -> h4 (h2 is the post title)
          var tag = "h" + (heading[1].length + 1);
          return "<" + tag + ">" + inlineFormat(escapeHtml(heading[2])) + "</" + tag + ">";
        }
        var isList = lines.every(function (l) {
          return /^\s*-\s+/.test(l);
        });
        if (isList) {
          var items = lines
            .map(function (l) {
              return "<li>" + inlineFormat(escapeHtml(l.replace(/^\s*-\s+/, ""))) + "</li>";
            })
            .join("");
          return "<ul>" + items + "</ul>";
        }
        return "<p>" + inlineFormat(escapeHtml(block)) + "</p>";
      })
      .join("\n");
  }

  function excerpt(raw) {
    var firstBlock = raw.trim().split(/\n\s*\n/)[0];
    var plain = firstBlock.replace(/[`*]/g, "").replace(/\s+/g, " ").trim();
    if (plain.length <= EXCERPT_LEN) {
      return plain;
    }
    var cut = plain.slice(0, EXCERPT_LEN);
    cut = cut.slice(0, cut.lastIndexOf(" "));
    return cut + "…";
  }

  function tagsHtml(tags) {
    return (tags || [])
      .map(function (tag) {
        return '<span class="tag">#' + escapeHtml(tag) + "</span>";
      })
      .join(" ");
  }

  function currentFile() {
    var m = /^#post=(.+)$/.exec(location.hash);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function renderList() {
    var html = state.posts
      .map(function (post) {
        var t = post[state.lang] || post.pl;
        var strings = state.lang === "en" ? EN : PL;
        return (
          "<article class=\"post post-teaser\">" +
          '<div class="post-meta"><span class="date">' +
          post.date +
          "</span> " +
          tagsHtml(post.tags) +
          "</div>" +
          "<h2><a href=\"#post=" +
          encodeURIComponent(post.file) +
          "\">" +
          escapeHtml(t.title) +
          "</a></h2>" +
          "<p>" +
          escapeHtml(excerpt(t.body)) +
          "</p>" +
          "<p class=\"more\"><a href=\"#post=" +
          encodeURIComponent(post.file) +
          "\">" +
          strings.readMore +
          "</a></p>" +
          "</article>"
        );
      })
      .join("\n");
    feed.innerHTML = html || "<p>(brak wpisow)</p>";
  }

  function renderDetail(file) {
    var post = state.posts.filter(function (p) {
      return p.file === file;
    })[0];
    if (!post) {
      feed.innerHTML = "<p>not found. <a href=\"#\">&larr; back</a></p>";
      return;
    }
    var t = post[state.lang] || post.pl;
    var strings = state.lang === "en" ? EN : PL;
    feed.innerHTML =
      "<p class=\"back\"><a href=\"#\">" +
      strings.back +
      "</a></p>" +
      "<article class=\"post\">" +
      '<div class="post-meta"><span class="date">' +
      post.date +
      "</span> " +
      tagsHtml(post.tags) +
      "</div>" +
      "<h2>" +
      escapeHtml(t.title) +
      "</h2>" +
      renderBody(t.body) +
      "</article>";
  }

  var PL = { readMore: "czytaj dalej &rarr;", back: "&larr; wszystkie wpisy" };
  var EN = { readMore: "read more &rarr;", back: "&larr; all posts" };

  function render() {
    document.documentElement.lang = state.lang;
    langButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === state.lang);
    });

    var file = currentFile();
    if (file) {
      renderDetail(file);
    } else {
      renderList();
    }
  }

  function loadPosts() {
    return fetch("posts/manifest.json")
      .then(function (res) {
        return res.json();
      })
      .then(function (files) {
        return Promise.all(
          files.map(function (file) {
            return fetch("posts/" + file).then(function (res) {
              return res.json().then(function (data) {
                data.file = file;
                return data;
              });
            });
          })
        );
      });
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.lang = btn.getAttribute("data-lang-btn");
      localStorage.setItem(LANG_KEY, state.lang);
      render();
    });
  });

  window.addEventListener("hashchange", render);

  loadPosts()
    .then(function (posts) {
      state.posts = posts;
      render();
    })
    .catch(function (err) {
      feed.innerHTML = "<p>failed to load posts: " + escapeHtml(String(err)) + "</p>";
    });
})();
