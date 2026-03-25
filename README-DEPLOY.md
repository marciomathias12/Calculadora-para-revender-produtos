
# 🚀 Guia de Deploy - Yuanware Calc

Este projeto está configurado para deploy automático na **Netlify**.

## Passo a Passo para Deploy

1.  **Conectar Repositório**:
    - Vá para o painel da Netlify.
    - Clique em "Add new site" > "Import an existing project".
    - Escolha o GitHub/GitLab e selecione este repositório.

2.  **Configurações de Build (Automáticas via `netlify.toml`)**:
    - **Build Command**: `npm run build`
    - **Publish directory**: `dist`

3.  **Configurar Variável de Ambiente (CRÍTICO)**:
    - No painel do site na Netlify, vá em **Site Configuration** > **Environment variables**.
    - Clique em **Add a variable**.
    - Nome: `API_KEY`
    - Valor: `Sua_Chave_Da_API_Gemini_Aqui`
    - *Nota: Após adicionar, você precisará acionar um novo deploy para que a chave seja injetada.*

4.  **Acessar o Site**:
    - Após o build finalizar (cerca de 1-2 minutos), a Netlify fornecerá uma URL (ex: `yuanware-calc.netlify.app`).

## Solução de Problemas
- **Tela Branca?** Verifique no console se há erro de `API_KEY`. Certifique-se de que a variável de ambiente foi configurada exatamente com o nome `API_KEY`.
- **Erro 404 ao atualizar?** O arquivo `netlify.toml` já resolve isso com as regras de redirect.
