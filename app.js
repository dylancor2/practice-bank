/* Practice Bank - a pretend banking app for practice and testing.
   Nothing here talks to a server. No real money moves. */
(function () {
  "use strict";

  // ---------- config + tester overrides ----------
  const DEFAULTS = JSON.parse(JSON.stringify(window.PRACTICE_CONFIG));
  const LS_KEY = "practiceBank.testerOverrides";
  let cfg = JSON.parse(JSON.stringify(DEFAULTS));

  function loadOverrides() {
    try {
      const o = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (!o) return;
      if (o.userName) cfg.userName = o.userName;
      if (isFinite(o.chk)) cfg.accounts[0].balance = +o.chk;
      if (isFinite(o.sav) && cfg.accounts[1]) cfg.accounts[1].balance = +o.sav;
      if (isFinite(o.spend)) cfg.monthlySpending = +o.spend;
      if (isFinite(o.limit)) cfg.recipientDailyLimit = +o.limit;
      if (typeof o.deduct === "boolean") cfg.deductBalance = o.deduct;
      if (typeof o.notif === "boolean") cfg.showNotification = o.notif;
    } catch (e) { /* storage unavailable - use defaults */ }
  }
  loadOverrides();

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const money = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPhone = d => {
    d = String(d).replace(/\D/g, "");
    if (d.length === 11 && d[0] === "1") d = d.slice(1);
    if (d.length !== 10) return d;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = new Date();

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 1800);
  }

  // ---------- static text ----------
  document.title = cfg.bankName;
  document.querySelectorAll(".svc-name").forEach(el => (el.textContent = cfg.sendServiceName));
  $("#notifApp").textContent = cfg.bankName;

  // ---------- home ----------
  function renderHome() {
    $("#accountCards").innerHTML = cfg.accounts.map(a => `
      <div class="acct-card">
        <div class="acct-name">${esc(a.name)}</div>
        <button class="acct-more nofunc" aria-label="More options"><i></i><i></i><i></i></button>
        <div class="acct-label">Available balance</div>
        <div class="acct-bal">${money(a.balance)}</div>
        <div class="acct-last4">${esc(a.last4)}</div>
      </div>`).join("");
    $("#spendAmt").textContent = money(cfg.monthlySpending);
    $("#spendAsOf").textContent = `As of ${today.getMonth() + 1}/${today.getDate()}`;
    $("#spendMonth").textContent = today.toLocaleString("en-US", { month: "long" });
  }

  // ---------- navigation ----------
  const stack = ["s-home"];
  let ignorePops = 0;

  function show(id, dir) {
    const cur = document.getElementById(stack[stack.length - 1]);
    const next = document.getElementById(id);
    if (dir === "forward") {
      cur.classList.remove("active");
      cur.classList.add("behind");
      next.classList.remove("behind");
      next.classList.add("active");
      stack.push(id);
    }
  }

  function go(id) {
    show(id, "forward");
    try { history.pushState({ s: id }, ""); } catch (e) {}
    onEnter(id);
  }

  function doBack() {
    if (stack.length <= 1) return;
    const cur = document.getElementById(stack.pop());
    const prev = document.getElementById(stack[stack.length - 1]);
    cur.classList.remove("active", "behind");
    prev.classList.remove("behind");
    prev.classList.add("active");
    document.activeElement && document.activeElement.blur();
    onEnter(prev.id);
  }

  function back() {
    if (stack.length <= 1) return;
    try { history.back(); } catch (e) { doBack(); }
  }

  function goHome() {
    const n = stack.length - 1;
    document.activeElement && document.activeElement.blur();
    document.querySelectorAll(".screen").forEach(s => {
      s.classList.add("no-anim");
      s.classList.remove("active", "behind");
    });
    const home = $("#s-home");
    home.classList.add("active");
    stack.length = 1;
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll(".screen").forEach(s => s.classList.remove("no-anim"))));
    renderHome();
    if (n > 0) { ignorePops++; try { history.go(-n); } catch (e) { ignorePops = 0; } }
  }

  window.addEventListener("popstate", () => {
    if (ignorePops > 0) { ignorePops--; return; }
    doBack();
  });

  document.addEventListener("click", e => {
    const a = e.target.closest("[data-action]");
    if (a) {
      if (a.dataset.action === "back") back();
      if (a.dataset.action === "cancel") goHome();
      return;
    }
    if (e.target.closest(".nofunc")) toast("Not available in practice mode");
  });

  function onEnter(id) {
    if (id === "s-search") setTimeout(() => $("#searchInput").focus(), 330);
  }

  // ---------- recipients ----------
  let recipient = null;

  function avatarHTML(r, lg) {
    const ch = r.isContact ? r.name.trim()[0].toUpperCase() : "#";
    return `<div class="avatar${lg ? " lg" : ""}">${esc(ch)}<span class="badge">${esc(cfg.sendServiceName[0])}</span></div>`;
  }

  function contactRow(c) {
    const r = { name: c.name, phone: c.phone, isContact: true };
    return `<button class="contact" data-name="${esc(c.name)}" data-phone="${esc(c.phone)}">
      ${avatarHTML(r)}
      <div class="c-text"><div class="c-name">${esc(c.name)}</div><div class="c-phone">${fmtPhone(c.phone)}</div></div>
      <span class="chev"></span></button>`;
  }

  function renderRecipientLists() {
    $("#recentList").innerHTML = cfg.contacts.map(contactRow).join("");
    $("#registeredList").innerHTML = (cfg.registered || []).map(contactRow).join("");
  }

  document.addEventListener("click", e => {
    const c = e.target.closest(".contact");
    if (!c) return;
    if (c.dataset.new) pickRecipient({ name: fmtPhone(c.dataset.phone), phone: c.dataset.phone, isContact: false });
    else pickRecipient({ name: c.dataset.name, phone: c.dataset.phone, isContact: true });
  });

  function pickRecipient(r) {
    recipient = r;
    resetAmountScreen();
    go("s-amount");
  }

  // search
  const searchInput = $("#searchInput");
  function validNumber(q) {
    let d = q.replace(/\D/g, "");
    if (d.length === 11 && d[0] === "1") d = d.slice(1);
    const onlyPhoneChars = /^[\d\s()+\-.]+$/.test(q.trim());
    return onlyPhoneChars && d.length === 10 ? d : null;
  }
  function renderSearch() {
    const q = searchInput.value.trim();
    const all = cfg.contacts.concat(cfg.registered || []);
    const digits = q.replace(/\D/g, "");
    const box = $("#searchResults");
    if (!q) { box.innerHTML = all.map(contactRow).join(""); return; }
    const ql = q.toLowerCase();
    const matches = all.filter(c => c.name.toLowerCase().includes(ql) || (digits.length > 0 && c.phone.includes(digits)));
    const num = validNumber(q);
    let html = "";
    if (num) {
      const r = { name: fmtPhone(num), phone: num, isContact: false };
      html += `<div class="sr-label">Send to this number</div>
        <button class="contact sr-new" data-new="1" data-phone="${num}">
          ${avatarHTML(r)}
          <div class="c-text"><div class="c-name">${fmtPhone(num)}</div><div class="c-phone">Mobile number</div></div>
          <span class="chev"></span></button>`;
    }
    if (matches.length) {
      if (num) html += `<div class="sr-label">Contacts</div>`;
      html += matches.map(contactRow).join("");
    }
    if (!html) {
      html = /^[\d\s()+\-.]+$/.test(q) && digits.length < 10
        ? `<div class="sr-empty">Keep typing &mdash; enter the full 10-digit mobile number.</div>`
        : `<div class="sr-empty">No recipients found.<br>Try a name or a 10-digit mobile number.</div>`;
    }
    box.innerHTML = html;
  }
  searchInput.addEventListener("input", renderSearch);
  searchInput.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const num = validNumber(searchInput.value);
    if (num) { searchInput.blur(); pickRecipient({ name: fmtPhone(num), phone: num, isContact: false }); return; }
    const first = $("#searchResults .contact");
    if (first && $("#searchResults").querySelectorAll(".contact").length === 1) first.click();
  });
  $("#openSearch").addEventListener("click", () => {
    searchInput.value = "";
    renderSearch();
    go("s-search");
  });

  $("#btnSend").addEventListener("click", () => go("s-recipient"));

  // ---------- recipient header blocks ----------
  const personIcon = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#5aa0ff" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`;
  const calIcon = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#dbe5f5" stroke-width="2"><rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 10h16"/></svg>`;
  const docIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`;

  function recipBlockHTML(r, opts = {}) {
    const name = r.isContact ? r.name : fmtPhone(r.phone);
    const lines = [`<div class="r-name">${esc(name)}</div>`];
    lines.push(`<div class="r-sub">Registered as ${esc(name)}</div>`);
    if (r.isContact) lines.push(`<div class="r-sub">${fmtPhone(r.phone)}</div>`);
    if (!opts.compact) {
      lines.push(`<div class="r-acct">${personIcon} Personal account</div>`);
      lines.push(`<div class="r-badge">${calIcon} ${esc(cfg.sendServiceName)}&reg; ID active since Oct 2025</div>`);
    }
    return `${avatarHTML(r, true)}<div class="r-text">${lines.join("")}</div>${opts.doc ? `<span class="r-doc">${docIcon}</span>` : ""}`;
  }

  // ---------- amount ----------
  const amountInput = $("#amountInput");
  const amtWrap = amountInput.parentElement;
  let amountStr = "";

  function amountValue() { return parseFloat(amountStr) || 0; }
  function renderAmount() { $("#amountDisplay").textContent = money(amountValue()); }

  amountInput.addEventListener("input", () => {
    let v = amountInput.value.replace(/[^\d.]/g, "");
    const firstDot = v.indexOf(".");
    if (firstDot !== -1) v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
    let [i, d] = v.split(".");
    i = (i || "").replace(/^0+(?=\d)/, "").slice(0, 5);
    if (d !== undefined) d = d.slice(0, 2);
    v = d !== undefined ? (i || "0") + "." + d : i;
    amountInput.value = v;
    amountStr = v;
    $("#amtError").hidden = true;
    renderAmount();
  });
  amountInput.addEventListener("focus", () => amtWrap.classList.add("focus"));
  amountInput.addEventListener("blur", () => amtWrap.classList.remove("focus"));
  amountInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("#msgInput").focus(); } });

  const msgInput = $("#msgInput");
  msgInput.addEventListener("input", () => {
    $("#msgCounter").textContent = `${140 - msgInput.value.length} of 140 characters remaining`;
  });
  msgInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); msgInput.blur(); } });

  function renderPayFrom() {
    const sel = $("#payFrom");
    const prev = sel.value;
    sel.innerHTML = cfg.accounts.map(a =>
      `<option value="${esc(a.id)}">${esc(a.name)} (...${esc(a.last4)}) ${money(a.balance)}</option>`).join("");
    if (prev && cfg.accounts.some(a => a.id === prev)) sel.value = prev;
  }

  function resetAmountScreen() {
    amountStr = "";
    amountInput.value = "";
    renderAmount();
    msgInput.value = "";
    $("#msgCounter").textContent = "140 of 140 characters remaining";
    $("#amtError").hidden = true;
    $("#repeatToggle").checked = false;
    $("#amtLimit").textContent = `Today's limit for this recipient is ${money(cfg.recipientDailyLimit)}.`;
    renderPayFrom();
    $("#payFrom").value = cfg.accounts[0].id;
    $("#amtRecip").innerHTML = recipBlockHTML(recipient, { doc: true });
    $("#s-amount .scroll").scrollTop = 0;
  }

  function amountError(msg) {
    $("#amtErrorText").textContent = msg;
    $("#amtError").hidden = false;
    $("#s-amount .scroll").scrollTo({ top: 0, behavior: "smooth" });
  }

  $("#btnReview").addEventListener("click", () => {
    const amt = amountValue();
    const acct = cfg.accounts.find(a => a.id === $("#payFrom").value) || cfg.accounts[0];
    if (amt <= 0) return amountError("Please tell us an amount.");
    if (amt > cfg.recipientDailyLimit) return amountError(`The most you can send this recipient today is ${money(cfg.recipientDailyLimit)}.`);
    if (amt > acct.balance) return amountError("This is more than your available balance.");
    document.activeElement && document.activeElement.blur();
    fillReview(amt, acct);
    go("s-review");
  });

  // ---------- review ----------
  let pending = null;
  function fillReview(amt, acct) {
    pending = { amt, acct, msg: msgInput.value.trim(), repeat: $("#repeatToggle").checked };
    $("#revRecip").innerHTML = recipBlockHTML(recipient);
    $("#revAmt").textContent = money(amt);
    $("#revAs").textContent = cfg.userName;
    $("#revFrom").textContent = `${acct.name} (...${acct.last4})`;
    $("#revDate").textContent = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    $("#revMsg").textContent = pending.msg || "None";
    $("#revRepeatRow").hidden = !pending.repeat;
    const b = $("#btnSendNow");
    b.classList.remove("busy");
    b.disabled = false;
    b.querySelector(".spinner").hidden = true;
  }

  $("#btnSendNow").addEventListener("click", () => {
    const b = $("#btnSendNow");
    if (b.disabled) return;
    b.disabled = true;
    b.classList.add("busy");
    b.querySelector(".spinner").hidden = false;
    setTimeout(() => {
      if (cfg.deductBalance) pending.acct.balance = Math.round((pending.acct.balance - pending.amt) * 100) / 100;
      renderHome();
      showConfirmation();
    }, cfg.sendDelayMs);
  });

  // ---------- confirmation ----------
  function showConfirmation() {
    const numberText = fmtPhone(recipient.phone);
    $("#confTitle").textContent = `${numberText} received your money.`;
    $("#confAmt").textContent = money(pending.amt);
    $("#confRecip").innerHTML = recipBlockHTML(recipient, { compact: true });
    const body = $("#s-confirm .confirm-body");
    body.classList.remove("play");
    void body.offsetWidth;
    body.classList.add("play");
    go("s-confirm");
    if (cfg.showNotification) {
      setTimeout(() => {
        $("#notifMsg").innerHTML = `${esc(numberText)} received your ${money(pending.amt)} ${esc(cfg.sendServiceName)}&reg; payment.`;
        const n = $("#notif");
        n.hidden = false;
        requestAnimationFrame(() => n.classList.add("show"));
        clearTimeout(showConfirmation._t);
        showConfirmation._t = setTimeout(hideNotif, 4000);
      }, 900);
    }
  }
  function hideNotif() {
    const n = $("#notif");
    n.classList.remove("show");
    setTimeout(() => (n.hidden = true), 400);
  }
  $("#notif").addEventListener("click", hideNotif);
  $("#btnDone").addEventListener("click", () => { hideNotif(); goHome(); });

  // ---------- tester panel (tap practice bar 3x) ----------
  let taps = [];
  $("#practiceBar").addEventListener("click", () => {
    const now = Date.now();
    taps = taps.filter(t => now - t < 900);
    taps.push(now);
    if (taps.length >= 3) { taps = []; openTester(); }
  });
  function openTester() {
    $("#tName").value = cfg.userName;
    $("#tChk").value = cfg.accounts[0].balance.toFixed(2);
    $("#tSav").value = cfg.accounts[1] ? cfg.accounts[1].balance.toFixed(2) : "";
    $("#tSpend").value = Number(cfg.monthlySpending).toFixed(2);
    $("#tLimit").value = Number(cfg.recipientDailyLimit).toFixed(2);
    $("#tDeduct").checked = !!cfg.deductBalance;
    $("#tNotif").checked = !!cfg.showNotification;
    $("#tester").hidden = false;
  }
  $("#tClose").addEventListener("click", () => ($("#tester").hidden = true));
  $("#tSave").addEventListener("click", () => {
    const num = (v, f) => { const n = parseFloat(String(v).replace(/[$,]/g, "")); return isFinite(n) ? n : f; };
    const o = {
      userName: $("#tName").value.trim() || DEFAULTS.userName,
      chk: num($("#tChk").value, cfg.accounts[0].balance),
      sav: num($("#tSav").value, cfg.accounts[1] ? cfg.accounts[1].balance : 0),
      spend: num($("#tSpend").value, cfg.monthlySpending),
      limit: num($("#tLimit").value, cfg.recipientDailyLimit),
      deduct: $("#tDeduct").checked,
      notif: $("#tNotif").checked
    };
    try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) {}
    cfg = JSON.parse(JSON.stringify(DEFAULTS));
    cfg.userName = o.userName; cfg.accounts[0].balance = o.chk;
    if (cfg.accounts[1]) cfg.accounts[1].balance = o.sav;
    cfg.monthlySpending = o.spend; cfg.recipientDailyLimit = o.limit;
    cfg.deductBalance = o.deduct; cfg.showNotification = o.notif;
    $("#tester").hidden = true;
    goHome();
    toast("Tester settings saved");
  });
  $("#tReset").addEventListener("click", () => {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    cfg = JSON.parse(JSON.stringify(DEFAULTS));
    $("#tester").hidden = true;
    goHome();
    toast("Reset to defaults");
  });

  // ---------- init ----------
  renderHome();
  renderRecipientLists();
  try { history.replaceState({ s: "s-home" }, ""); } catch (e) {}

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
