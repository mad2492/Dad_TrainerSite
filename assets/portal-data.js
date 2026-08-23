/* Fonseca Fitness — live Supabase data binding.
   Loaded after portal-auth.js. In demo mode every method is a silent no-op,
   leaving the static persona samples untouched. */
(function () {
  "use strict";

  const enabled = Boolean(window.FonsecaAuth && window.FonsecaAuth.enabled);
  let client = null;
  let activeProfile = null;
  let coachState = { profiles: [], packages: [], invoices: [] };

  const hook = (name) => document.querySelector('[data-hook="' + name + '"]');
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const setText = (name, value) => {
    const element = hook(name);
    if (element) element.textContent = value;
  };
  const clear = (element) => {
    if (element) element.replaceChildren();
  };
  const showMessage = (element, message) => {
    if (!element) return;
    clear(element);
    const tag = element.tagName === "UL" ? "li" : "p";
    element.appendChild(make(tag, "signin-note", message));
  };
  const money = (cents) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format((Number(cents) || 0) / 100);
  const initials = (name) => String(name || "Client")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";
  const label = (value) => String(value || "Not set")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const safePayLink = (value) => {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch (_) {
      return null;
    }
  };
  const rows = (result, description) => {
    if (result && result.error) {
      throw new Error(description + ": " + (result.error.message || "request failed"));
    }
    return result && Array.isArray(result.data) ? result.data : [];
  };

  const orderRow = (primary, secondary, badge, badgeClass, payLink) => {
    const row = make("div", "cp-order");
    const info = make("span", "cp-order-info");
    info.appendChild(make("span", "cp-order-name", primary));
    info.appendChild(make("span", "cp-order-id", secondary));
    row.appendChild(info);
    if (payLink) {
      const link = make("a", "cp-link", "Pay now");
      link.href = payLink;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      row.appendChild(link);
    } else {
      row.appendChild(make("span", "cp-pill " + badgeClass, badge));
    }
    return row;
  };

  const renderClient = (profile, packages, invoices) => {
    setText("client-title", "Welcome back, " + (profile.full_name || "client"));
    setText("client-plan-title", "This week's training · Sample plan");

    const packageCard = hook("client-packages-card");
    const packageList = hook("client-packages");
    if (packageCard) packageCard.hidden = false;
    clear(packageList);
    if (!packages.length) {
      showMessage(packageList, "No session packages are attached to this account yet.");
    } else {
      packages
        .slice()
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .forEach((item) => {
          const remaining = Number(item.sessions_remaining) || 0;
          packageList.appendChild(orderRow(
            item.name,
            (Number(item.sessions_used) || 0) + " of " + (Number(item.total_sessions) || 0) + " sessions used",
            remaining + " left",
            remaining <= 3 ? "cp-shipped" : "cp-delivered"
          ));
        });
    }

    const invoiceCard = hook("client-invoices-card");
    const invoiceList = hook("client-invoices");
    if (invoiceCard) invoiceCard.hidden = false;
    clear(invoiceList);
    if (!invoices.length) {
      showMessage(invoiceList, "No invoices are attached to this account.");
    } else {
      invoices
        .slice()
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .forEach((invoice) => {
          const status = label(invoice.status);
          invoiceList.appendChild(orderRow(
            invoice.memo || "Training invoice",
            money(invoice.amount_cents) + " · " + status,
            status,
            invoice.status === "paid" ? "cp-shipped" : "cp-delivered",
            invoice.status === "sent" ? safePayLink(invoice.pay_link_url) : null
          ));
        });
    }
  };

  const clientPackages = (clientId) => coachState.packages.filter((item) => item.client_id === clientId);
  const clientInvoices = (clientId) => coachState.invoices.filter((item) => item.client_id === clientId);
  const remainingTone = (remaining) => remaining <= 1 ? "co-is-red" : remaining <= 3 ? "co-is-gold" : "co-is-green";

  const coachClientRow = (profile) => {
    const packages = clientPackages(profile.id);
    const invoices = clientInvoices(profile.id);
    const total = packages.reduce((sum, item) => sum + (Number(item.total_sessions) || 0), 0);
    const remaining = packages.reduce((sum, item) => sum + (Number(item.sessions_remaining) || 0), 0);
    const tone = remainingTone(remaining);
    const item = make("li", "co-client");
    item.dataset.clientId = profile.id;

    const identity = make("div", "co-client-id");
    identity.appendChild(make("span", "co-mono", initials(profile.full_name)));
    const name = make("span", "co-client-name");
    name.appendChild(make("strong", "", profile.full_name || "Unnamed client"));
    name.appendChild(make(
      "span",
      "",
      invoices.length
        ? invoices.length + " unpaid · " + money(invoices.reduce((sum, invoice) => sum + (Number(invoice.amount_cents) || 0), 0))
        : "No open invoice"
    ));
    identity.appendChild(name);
    item.appendChild(identity);

    item.appendChild(make("span", "co-pill" + (profile.client_type === "online" ? " co-is-green" : ""), label(profile.client_type)));
    const packageLabel = make("span", "co-package");
    packageLabel.appendChild(make("b", "", "Package"));
    packageLabel.appendChild(document.createTextNode(packages.length ? packages.map((entry) => entry.name).join(" + ") : "No active package"));
    item.appendChild(packageLabel);

    const meter = make("div", "co-meter");
    if (packages.length) {
      const track = make("span", "co-track");
      const fill = make("span", "co-fill " + tone);
      fill.style.width = Math.max(0, Math.min(100, total ? (remaining / total) * 100 : 0)) + "%";
      track.appendChild(fill);
      meter.appendChild(track);
    }
    meter.appendChild(make("span", "co-left " + tone, packages.length ? remaining + " left" : "None"));
    item.appendChild(meter);

    const actions = make("div", "co-row-actions");
    const logButton = make("button", "co-btn co-small", "Log session");
    logButton.type = "button";
    logButton.dataset.coachAction = "log-session";
    logButton.dataset.clientId = profile.id;
    actions.appendChild(logButton);
    const invoiceButton = make("button", "co-btn co-small " + (invoices.length ? "co-primary" : "co-quiet"), invoices.length ? "Mark paid" : "Invoice");
    invoiceButton.type = "button";
    invoiceButton.dataset.coachAction = invoices.length ? "mark-paid" : "new-invoice";
    invoiceButton.dataset.clientId = profile.id;
    actions.appendChild(invoiceButton);
    item.appendChild(actions);
    return item;
  };

  const attentionRow = (message, strongText) => {
    const item = make("div", "co-attn");
    const text = make("p", "", message);
    if (strongText) text.appendChild(make("b", "", strongText));
    item.appendChild(text);
    return item;
  };

  const renderCoach = (profiles, packages, invoices, sessions) => {
    coachState = { profiles: profiles, packages: packages, invoices: invoices };
    const unpaid = invoices.filter((invoice) => invoice.status === "sent");
    const unpaidTotal = unpaid.reduce((sum, invoice) => sum + (Number(invoice.amount_cents) || 0), 0);
    const lowPackages = packages.filter((item) => (Number(item.sessions_remaining) || 0) <= 3);

    setText("coach-tag", "Live data");
    setText("coach-tagline", "Account data is loaded from Supabase.");
    setText("coach-active-clients", String(profiles.length));
    setText("coach-sessions-week", String(sessions.length));
    setText("coach-unpaid-invoices", unpaid.length + " · " + money(unpaidTotal));
    setText("coach-low-packages", String(lowPackages.length));

    const attention = hook("coach-attention");
    if (attention) {
      attention.querySelectorAll(".co-attn").forEach((item) => item.remove());
      let attentionCount = 0;
      if (unpaid.length) {
        attention.appendChild(attentionRow(unpaid.length + " unpaid invoices · ", money(unpaidTotal)));
        attentionCount += 1;
      }
      if (lowPackages.length) {
        attention.appendChild(attentionRow(lowPackages.length + " packages have 3 or fewer sessions left"));
        attentionCount += 1;
      }
      if (!attentionCount) attention.appendChild(attentionRow("Nothing needs attention right now."));
      setText("coach-attention-count", attentionCount + (attentionCount === 1 ? " item" : " items"));
    }

    const clientList = hook("coach-clients");
    clear(clientList);
    if (!profiles.length) {
      showMessage(clientList, "No client profiles are available yet.");
    } else {
      profiles
        .slice()
        .sort((a, b) => String(a.full_name || "").localeCompare(String(b.full_name || "")))
        .forEach((profile) => clientList.appendChild(coachClientRow(profile)));
    }
  };

  const setClientState = (message) => {
    setText("client-title", message);
    setText("client-plan-title", "This week's training · Sample plan");
    ["client-packages-card", "client-invoices-card"].forEach((name) => {
      const card = hook(name);
      if (card) card.hidden = false;
    });
    showMessage(hook("client-packages"), message);
    showMessage(hook("client-invoices"), message);
  };

  const setCoachState = (message) => {
    coachState = { profiles: [], packages: [], invoices: [] };
    setText("coach-tag", "Live data");
    setText("coach-tagline", message);
    ["coach-active-clients", "coach-sessions-week", "coach-unpaid-invoices", "coach-low-packages"]
      .forEach((name) => setText(name, "—"));
    const attention = hook("coach-attention");
    if (attention) {
      attention.querySelectorAll(".co-attn").forEach((item) => item.remove());
      attention.appendChild(attentionRow(message));
    }
    setText("coach-attention-count", "0 items");
    showMessage(hook("coach-clients"), message);
    const schedule = hook("coach-schedule-card");
    const confirmation = hook("coach-confirmation");
    if (schedule) schedule.hidden = true;
    if (confirmation) confirmation.hidden = true;
  };

  const loadClient = (profile) => {
    setClientState("Loading your account…");
    setCoachState("Coach access is required to view this data.");
    return Promise.all([
      client.from("package_remaining").select("package_id, client_id, name, total_sessions, sessions_used, sessions_remaining"),
      client.from("invoices").select("id, client_id, amount_cents, memo, status, method, pay_link_url, created_at")
    ]).then((results) => {
      renderClient(
        profile,
        rows(results[0], "Could not load session packages"),
        rows(results[1], "Could not load invoices")
      );
    });
  };

  const loadCoach = () => {
    setCoachState("Loading coach data…");
    setClientState("Client data is available to client accounts.");
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    return Promise.all([
      client.from("profiles").select("id, full_name, role, client_type").eq("role", "client"),
      client.from("package_remaining").select("package_id, client_id, name, total_sessions, sessions_used, sessions_remaining"),
      client.from("invoices").select("id, client_id, amount_cents, memo, status, method, pay_link_url, sent_at, created_at").eq("status", "sent"),
      client.from("session_log").select("id, occurred_at").gte("occurred_at", weekStart.toISOString())
    ]).then((results) => {
      renderCoach(
        rows(results[0], "Could not load clients"),
        rows(results[1], "Could not load session packages"),
        rows(results[2], "Could not load invoices"),
        rows(results[3], "Could not load this week's sessions")
      );
    });
  };

  const load = (profile) => {
    if (!enabled) return Promise.resolve();
    activeProfile = profile || null;
    if (!client) {
      const message = "The account service is still loading. Please reload and try again.";
      if (profile && profile.role === "coach") setCoachState(message);
      else setClientState(message);
      return Promise.resolve();
    }
    return Promise.resolve()
      .then(() => profile && profile.role === "coach" ? loadCoach() : loadClient(profile || {}))
      .catch((error) => {
        const message = "We could not load this account right now. Please try again.";
        console.warn("FonsecaData:", error);
        if (profile && profile.role === "coach") setCoachState(message);
        else setClientState(message);
      });
  };

  const reset = () => {
    if (!enabled) return;
    activeProfile = null;
    setClientState("Sign in to view your coaching account.");
    setCoachState("Sign in with a coach account to view live data.");
  };

  window.addEventListener("fonseca-auth-client-ready", (event) => {
    client = event.detail && event.detail.client ? event.detail.client : null;
  });

  window.FonsecaData = {
    enabled: enabled,
    load: load,
    reset: reset,
    refresh: () => activeProfile ? load(activeProfile) : Promise.resolve()
  };
})();
