# Backend Esamaï (Supabase)

## 1. Créer le projet
1. Va sur https://supabase.com et crée un projet
2. **SQL Editor** → colle et exécute `supabase/schema.sql`
3. **Authentication → Users** → ajoute un user admin (email + mot de passe)
4. **Project Settings → API** :
   - copie **Project URL**
   - copie **anon public** key

## 2. Brancher le site
Ouvre `js/config.js` et remplace :

```js
supabaseUrl: 'https://xxxx.supabase.co',
supabaseAnonKey: 'eyJhbGciOi...',
```

## 3. Tester
- Site : `esamai-site-v5.html` → menu chargé depuis la base si configuré
- Admin : `admin.html` → connexion → prix / stock / commandes
- Commander sur le site → enregistre la commande + baisse le stock + ouvre WhatsApp

## Notes
- Sans config Supabase, le site marche encore en **mode local** (menu JS, pas de stock serveur)
- Ne partage jamais la **service_role** key dans le frontend (seulement `anon`)
