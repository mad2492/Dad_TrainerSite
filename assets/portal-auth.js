/* Fonseca Fitness — front-end auth (Supabase magic links).
   Plain script, no build step. Load order: portal-config.js (optional) →
   this file → the page's inline script. Exposes window.FonsecaAuth.
   Demo mode (no config): FonsecaAuth.enabled is false and every call is a
   harmless no-op, so the portal behaves exactly as the static demo. */
(function () {
  "use strict";

  const CDN_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  const config = window.FONSECA_SUPABASE;
  const enabled = !!(
    config &&
    config.url &&
    config.anonKey &&
    config.url.indexOf("YOUR-PROJECT") === -1 &&
    config.anonKey.indexOf("YOUR-ANON") === -1
  );

  let client = null;
  let hooks = { onSignedIn: function () {}, onSignedOut: function () {} };
  let warned = false;

  const warnOnce = (message, detail) => {
    if (!warned) {
      warned = true;
      console.warn("FonsecaAuth: " + message, detail || "");
    }
  };

  // Inject the Supabase JS client from the CDN; resolves with the library.
  const loadSupabase = () => {
    return new Promise((resolve, reject) => {
      if (window.supabase && window.supabase.createClient) {
        resolve(window.supabase);
        return;
      }
      const tag = document.createElement("script");
      tag.src = CDN_URL;
      tag.onload = () => {
        if (window.supabase && window.supabase.createClient) {
          resolve(window.supabase);
        } else {
          reject(new Error("Supabase library did not initialize"));
        }
      };
      tag.onerror = () => reject(new Error("Could not load the Supabase library"));
      document.head.appendChild(tag);
    });
  };

  // Fetch the signed-in user's profile row; notify hooks accordingly.
  const resolveSession = (session) => {
    if (!session || !session.user) {
      hooks.onSignedOut();
      return Promise.resolve();
    }
    return client
      .from("profiles")
      .select("id, full_name, role, client_type")
      .eq("id", session.user.id)
      .single()
      .then((result) => {
        if (result.error || !result.data) {
          warnOnce("could not load profile (check RLS policies); treating as signed out.", result.error);
          hooks.onSignedOut();
        } else {
          hooks.onSignedIn(result.data);
        }
      })
      .catch((err) => {
        warnOnce("profile lookup failed; treating as signed out.", err);
        hooks.onSignedOut();
      });
  };

  const api = {
    enabled: enabled,

    init: (userHooks) => {
      if (userHooks) {
        if (userHooks.onSignedIn) hooks.onSignedIn = userHooks.onSignedIn;
        if (userHooks.onSignedOut) hooks.onSignedOut = userHooks.onSignedOut;
      }
      if (!enabled) return Promise.resolve();

      return loadSupabase()
        .then((supabase) => {
          client = supabase.createClient(config.url, config.anonKey);
          // getSession() also completes the magic-link redirect: the client
          // parses the #access_token=... hash Supabase appends to the URL.
          return client.auth.getSession();
        })
        .then((result) => {
          client.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
              resolveSession(session);
            } else if (event === "SIGNED_OUT") {
              hooks.onSignedOut();
            }
          });
          return resolveSession(result.data ? result.data.session : null);
        })
        .catch((err) => {
          warnOnce("initialization failed; staying in signed-out state.", err);
          hooks.onSignedOut();
        });
    },

    signInWithEmail: (email) => {
      if (!enabled || !client) {
        return Promise.resolve({ ok: false, error: "Sign-in is not available in demo mode." });
      }
      const redirectTo = window.location.href.split("#")[0];
      return client.auth
        .signInWithOtp({ email: email, options: { emailRedirectTo: redirectTo } })
        .then((result) => {
          if (result.error) {
            return { ok: false, error: result.error.message || "Could not send the sign-in link." };
          }
          return { ok: true };
        })
        .catch(() => {
          return { ok: false, error: "Could not reach the sign-in service. Please try again." };
        });
    },

    signOut: () => {
      if (!enabled || !client) return Promise.resolve();
      return client.auth.signOut().catch((err) => {
        warnOnce("sign-out failed.", err);
      });
    }
  };

  window.FonsecaAuth = api;
})();
