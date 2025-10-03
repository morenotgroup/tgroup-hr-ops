# T Group • HR Ops (Kanban + Dashboard)

## Deploy na Vercel
1) Vercel → Import Project → selecione este repositório.
2) Em **Settings → Environment Variables**, escolha UM dos modos:

### Modo DIRETO (recomendado se não houver CORS)
- `NEXT_PUBLIC_API_BASE` = `https://script.google.com/macros/s/SEU_ID/exec`

### Modo PROXY (para evitar CORS)
- `NEXT_PUBLIC_API_BASE` = `/api/gs`
- `GS_WEBAPP_URL` = `https://script.google.com/macros/s/SEU_ID/exec`

3) Deploy. Abra a URL pública.  
4) Se `NEXT_PUBLIC_API_BASE` estiver vazio, o app roda em **DEMO** (dados locais).

## Observações
- Planilha: `HR_OPS_TGROUP` com aba `Tasks` (campos descritos na conversa).
- Apps Script publicado como Web App (somente domínio).
