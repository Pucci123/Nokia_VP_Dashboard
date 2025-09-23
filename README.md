# Quantum Security CVP – Comparative Analysis (Nokia vs. Peers)

This repository contains a light-themed, business-readable HTML dashboard with visuals (PoD/PoP bars, RBT mix) and detailed recommendations.

## Files

- `index.html` – redirects to the main dashboard for a clean GitHub Pages URL.
- `nokia_cvp_analysis.html` – the main dashboard.

## Publish with GitHub Pages

1) Initialize Git and commit locally

```bash
git init
git add .
git commit -m "Publish Nokia CVP dashboard"
git branch -M main
```

2) Create a repository on GitHub

- Go to https://github.com/new and create `<repo-name>` under your account.

3) Add the remote and push

Using HTTPS (easier to start):

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Or using SSH:

```bash
git remote add origin git@github.com:<your-username>/<repo-name>.git
git push -u origin main
```

4) Enable GitHub Pages

- On GitHub: Repository → Settings → Pages.
- Source: "Deploy from a branch".
- Branch: `main` and folder `/root`.
- Save.

5) Access your site

- URL: `https://<your-username>.github.io/<repo-name>/`
- Because `index.html` redirects, the dashboard opens automatically. The direct file URL is `https://<your-username>.github.io/<repo-name>/nokia_cvp_analysis.html`.

## Optional: Custom Domain

1) In repo Settings → Pages, set your custom domain (e.g., `cvp.example.com`).

2) Add a DNS CNAME record pointing `cvp.example.com` to `<your-username>.github.io`.

3) GitHub will create a `CNAME` file in the repo automatically upon save.

## Editing the Dashboard

- Open `nokia_cvp_analysis.html` and edit text/percentages.
- Bar widths can be updated by adjusting inline `style="width:XX%"` values in the PoD/PoP section and RBT stack.

## Local Preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

