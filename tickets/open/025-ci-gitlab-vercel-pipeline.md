# 025 · GitLab-Pipeline für Vercel-Deploys

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | chore |
| **Zugewiesen** | Agent |
| **Erstellt** | 2026-11-27 |
| **Erledigt** | — |

## Ziel / Frage

Pushes auf das selfhosted GitLab sollen Builds ausführen und Projekte über die Vercel CLI deployen.

## Vereinbarung

- `main` wird als Production-Deployment ausgeliefert.
- Merge Requests erhalten ein Preview-Deployment.
- Alle anderen Branch-Pushes werden nur gebaut.
- Die Vercel-Zugangsdaten liegen als geschützte GitLab-CI-Variablen:
  `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Offen

- Deployment-URL als GitLab-Environment-URL für Previews bestätigen.
- Vercel-Variablen in GitLab konfigurieren.

## Verlauf
