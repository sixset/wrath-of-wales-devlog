# Wrath of Veles — devlog

A static site with no build step. Plain HTML/CSS/JS.

## Adding a post

Each post is a separate JSON file in `posts/`.

1. Create a file `posts/YYYY-MM-DD-short-title.json`:

   ```json
   {
     "date": "2026-10-05",
     "tags": ["battle"],
     "pl": {
       "title": "Tytul po polsku",
       "body": "Pierwszy akapit.\n\nDrugi akapit, **pogrubienie** i `kod` dzialaja. Lista:\n\n- punkt pierwszy\n- punkt drugi"
     },
     "en": {
       "title": "Title in English",
       "body": "Same thing in English."
     }
   }
   ```

   (`\n\n` = new paragraph, `\n- ` = list item)

   `body` also supports `*italics*`, subheadings (`## ` and `### ` as a
   separate paragraph) and images — `![alt text](img/YYYY-MM-DD/file.png)` in
   its own paragraph, with the line right below it (`*caption*`) becoming the
   caption. Keep images in `img/YYYY-MM-DD/`.

2. Add the file name at the **top** of `posts/manifest.json` (newest post first).

Save, commit, push — done. The list shows only an excerpt of each post; the
full text appears after clicking the title.

## Local preview

Any static server will do, e.g.:

```
python3 -m http.server 8000
```

then open `http://localhost:8000`.

## Deploying to GitHub Pages

1. `git init && git add -A && git commit -m "init devlog"`
2. Create an empty repository on GitHub (e.g. `wrath-of-veles-devlog`) and add the remote:
   `git remote add origin git@github.com:<user>/<repo>.git`
3. `git push -u origin main`
4. In the repository settings on GitHub: **Settings → Pages → Build and deployment →
   Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
5. The site will be available at `https://<user>.github.io/<repo>/`.

For a custom domain, add a `CNAME` file containing the domain name to the root directory.