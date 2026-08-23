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
  let loadPromise = null;
  let initPromise = null;
  let hooks = { onSignedIn: function () {}, onSignedOut: function () {} };
  let sessionVersion = 0;
  let warned = false;
  const authCallbackPattern = /(?:^#|[&#])(?:access_token|refresh_token|error|error_code|error_description)=/;
  let callbackHash = enabled && authCallbackPattern.test(window.location.hash)
    ? window.location.hash
    : "";

  const warnOnce = (message, detail) => {
    if (!warned) {
      warned = true;
      console.warn("FonsecaAuth: " + message, detail || "");
    }
  };

  const notify = (name, value) => {
    try {
      hooks[name](value);
    } catch (err) {
      warnOnce("a page callback failed.", err);
    }
  };

  const clearCallbackHash = () => {
    const shouldClearUrl = callbackHash && window.location.hash === callbackHash;
    callbackHash = "";
    if (shouldClearUrl) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  // Inject the Supabase JS client from the CDN; resolves with the library.
  const loadSupabase = () => {
    if (window.supabase && window.supabase.createClient) {
      return Promise.resolve(window.supabase);
    }
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
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
    return loadPromise;
  };

  // Fetch the signed-in user's profile row; notify hooks accordingly.
  const resolveSession = (session) => {
    const version = ++sessionVersion;
    if (!session || !session.user) {
      notify("onSignedOut");
      return Promise.resolve();
    }

    return Promise.resolve()
      .then(() => client
        .from("profiles")
        .select("id, full_name, role, client_type")
        .eq("id", session.user.id)
        .single())
      .then((result) => {
        if (version !== sessionVersion) return;
        if (result.error || !result.data) {
          warnOnce("could not load profile (check RLS policies); treating as signed out.", result.error);
          notify("onSignedOut");
        } else {
          notify("onSignedIn", result.data);
        }
      })
      .catch((err) => {
        if (version !== sessionVersion) return;
        warnOnce("profile lookup failed; treating as signed out.", err);
        notify("onSignedOut");
      });
  };

  const handleAuthChange = (event, session) => {
    if (event === "SIGNED_OUT") {
      return resolveSession(null);
    }
    if (
      event === "INITIAL_SESSION" ||
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "USER_UPDATED"
    ) {
      return resolveSession(session);
    }
    return Promise.resolve();
  };

  const api = {
    enabled: enabled,

    get handlingRedirect() {
      return Boolean(callbackHash);
    },

    init: (userHooks) => {
      if (userHooks) {
        if (userHooks.onSignedIn) hooks.onSignedIn = userHooks.onSignedIn;
        if (userHooks.onSignedOut) hooks.onSignedOut = userHooks.onSignedOut;
      }
      if (!enabled) return Promise.resolve();
      if (initPromise) return initPromise;

      initPromise = loadSupabase()
        .then((supabase) => {
          // Persona navigation must not discard Supabase's callback tokens while
          // the CDN is loading. Restore the captured callback hash if needed.
          if (callbackHash && window.location.hash !== callbackHash) {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search + callbackHash
            );
          }
          client = supabase.createClient(config.url, config.anonKey);
          window.dispatchEvent(new CustomEvent("fonseca-auth-client-ready", {
            detail: { client: client }
          }));
          client.auth.onAuthStateChange((event, session) => {
            handleAuthChange(event, session);
          });
          // The client initializes automatically and detects magic-link data in
          // the URL. getSession() waits for that initialization to finish.
          return client.auth.getSession();
        })
        .then((result) => {
          clearCallbackHash();
          if (result.error) {
            warnOnce("could not restore the sign-in session; staying signed out.", result.error);
            return resolveSession(null);
          }
          return resolveSession(result.data ? result.data.session : null);
        })
        .catch((err) => {
          clearCallbackHash();
          warnOnce("initialization failed; staying in signed-out state.", err);
          return resolveSession(null);
        });
      return initPromise;
    },

    signInWithEmail: (email) => {
      if (!enabled) {
        return Promise.resolve({ ok: false, error: "Sign-in is not available in demo mode." });
      }
      if (!client) {
        return Promise.resolve({ ok: false, error: "The sign-in service could not be reached. Check your connection and reload." });
      }
      const redirectTo = window.location.href.split("#")[0];
      return Promise.resolve()
        .then(() => client.auth.signInWithOtp({
          email: email,
          options: { emailRedirectTo: redirectTo }
        }))
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
      return Promise.resolve()
        .then(() => client.auth.signOut())
        .then((result) => {
          if (result && result.error) {
            warnOnce("sign-out failed.", result.error);
          }
        })
        .catch((err) => {
          warnOnce("sign-out failed.", err);
        });
    }
  };

  window.FonsecaAuth = api;
})();
