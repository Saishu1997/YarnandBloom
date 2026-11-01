# Yarn & Bloom by Sunita

Website source for https://yarnandbloom.in. Edit the files inside `dist/`; product information is in `dist/shop.js` and photographs are in `dist/assets/`.

## Daily publishing

Automatic deployment is configured for pushes to `main`. Edit the files in `dist/`, commit, and push to publish. You can also use GitHub Actions > Check and publish website > Run workflow. The publishing token expires November 2, 2027; renew it and replace the `CLOUDFLARE_API_TOKEN` secret before then.

## Preview changes

Install Node.js 24, open a terminal in this folder, then run:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:4173. Run `npm run check` before publishing.

## Publish from your computer

First-time setup:

```powershell
npm run cloudflare:login
npm run deploy:setup
```

If the Pages project already exists, skip `deploy:setup`. Project name and production branch are in `deploy.config.json`. Select the intended Cloudflare account when signing in.

For each subsequent update:

```powershell
npm run deploy
```

This validates the site, then publishes `dist/` to the Cloudflare Pages project. Use `npm run deploy:preview` for a preview deployment instead of production.

## Publish through GitHub

The workflow in `.github/workflows/publish.yml` checks pushes and pull requests. To enable automatic publishing:

1. Create the Cloudflare Pages project using the setup command above.
2. Create a Cloudflare API token with Account → Cloudflare Pages → Edit, restricted to the intended account.
3. In this repository’s Settings → Secrets and variables → Actions, add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. Add repository variable `CLOUDFLARE_DEPLOY_ENABLED` with value `true`.
5. Push a commit to `main`, or open Actions → Check and publish website → Run workflow.

Never put tokens in the source code. Pull requests run validation only. The production environment can be configured with required reviewers in GitHub if desired.

## Domain connection status

The GoDaddy nameservers have been changed to `alec.ns.cloudflare.com` and `violet.ns.cloudflare.com`. Cloudflare is waiting for nameserver propagation. Until the Pages custom domain is attached, GitHub deployments update `https://yarnandbloom.pages.dev`, while `https://yarnandbloom.in` continues using the previous hosting.

Once Cloudflare shows the domain as Active:

1. Open https://dash.cloudflare.com/c299a5ba76ce9493792610ae7bfc2fa3/pages/view/yarnandbloom/domains
2. Select **Set up a custom domain** and enter `yarnandbloom.in`.
3. Accept replacing the existing website A records with the Pages CNAME to `yarnandbloom.pages.dev`. Preserve unrelated DNS records.
4. Wait for the custom domain to show Active with HTTPS, then open https://yarnandbloom.in and verify the latest site.

After that, every successful push to `main` updates the custom domain automatically.

## Connect the custom domain

The existing public site stays on its current hosting until migration is completed. A Pages deployment alone does not update yarnandbloom.in. First verify the `pages.dev` deployment, then add `yarnandbloom.in` under the Pages project's Custom domains. Cloudflare requires the root domain to be a zone in the same Cloudflare account and its nameservers configured at the registrar. Copy all existing DNS records before any nameserver change. Keep the current site active until HTTPS and the new custom-domain routing are verified.

## Roll back

Use the Cloudflare Pages project's Deployments list to roll back to a previously successful production deployment, or revert the unwanted GitHub commit and publish again.

## Reference

- https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
