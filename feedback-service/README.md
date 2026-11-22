# Pripombe za Berilo

Obrazec na Berilu pošlje pripombo v Cloudflare Worker. Ta shrani čas, razdelek, izbrani naslov in besedilo v podatkovno zbirko D1 `berilo-feedback`. Poročila lahko berejo uporabniki z dostopom do podatkovne zbirke v Cloudflaru.

## Pregled pripomb

Odpri [Cloudflare D1](https://dash.cloudflare.com/?to=%2F%3Aaccount%2Fworkers%2Fd1), izberi `berilo-feedback` in odpri **Tables → feedback**. Za pregled zadnjih pripomb v zavihku **Console** uporabi:

```sql
SELECT created_at, section, title, message
FROM feedback
ORDER BY created_at DESC
LIMIT 100;
```

Število pripomb po naslovih:

```sql
SELECT section, entry_id, title, COUNT(*) AS reports
FROM feedback
GROUP BY section, entry_id, title
ORDER BY reports DESC, title;
```

## Objava sprememb

Po spremembi seznama del ali tem iz korena projekta posodobi katalog in objavi Worker z ukazoma:

```sh
node feedback-service/build-catalog.cjs
npx wrangler deploy --config feedback-service/wrangler.jsonc
```

Po spremembi sheme pred objavo uporabi še `npx wrangler d1 migrations apply berilo-feedback --remote --config feedback-service/wrangler.jsonc`.
