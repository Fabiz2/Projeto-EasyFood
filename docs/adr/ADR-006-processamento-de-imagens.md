# ADR-006 — Processamento de imagens dentro da API

| Campo       | Valor                          |
|-------------|--------------------------------|
| **Status**  | Aceito                         |
| **Data**    | 2026-11-11                     |
| **Autores** | Equipe de Engenharia EasyFood  |

---

## Contexto

A EasyFood passou a ter cardápio: cada restaurante possui vários pratos (relação 1:N entre `Restaurant` e `Dish`), e cada prato pode ter uma foto.

Fotos tiradas pelo celular costumam ter vários megabytes e resolução muito maior que a necessária para exibir um card. Servir esses arquivos sem tratamento deixa o site lento e consome dados do usuário. Por isso, a imagem precisa ser **redimensionada, convertida e comprimida** antes de ser armazenada.

## Alternativas consideradas

1. **Processar dentro da API EasyFood** (Multer + Sharp no próprio servidor Node.js).
2. **Criar um serviço independente** de imagens (microsserviço).
3. **Utilizar Serverless/FaaS** (ex.: AWS Lambda disparada pelo upload em um bucket S3).

## Decisão

Manter o processamento dentro da API EasyFood:

- `shared/upload.middleware.js` — Multer recebe o arquivo em memória, limita a 5 MB e aceita apenas JPEG, PNG e WebP.
- `shared/image.service.js` — Sharp corrige a orientação, redimensiona para até 800 px de largura e converte para WebP com qualidade 80.
- O arquivo otimizado é salvo em `uploads/dishes/` e o caminho é gravado em `Dish.imageUrl`.

## Justificativa

- **Simplicidade:** nenhum componente novo para configurar ou implantar.
- **Baixo volume inicial:** poucas imagens, enviadas apenas por restaurantes autenticados.
- **Infraestrutura já existente:** reaproveita o servidor e o banco atuais.
- **Facilidade de implementação:** duas bibliotecas consolidadas (Multer e Sharp).
- **Contexto acadêmico:** o objetivo é entender o fluxo completo sem custos de nuvem.

## Comparação das imagens

Foram feitos dois testes, com imagens de tamanhos bem diferentes:

| Teste | | Formato | Tamanho | Dimensões |
|---|---|---|---|---|
| Foto real de prato | **Original** | JPEG | 43,4 KB | 547 × 365 |
| | **Otimizada** | WebP | 43,1 KB | 547 × 365 |
| Imagem grande (alta resolução) | **Original** | JPEG | 441,9 KB | 2400 × 1600 |
| | **Otimizada** | WebP | 20,8 KB | 800 × 533 |

1. **A imagem otimizada ficou menor?** Nos dois casos, sim, mas em proporções muito diferentes. A imagem grande ficou cerca de 95% menor; a foto real, que já era pequena, praticamente não mudou (0,3 KB a menos).
2. **Qual transformação foi realizada?** Conversão de JPEG para WebP com qualidade 80 nas duas. Na imagem grande houve também redimensionamento para 800 px de largura, mantendo a proporção. A foto real já tinha menos de 800 px, e o `withoutEnlargement: true` impede que ela seja ampliada.
3. **Por que isso pode melhorar a experiência do usuário?** Fotos tiradas pelo celular costumam ser grandes como a do segundo teste. Reduzidas, carregam muito mais rápido, principalmente no 4G, e consomem menos do plano de dados.
4. **O arquivo sempre ficará menor?** Não necessariamente, e a foto real mostra isso: quando a imagem já é pequena e bem comprimida, o ganho é quase nulo, e em alguns casos o arquivo pode até crescer. O resultado depende da imagem original e da configuração de compressão.

> O servidor registra no terminal o antes/depois de cada upload (`[IMAGEM] original: ... -> otimizada: ...`).

## Reutilização (Atividade 8)

Na Atividade 8, o mesmo `image.service.js` passou a atender também a foto de perfil do usuário (`POST /auth/me/image`). O serviço recebe o tipo de imagem e aplica a predefinição correspondente: `dishes` (até 800 px de largura) ou `users` (quadrada 400 × 400). Assim, a lógica de otimização não é duplicada entre os módulos.

## Tratamento de falhas

| Situação | Resposta |
|---|---|
| Requisição sem arquivo | 400 Bad Request |
| Arquivo que não é imagem | 400 Bad Request |
| Arquivo com extensão de imagem, mas corrompido | 400 Bad Request |
| Arquivo maior que 5 MB | 413 Payload Too Large |
| Prato inexistente | 404 Not Found |

Os erros do Multer são tratados no middleware global `shared/error.middleware.js`, e a aplicação não encerra.

Se o upload falhar, **o prato não é excluído**: ele continua cadastrado sem imagem e o usuário pode tentar novamente. Uma falha na operação secundária não invalida a operação principal já concluída (mesmo princípio da ADR-005).

## Consequências

### Vantagens
- Menor complexidade inicial.
- Menos componentes para configurar.
- Aproveitamento da infraestrutura existente.

### Limitações
- O Sharp consome CPU e memória do mesmo processo que atende a API.
- Uploads simultâneos podem deixar outras requisições mais lentas.
- Armazenamento local não funciona bem com várias instâncias ou com servidores de disco temporário.
- As imagens ficam públicas em `/uploads`.

## Critérios de revisão

- O volume de uploads crescer e impactar o tempo de resposta da API.
- A aplicação passar a rodar em mais de uma instância: mover arquivos para S3 ou similar.
- Necessidade de gerar várias versões (miniatura, média, grande) por imagem.

> Esta decisão não significa que Serverless seja inadequado. Significa que, neste momento, processar dentro da API atende melhor às necessidades da EasyFood.
