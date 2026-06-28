# GitHub Pages Deployment Guide for Chainvet

This guide explains how to initialize Git in your landing page codebase, upload it to the **chainvet** GitHub organization, and deploy it to GitHub Pages.

---

## Prerequisites

1. You must have [Git](https://git-scm.com/) installed on your machine.
2. You must have access to the **chainvet** GitHub organization.
3. Create a new repository on GitHub under your organization:
   * **Owner**: `chainvet`
   * **Repository Name**: `chainvet.github.io` (for the primary organization domain `https://chainvet.github.io/`) OR `landing` (for `https://chainvet.github.io/landing/`).
   * **Visibility**: Public (required for free GitHub Pages tier)
   * **Do NOT** initialize with a README, `.gitignore`, or License.

---

## Step 1: Initialize Git and Commit Locally

Open a terminal, navigate to your landing page directory (`/home/anan/Coding/Rust/GP/ChainVet-Landing`), and execute the following commands to initialize git and commit your files:

```bash
# 1. Initialize git
git init

# 2. Add all project files
git add .

# 3. Create the initial commit
git commit -m "feat: initial commit of the Chainvet landing page with interactive canvas animations"

# 4. Set the default branch name to main
git branch -M main
```

---

## Step 2: Push to GitHub

Link your local repository to your newly created GitHub repository and push the codebase:

```bash
# Replace <REPO_NAME> with 'chainvet.github.io' or 'landing' depending on what you chose
git remote add origin https://github.com/chainvet/<REPO_NAME>.git

# Push the main branch to GitHub
git push -u origin main
```

---

## Step 3: Enable GitHub Pages

Once your files are pushed to GitHub, activate the deployment:

1. Navigate to your repository page on GitHub: `https://github.com/chainvet/<REPO_NAME>`.
2. Go to **Settings** (gear icon in the top tabs).
3. In the sidebar on the left, click **Pages** under the "Code and automation" section.
4. Under **Build and deployment**:
   * **Source**: Select **GitHub Actions** from the dropdown menu (this will automatically use the `.github/workflows/deploy.yml` workflow we created).
5. The deployment will automatically start! You can watch its progress under the **Actions** tab.

---

## Step 4: Access Your Live Site

Once the Actions workflow finishes successfully, your website will be live at:
* **Root Repo URL**: `https://chainvet.github.io/` (if your repository is named `chainvet.github.io`)
* **Project Repo URL**: `https://chainvet.github.io/landing/` (if your repository is named `landing`)

---

## Step 5: (Optional) Adding a Custom Domain

If you want to host the site under a custom domain (e.g. `chainvet.io` or `landing.chainvet.io`):

1. In the **Settings > Pages** panel on GitHub, enter your custom domain in the **Custom domain** field and click **Save**.
2. Update your DNS settings at your domain registrar (e.g., GoDaddy, Namecheap, Google Domains):
   * **For APEX domains (e.g., `chainvet.io`)**: Add `A` records pointing to GitHub Pages IP addresses:
     ```text
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   * **For Subdomains (e.g., `landing.chainvet.io`)**: Add a `CNAME` record pointing your subdomain to `chainvet.github.io`.
