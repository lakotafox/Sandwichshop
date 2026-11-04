# The Government Is Corrupt

A searchable public record of documented footage from Gaza and the West Bank since October 2023.
Records come live from the [Archive Genocide open API](https://archivegenocide.com/api-docs/),
used under its terms: credit Archive Genocide, link each clip to its archive page, respect the people
shown, and never store withdrawn clips. This site stores nothing; every search runs in the visitor's browser.

## Files

- `index.html` is the page
- `styles.css` holds the styles (dark theme, with light theme from the system setting)
- `app.js` calls the API and handles search, filters, the map, clip details and shareable links

It's a plain static site with no build step. Any static host works: GitHub Pages, Netlify, Cloudflare Pages.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Custom domain (GitHub Pages)

1. Add a `CNAME` file containing the domain, e.g. `thegovernmentiscorrupt.com`.
2. In the repo's Settings → Pages, serve from this branch's root.
3. At the domain registrar, point the apex `A` records to GitHub Pages
   (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153)
   and add a `CNAME` record for `www` to `<github-username>.github.io`.
4. Turn on "Enforce HTTPS" once the certificate is issued.
