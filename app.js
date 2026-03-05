(() => {
  // Full CPM table (1–51, includes .5)
  const CPM = {
    1:0.094,1.5:0.135137432,2:0.16639787,2.5:0.192650919,3:0.21573247,3.5:0.236572661,4:0.25572005,4.5:0.273530381,
    5:0.29024988,5.5:0.306057377,6:0.3210876,6.5:0.335445036,7:0.34921268,7.5:0.362457751,8:0.37523559,8.5:0.387592406,
    9:0.39956728,9.5:0.411193551,10:0.4225,10.5:0.432926419,11:0.44310755,11.5:0.4530599578,12:0.46279839,12.5:0.472336083,
    13:0.48168495,13.5:0.4908558,14:0.49985844,14.5:0.508701765,15:0.51739395,15.5:0.525942511,16:0.53435433,16.5:0.542635767,
    17:0.55079269,17.5:0.558830576,18:0.56675452,18.5:0.574569153,19:0.58227891,19.5:0.589887917,20:0.5974,20.5:0.604818814,
    21:0.61215729,21.5:0.619399365,22:0.62656713,22.5:0.633644533,23:0.64065295,23.5:0.647576426,24:0.65443563,24.5:0.661214806,
    25:0.667934,25.5:0.674577537,26:0.68116492,26.5:0.687680648,27:0.69414365,27.5:0.700538673,28:0.70688421,28.5:0.713164996,
    29:0.71939909,29.5:0.725571552,30:0.7317,30.5:0.734741009,31:0.73776948,31.5:0.740785574,32:0.74378943,32.5:0.746781211,
    33:0.74976104,33.5:0.752729087,34:0.75568551,34.5:0.758630378,35:0.76156384,35.5:0.764486065,36:0.76739717,36.5:0.770297266,
    37:0.7731865,37.5:0.776064962,38:0.77893275,38.5:0.781790055,39:0.78463697,39.5:0.787473578,40:0.7903,
    40.5:0.792803968,41:0.79530001,41.5:0.797800015,42:0.8003,42.5:0.802799995,43:0.8053,43.5:0.8078,44:0.81029999,
    44.5:0.812799985,45:0.81529999,45.5:0.81779999,46:0.82029999,46.5:0.82279999,47:0.82529999,47.5:0.82779999,48:0.83029999,
    48.5:0.83279999,49:0.83529999,49.5:0.83779999,50:0.84029999,50.5:0.84279999,51:0.84529999
  };

  const $ = (id) => document.getElementById(id);

  // Register SW (PWA)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }

  // Offline pill
  const setOffline = () => $("offlinePill").textContent = "Offline: " + (navigator.onLine ? "No" : "Yes");
  window.addEventListener("online", setOffline);
  window.addEventListener("offline", setOffline);
  setOffline();

  // Local storage helpers
  const lsGet = (k, fallback) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  const normalizeName = (s) => {
    s = (s || "").trim();
    if (!s) return "";
    return s.split(/\s+/).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  };

  const toNum = (v) => {
    const n = parseFloat(String(v).replace(/,/g,""));
    return Number.isFinite(n) ? n : null;
  };

  // Offline base stat DB (starter)
  const START_DB = {
    "Jellicent": {atk:159, def:178, sta:225},
    "Medicham": {atk:121, def:152, sta:155},
    "Dunsparce": {atk:131, def:128, sta:225},
    "Azumarill": {atk:112, def:152, sta:225},
    "Stunfisk": {atk:144, def:171, sta:240},
    "Talonflame": {atk:176, def:155, sta:186}
  };

  let DB = lsGet("baseDB", null);
  if (!DB) { DB = START_DB; lsSet("baseDB", DB); }

  const refreshList = () => {
    const dl = $("pokeList");
    dl.innerHTML = "";
    Object.keys(DB).sort().forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      dl.appendChild(opt);
    });
  };
  refreshList();

  const fillFromDB = (name) => {
    const key = normalizeName(name);
    const found = DB[key];
    if (!found) return false;
    $("baseAtk").value = found.atk;
    $("baseDef").value = found.def;
    $("baseSta").value = found.sta;
    return true;
  };

  $("pokeNameDB").addEventListener("input", (e) => fillFromDB(e.target.value));

  $("saveBase").addEventListener("click", () => {
    const name = normalizeName($("pokeNameDB").value);
    const atk = toNum($("baseAtk").value);
    const def = toNum($("baseDef").value);
    const sta = toNum($("baseSta").value);
    if (!name || atk===null || def===null || sta===null) return alert("Need name + base ATK/DEF/STA.");
    DB[name] = {atk:Math.round(atk), def:Math.round(def), sta:Math.round(sta)};
    lsSet("baseDB", DB);
    refreshList();
    alert("Saved: " + name);
  });

  $("exportDB").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(DB, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pogo_base_stats_db.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("importDB").addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      DB = {...DB, ...obj};
      lsSet("baseDB", DB);
      refreshList();
      alert("Imported DB.");
    } catch {
      alert("Invalid JSON.");
    }
    e.target.value = "";
  });

  // Core formulas
  const cpm = (level) => CPM[parseFloat(level)];
  const cpFormula = (base, iv, level) => {
    const m = cpm(level);
    const A = (base.atk + iv.a) * m;
    const D = (base.def + iv.d) * m;
    const S = (base.sta + iv.s) * m;
    return Math.floor((A * Math.sqrt(D) * Math.sqrt(S)) / 10);
  };

  const rawStats = (base, iv, level, isShadow, shadowMode) => {
    const m = cpm(level);
    if (!m) throw new Error("No CPM for that level.");
    let atk = (base.atk + iv.a) * m;
    let def = (base.def + iv.d) * m;
    let hp  = (base.sta + iv.s) * m;

    if (isShadow && shadowMode === "pvpoke") {
      atk *= 1.2;
      def *= (5/6);
    }
    return { atk, def, hp, hpInt: Math.floor(hp) };
  };

  const rating = (role, netBulk) => {
    // Your built-in defaults; easy to adjust later
    const bulky = [
      ["Elite", -1], ["Very Good", -2], ["Good", -4], ["Acceptable", -5], ["Reject", -999]
    ];
    const squishy = [
      ["Elite", -1], ["Very Good", -2], ["Good", -4], ["Acceptable", -6], ["Reject", -999]
    ];
    const table = role === "squishy" ? squishy : bulky;
    if (netBulk >= table[0][1]) return "Elite";
    if (netBulk >= table[1][1]) return "Very Good";
    if (netBulk >= table[2][1]) return "Good";
    if (netBulk >= table[3][1]) return "Acceptable";
    return "Reject";
  };

  // PvPoke paste parse
  const parsePaste = (text) => {
    const t = (text||"").replace(/\t/g," ").replace(/\u00A0/g," ");
    const nameMatch = t.match(/^\s*([A-Za-z][A-Za-z0-9'\-\. ]+)/m);
    const name = nameMatch ? normalizeName(nameMatch[1].split(/—|\(|\n/)[0].trim()) : "";
    const lv = t.match(/\bLevel\s*[:@]?\s*(\d+(?:\.5)?)/i);
    const iv1 = t.match(/IVs?\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/i);
    const iv2 = t.match(/\(\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s*\)/);
    const ivm = iv1 || iv2;
    return {
      name,
      level: lv ? parseFloat(lv[1]) : null,
      iv: ivm ? {a:+ivm[1], d:+ivm[2], s:+ivm[3]} : null
    };
  };

  const applyParsed = (side, p) => {
    if (p.name) $(side+"Name").value = p.name;
    if (p.level!==null) $(side+"Level").value = p.level;
    if (p.iv) { $(side+"IVa").value=p.iv.a; $(side+"IVd").value=p.iv.d; $(side+"IVs").value=p.iv.s; }
  };

  $("parseIdeal").addEventListener("click", () => {
    const p = parsePaste($("pvpokePaste").value);
    applyParsed("ideal", p);
    $("parseMsg").textContent = "Parsed → Ideal: " + (p.name || "(no name)");
  });
  $("parseOwned").addEventListener("click", () => {
    const p = parsePaste($("pvpokePaste").value);
    applyParsed("owned", p);
    $("parseMsg").textContent = "Parsed → Owned: " + (p.name || "(no name)");
  });
  $("clearPaste").addEventListener("click", () => { $("pvpokePaste").value=""; $("parseMsg").textContent=""; });

  // Midpoint
  const parseMid = (text) => {
    const t = (text||"").replace(/,/g,"");
    const get = (k) => {
      const m = t.match(new RegExp(k + "\\s*[:@]?\\s*(\\d+(?:\\.\\d+)?)","i"));
      return m ? parseFloat(m[1]) : null;
    };
    return {level:get("Level"), cp:get("CP"), atk:get("ATK"), def:get("DEF"), hp:get("HP")};
  };

  $("midBtn").addEventListener("click", () => {
    const a = parseMid($("midA").value);
    const b = parseMid($("midB").value);
    for (const k of ["level","cp","atk","def","hp"]) {
      if (a[k]===null || b[k]===null) return $("midOut").innerHTML = `<span class="bad">Missing ${k} in A or B.</span>`;
    }
    const mid = {
      level:(a.level+b.level)/2, cp:(a.cp+b.cp)/2, atk:(a.atk+b.atk)/2, def:(a.def+b.def)/2, hp:(a.hp+b.hp)/2
    };
    $("midOut").innerHTML =
      `<div><span class="k">Level</span> <span class="v">${mid.level.toFixed(2)}</span></div>
       <div><span class="k">CP</span> <span class="v">${mid.cp.toFixed(2)}</span></div>
       <div><span class="k">ATK</span> <span class="v">${mid.atk.toFixed(2)}</span></div>
       <div><span class="k">DEF</span> <span class="v">${mid.def.toFixed(2)}</span></div>
       <div><span class="k">HP</span> <span class="v">${mid.hp.toFixed(2)}</span></div>`;
  });

  $("midClear").addEventListener("click", () => { $("midA").value=""; $("midB").value=""; $("midOut").innerHTML=""; });

  // Breakpoint helper (fast move damage)
  // Standard PoGo damage: floor(0.5 * power * (Atk/Def) * STAB * Eff * ShadowMods) + 1
  const fastDamage = ({atk, def, pow, stab, eff, shAtk, shDef}) => {
    let A = atk, D = def;
    if (shAtk) A *= 1.2;
    if (shDef) D *= (5/6);
    const raw = 0.5 * pow * (A / D) * stab * eff;
    return Math.floor(raw) + 1;
  };

  $("bpBtn").addEventListener("click", () => {
    const atk = toNum($("bpAtk").value);
    const defA = toNum($("bpDefA").value);
    const defB = toNum($("bpDefB").value);
    const pow = toNum($("bpPow").value) ?? 3;
    const stab = toNum($("bpStab").value) ?? 1;
    const eff = toNum($("bpEff").value) ?? 1;
    const shAtk = $("bpShadowAtk").value === "1";
    const shDef = $("bpShadowDef").value === "1";
    if (atk===null || defA===null || defB===null) return $("bpOut").innerHTML = `<span class="bad">Fill attacker ATK and both defender DEF values.</span>`;

    const dmgA = fastDamage({atk, def:defA, pow, stab, eff, shAtk, shDef});
    const dmgB = fastDamage({atk, def:defB, pow, stab, eff, shAtk, shDef});
    const diff = dmgB - dmgA;

    let tag = "";
    if (diff === 0) tag = `<span class="k">No breakpoint difference</span>`;
    else if (diff >= 1) tag = `<span class="bad">B takes +${diff} per fast move vs A</span>`;
    else tag = `<span class="ok">B takes ${diff} per fast move vs A</span>`;

    $("bpOut").innerHTML =
      `<div><span class="k">Damage vs DEF(A)</span> <span class="v">${dmgA}</span></div>
       <div><span class="k">Damage vs DEF(B)</span> <span class="v">${dmgB}</span></div>
       <div>${tag}</div>`;
  });

  // Main calculation
  const readSide = (prefix) => {
    const name = normalizeName($(prefix+"Name").value);
    const level = parseFloat($(prefix+"Level").value);
    const iv = { a:+$(prefix+"IVa").value, d:+$(prefix+"IVd").value, s:+$(prefix+"IVs").value };
    const shadow = $(prefix+"Shadow").value === "1";
    return {name, level, iv, shadow};
  };

  const getBase = (name) => {
    const key = normalizeName(name);
    const base = DB[key];
    if (!base) throw new Error(`No base stats saved for: ${name}. Add it in Base Stats DB.`);
    return base;
  };

  const fmt = (n) => (Math.round(n*100)/100).toFixed(2);

  const calc = () => {
    const cap = +$("league").value;
    const shadowMode = $("shadowMode").value;
    const bulkMode = $("bulkMode").value;
    const role = $("role").value;

    const I = readSide("ideal");
    const O = readSide("owned");

    const baseI = getBase(I.name);
    const baseO = getBase(O.name);

    const cpI = cpFormula(baseI, I.iv, I.level);
    const cpO = cpFormula(baseO, O.iv, O.level);

    const stI = rawStats(baseI, I.iv, I.level, I.shadow, shadowMode);
    const stO = rawStats(baseO, O.iv, O.level, O.shadow, shadowMode);

    const hpI = bulkMode === "raw" ? stI.hp : stI.hpInt;
    const hpO = bulkMode === "raw" ? stO.hp : stO.hpInt;

    const dAtk = stO.atk - stI.atk;
    const netBulk = (stO.def - stI.def) + (hpO - hpI);

    const oppAtk = toNum($("oppAtk").value);
    const cmpTarget = (oppAtk!==null) ? oppAtk : stI.atk;

    const cmp =
      stO.atk > cmpTarget ? `<span class="ok">CMP wins</span>` :
      stO.atk < cmpTarget ? `<span class="bad">CMP loses</span>` :
      `<span class="k">CMP tie</span>`;

    $("idealOut").innerHTML =
      `<div class="small">${I.name} • L${I.level} • Shadow: ${I.shadow?"Yes":"No"}</div>
       <div><span class="k">CP</span> <span class="v">${cpI}</span> ${cpI>cap?`<span class="bad">(over cap)</span>`:""}</div>
       <div><span class="k">ATK</span> <span class="v">${fmt(stI.atk)}</span></div>
       <div><span class="k">DEF</span> <span class="v">${fmt(stI.def)}</span></div>
       <div><span class="k">HP</span> <span class="v">${fmt(stI.hp)}</span> <span class="k">(HP_int ${stI.hpInt})</span></div>`;

    $("ownedOut").innerHTML =
      `<div class="small">${O.name} • L${O.level} • Shadow: ${O.shadow?"Yes":"No"}</div>
       <div><span class="k">CP</span> <span class="v">${cpO}</span> ${cpO>cap?`<span class="bad">(over cap)</span>`:""}</div>
       <div><span class="k">ATK</span> <span class="v">${fmt(stO.atk)}</span></div>
       <div><span class="k">DEF</span> <span class="v">${fmt(stO.def)}</span></div>
       <div><span class="k">HP</span> <span class="v">${fmt(stO.hp)}</span> <span class="k">(HP_int ${stO.hpInt})</span></div>`;

    const label = rating(role, netBulk);

    $("compareOut").innerHTML =
      `<div><span class="k">ΔATK</span> <span class="v">${fmt(dAtk)}</span></div>
       <div><span class="k">Net Bulk</span> <span class="v">${fmt(netBulk)}</span> <span class="k">(${bulkMode==="raw"?"raw":"HP_int"})</span></div>
       <div>${cmp} ${oppAtk!==null?`<span class="k">(vs opp ATK ${oppAtk})</span>`:`<span class="k">(vs Ideal)</span>`}</div>
       <div><span class="k">Rating</span> <span class="${label==="Elite"?"ok":(label==="Reject"?"bad":"v")}">${label}</span></div>`;
  };

  $("calcBtn").addEventListener("click", () => {
    try { calc(); } catch(e) { $("compareOut").innerHTML = `<span class="bad">${e.message}</span>`; }
  });

  $("swapBtn").addEventListener("click", () => {
    const fields = ["Name","Level","IVa","IVd","IVs","Shadow"];
    for (const f of fields) {
      const a = $("ideal"+f).value;
      $("ideal"+f).value = $("owned"+f).value;
      $("owned"+f).value = a;
    }
  });

  $("resetBtn").addEventListener("click", () => {
    $("idealName").value=""; $("ownedName").value="";
    $("idealLevel").value=24.5; $("ownedLevel").value=24;
    $("idealIVa").value=0; $("idealIVd").value=15; $("idealIVs").value=15;
    $("ownedIVa").value=0; $("ownedIVd").value=15; $("ownedIVs").value=15;
    $("idealShadow").value="0"; $("ownedShadow").value="0";
    $("oppAtk").value="";
    $("idealOut").innerHTML=""; $("ownedOut").innerHTML=""; $("compareOut").innerHTML="";
  });

  // Small convenience: if you type a name, try autofill base stats in the DB editor
  $("idealName").addEventListener("blur", () => { const n=$("idealName").value; if(n){$("pokeNameDB").value=n; fillFromDB(n);} });
  $("ownedName").addEventListener("blur", () => { const n=$("ownedName").value; if(n){$("pokeNameDB").value=n; fillFromDB(n);} });
})();
