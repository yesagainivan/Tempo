- [ ] **Use Supabase Auth**
  PowerSync will use the same JWT secret as Supabase.

- **Supabase JWT Secret (optional)**
  > [!warning] Legacy
  > If your Supabase project does not use the new [JWT signing keys](https://supabase.com/blog/jwt-signing-keys), you must provide your project's legacy JWT secret to use Supabase Auth. Get it from your project's API settings in the Supabase Dashboard.

- [ ] **Development tokens**
  Allow PowerSync to generate temporary development tokens.

- **JWKS URI (optional)**
  Keys returned by this URI will be trusted for JWT authentication.

- **JWT Audience (optional)**
  Additional values accepted for the 'aud' field of JWTs.

- **HS256 authentication tokens (ADVANCED)**
  Additional HS256 tokens used to authenticate JWTs.

**[Save and Deploy]**