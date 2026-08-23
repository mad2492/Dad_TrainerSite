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

  const profileById = (clientId) => coachState.profiles.find((profile) => profile.id === clientId);
  const formLabel = (caption, control) => {
    const wrapper = make("label", "", caption);
    wrapper.appendChild(control);
    return wrapper;
  };
  const hiddenInput = (name, value) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    return input;
  };
  const selectInput = (name, options) => {
    const select = document.createElement("select");
    select.name = name;
    select.required = true;
    options.forEach((option) => {
      const item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      select.appendChild(item);
    });
    return select;
  };
  const textInput = (name, type, required, placeholder) => {
    const input = document.createElement("input");
    input.name = name;
    input.type = type;
    input.required = Boolean(required);
    if (placeholder) input.placeholder = placeholder;
    return input;
  };

  let dialogAction = null;
  const dialog = () => document.getElementById("coach-action-dialog");
  const dialogForm = () => document.getElementById("coach-action-form");
  const dialogFields = () => hook("coach-dialog-fields");
  const dialogSubmit = () => hook("coach-dialog-submit");

  const addClientChoice = (fields, requestedClientId, onChange) => {
    const profiles = coachState.profiles;
    const selectedId = requestedClientId || (profiles[0] && profiles[0].id) || "";
    if (requestedClientId || profiles.length === 1) {
      fields.appendChild(hiddenInput("client_id", selectedId));
      const profile = profileById(selectedId);
      fields.appendChild(make("p", "signin-note", "Client: " + ((profile && profile.full_name) || "Unnamed client")));
      return selectedId;
    }
    const select = selectInput("client_id", profiles.map((profile) => ({
      value: profile.id,
      label: profile.full_name || "Unnamed client"
    })));
    if (onChange) select.addEventListener("change", () => onChange(select.value));
    fields.appendChild(formLabel("Client", select));
    return selectedId;
  };

  const renderPackageChoice = (container, clientId) => {
    clear(container);
    const packages = clientPackages(clientId).filter((item) => (Number(item.sessions_remaining) || 0) > 0);
    const submit = dialogSubmit();
    if (!packages.length) {
      container.appendChild(make("p", "signin-note", "This client has no package with sessions to log."));
      if (submit) submit.disabled = true;
      return;
    }
    if (submit) submit.disabled = false;
    if (packages.length === 1) {
      container.appendChild(hiddenInput("package_id", packages[0].package_id));
      container.appendChild(make(
        "p",
        "signin-note",
        "Package: " + packages[0].name + " · " + packages[0].sessions_remaining + " sessions left"
      ));
      return;
    }
    container.appendChild(formLabel("Package", selectInput("package_id", packages.map((item) => ({
      value: item.package_id,
      label: item.name + " · " + item.sessions_remaining + " left"
    })))));
  };

  const buildLogSession = (requestedClientId) => {
    const fields = dialogFields();
    const packageHost = make("div", "portal-dialog-fields");
    const selectedId = addClientChoice(fields, requestedClientId, (clientId) => renderPackageChoice(packageHost, clientId));
    fields.appendChild(packageHost);
    renderPackageChoice(packageHost, selectedId);
    const note = document.createElement("textarea");
    note.name = "note";
    note.placeholder = "Optional session note";
    fields.appendChild(formLabel("Session note", note));
  };

  const buildNewInvoice = (requestedClientId) => {
    const fields = dialogFields();
    addClientChoice(fields, requestedClientId);
    const amount = textInput("amount", "number", true, "0.00");
    amount.min = "0.01";
    amount.step = "0.01";
    fields.appendChild(formLabel("Amount", amount));
    fields.appendChild(formLabel("Memo", textInput("memo", "text", true, "Training package")));
    fields.appendChild(formLabel("Method", selectInput("method", [
      { value: "ach", label: "Bank transfer (ACH)" },
      { value: "card", label: "Card" },
      { value: "cash", label: "Cash" }
    ])));
    fields.appendChild(formLabel("Stripe Payment Link (optional)", textInput("pay_link_url", "url", false, "https://buy.stripe.com/…")));
  };

  const buildMarkPaid = (clientId) => {
    const fields = dialogFields();
    const profile = profileById(clientId);
    const invoices = clientInvoices(clientId);
    fields.appendChild(hiddenInput("client_id", clientId));
    fields.appendChild(make("p", "signin-note", "Client: " + ((profile && profile.full_name) || "Unnamed client")));
    if (!invoices.length) {
      fields.appendChild(make("p", "signin-note", "This client has no unpaid invoice."));
      dialogSubmit().disabled = true;
      return;
    }
    if (invoices.length === 1) {
      fields.appendChild(hiddenInput("invoice_id", invoices[0].id));
      fields.appendChild(make("p", "signin-note", (invoices[0].memo || "Training invoice") + " · " + money(invoices[0].amount_cents)));
    } else {
      fields.appendChild(formLabel("Invoice", selectInput("invoice_id", invoices.map((invoice) => ({
        value: invoice.id,
        label: (invoice.memo || "Training invoice") + " · " + money(invoice.amount_cents)
      })))));
    }
  };

  const openCoachDialog = (action, requestedClientId) => {
    if (!enabled || !activeProfile || activeProfile.role !== "coach") return;
    const actionDialog = dialog();
    const fields = dialogFields();
    const submit = dialogSubmit();
    if (!actionDialog || !fields || !submit || typeof actionDialog.showModal !== "function") {
      setCoachState("Coach actions are not supported in this browser.");
      return;
    }
    dialogAction = action;
    clear(fields);
    setText("coach-dialog-note", "");
    submit.disabled = false;
    if (!coachState.profiles.length) {
      setText("coach-dialog-title", "Coach action");
      setText("coach-dialog-intro", "Add a client profile before recording coach actions.");
      submit.disabled = true;
    } else if (action === "log-session") {
      setText("coach-dialog-title", "Log a session");
      setText("coach-dialog-intro", "Record one completed training session.");
      buildLogSession(requestedClientId);
    } else if (action === "new-invoice") {
      setText("coach-dialog-title", "New invoice");
      setText("coach-dialog-intro", "Record an invoice that has already been sent to the client.");
      buildNewInvoice(requestedClientId);
    } else if (action === "mark-paid") {
      setText("coach-dialog-title", "Mark invoice paid");
      setText("coach-dialog-intro", "Confirm the manual payment before updating the invoice.");
      buildMarkPaid(requestedClientId);
    }
    actionDialog.showModal();
  };

  const actionResult = (result, description) => {
    if (result && result.error) {
      throw new Error(description + ": " + (result.error.message || "request failed"));
    }
  };

  const saveCoachAction = (formData) => {
    if (dialogAction === "log-session") {
      return client.from("session_log").insert({
        package_id: formData.get("package_id"),
        coach_id: activeProfile.id,
        note: String(formData.get("note") || "").trim() || null
      }).then((result) => {
        actionResult(result, "Could not log the session");
        return "Session logged. Package totals are refreshed.";
      });
    }
    if (dialogAction === "new-invoice") {
      const amountCents = Math.round(Number(formData.get("amount")) * 100);
      const enteredPayLink = String(formData.get("pay_link_url") || "").trim();
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        return Promise.reject(new Error("Enter an amount greater than zero."));
      }
      if (enteredPayLink && !safePayLink(enteredPayLink)) {
        return Promise.reject(new Error("Enter a complete http or https payment-link URL."));
      }
      return client.from("invoices").insert({
        client_id: formData.get("client_id"),
        amount_cents: amountCents,
        memo: String(formData.get("memo") || "").trim(),
        method: formData.get("method"),
        pay_link_url: enteredPayLink ? safePayLink(enteredPayLink) : null,
        status: "sent",
        sent_at: new Date().toISOString()
      }).then((result) => {
        actionResult(result, "Could not create the invoice");
        return "Invoice recorded as sent.";
      });
    }
    if (dialogAction === "mark-paid") {
      return client.from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", formData.get("invoice_id"))
        .then((result) => {
          actionResult(result, "Could not mark the invoice paid");
          return "Invoice marked paid.";
        });
    }
    return Promise.reject(new Error("Choose a coach action and try again."));
  };

  const showCoachConfirmation = (message) => {
    const confirmation = hook("coach-confirmation");
    if (!confirmation) return;
    const text = confirmation.querySelector("p");
    if (text) text.textContent = message;
    confirmation.hidden = false;
  };

  const initializeCoachActions = () => {
    if (!enabled) return;
    const coachView = document.getElementById("view-coach");
    const actionDialog = dialog();
    const form = dialogForm();
    if (!coachView || !actionDialog || !form) return;

    coachView.addEventListener("click", (event) => {
      const button = event.target.closest("[data-coach-action]");
      if (!button) return;
      openCoachDialog(button.dataset.coachAction, button.dataset.clientId || "");
    });
    actionDialog.querySelector("[data-coach-dialog-cancel]").addEventListener("click", () => actionDialog.close());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const submit = dialogSubmit();
      submit.disabled = true;
      setText("coach-dialog-note", "Saving…");
      Promise.resolve()
        .then(() => saveCoachAction(new FormData(form)))
        .then((message) => window.FonsecaData.refresh().then(() => message))
        .then((message) => {
          actionDialog.close();
          showCoachConfirmation(message);
        })
        .catch((error) => {
          console.warn("FonsecaData:", error);
          setText("coach-dialog-note", error.message || "We could not save that change. Please try again.");
        })
        .finally(() => {
          submit.disabled = false;
        });
    });
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
  initializeCoachActions();
})();
