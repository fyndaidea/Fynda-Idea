Some features work without signing in. The [dashboard](/docs/dashboard) and favorites need an account.

## Sign in and register

| Action | URL |
|--------|-----|
| Sign in | [/login](/login) |
| Create account | [/register](/register) |
| Forgot password | [/forgot-password](/forgot-password) |
| Reset password | [/reset-password](/reset-password) |

Accounts use **email and password** via Supabase Auth. OAuth providers may be enabled depending on deployment.

## What requires an account

| Feature | Signed in? |
|---------|------------|
| Browse ideas, categories, collections | No |
| Submit an idea | No (email optional) |
| Vote / submit feedback | Yes |
| Save favorites | Yes |
| Dashboard | Yes |

## Profile

Your profile stores display name and favorites (`idea` list). The app loads it from `/api/profile` after you sign in.
