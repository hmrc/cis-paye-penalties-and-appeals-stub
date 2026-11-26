// ==UserScript==
// @name         PAS Script
// @namespace    http://localhost
// @lastupdate   05/06/2026
// @version      3.7.0
// @description  This script automated logging in to PAS Install Tampermonkey on Chrome or Greasemonkey on Firefox and add this to your userscripts to automate logging in to PAS
// @author       https://github.com/gianick
// @match        http://localhost:9949/gg/sign-in*
// @match        http://localhost:9949/auth-login-stub/gg-sign-in*
// @match        https://www.development.tax.service.gov.uk/auth-login-stub/gg-sign-in*
// @match        https://www.qa.tax.service.gov.uk/auth-login-stub/gg-sign-in*
// @match        https://www.staging.tax.service.gov.uk/auth-login-stub/gg-sign-in*
// @grant        none
// @require      https://code.jquery.com/jquery-latest.min.js
// @updateURL    https://github.com/hmrc/bta-stubs/blob/main/userscripts/bta-login-script.user.js
// ==/UserScript==

// Note: This should match the version on line 5
var scriptVersion = "3.7.0"

var userProfiles = '[' +
    '{ "divider":"Getting Started" }, ' +
    '{ "description":"0 penalties", "enrolmentKey":"HMRC-CIS-ORG", "identifierName":"TaxOfficeNumber", "identifierValue":"100", "identifierName2":"TaxOfficeReference", "identifierValue2":"EF789", "enrolmentStatus":"Activated", "affinityGroup":"Organisation"}, ' +
    '{ "description":"1 penalty", "enrolmentKey":"HMRC-CIS-ORG", "identifierName":"TaxOfficeNumber", "identifierValue":"100", "identifierName2":"TaxOfficeReference", "identifierValue2":"GH012", "enrolmentStatus":"Activated", "affinityGroup":"Organisation"}, ' +
    '{ "description":"3 penalties", "enrolmentKey":"HMRC-CIS-ORG", "identifierName":"TaxOfficeNumber", "identifierValue":"100", "identifierName2":"TaxOfficeReference", "identifierValue2":"AB123", "enrolmentStatus":"Activated", "affinityGroup":"Organisation"}, ' +
    '{ "description":"15 penalties", "enrolmentKey":"HMRC-CIS-ORG", "identifierName":"TaxOfficeNumber", "identifierValue":"100", "identifierName2":"TaxOfficeReference", "identifierValue2":"CD456", "enrolmentStatus":"Activated", "affinityGroup":"Organisation"} ' +
    ']';


// Category colors for visual distinction
var sectionColors = {
    'getting-started': '#3b82f6'
};

var submitFormVal = true;
var clickCount = 0;

function slugify(text) {
    return text.toLowerCase().replace(/[^A-Z0-9]+/ig, "-").replace(/\-+$/, "");
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
}

function addCssToHead(styles) {
    var head = document.getElementsByTagName('head')[0];
    var s = document.createElement('style');
    s.setAttribute('type', 'text/css');
    if (s.styleSheet) {
        s.styleSheet.cssText = styles;
    } else {
        s.appendChild(document.createTextNode(styles));
    }
    head.appendChild(s);
}

function toggleYesNo(element) {
    if (element) {
        if (element.innerHTML === 'YES') {
            element.innerHTML = 'NO';
            element.dataset.setting = 'false';
        } else {
            element.innerHTML = 'YES';
            element.dataset.setting = 'true';
        }
    }
}

function createTopBar() {
    var topBar = document.createElement("div");
    topBar.setAttribute('id', 'page-top-bar');
    document.body.insertBefore(topBar, document.body.firstChild);
    document.body.style.marginTop = "16px";

    var topBarStyles = `
    #page-top-bar { background: #0f172a; border-bottom: 1px solid #1e293b; color: #f1f5f9; font-size: 13px; font-weight: 400; left: 0; padding: 10px 24px; position: fixed; top: 0; width: 100%; z-index: 9999999; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif; box-sizing: border-box; }
    #page-top-bar .page-top-bar-content { display: flex; align-items: center; justify-content: space-between; max-width: 100%; }
    #page-top-bar #top-bar-title { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; display: flex; align-items: center; gap: 10px; }
    #page-top-bar #top-bar-title::before { content: ''; width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2); }
    #page-top-bar #top-bar-options { display: flex; align-items: center; gap: 16px; font-size: 12px; color: #94a3b8; }
    #page-top-bar #top-bar-options span { font-weight: 500; }
    #page-top-bar a { border-radius: 5px; color: #fff; display: inline-block; font-weight: 600; padding: 4px 10px; text-align: center; text-decoration: none; font-size: 11px; letter-spacing: 0.5px; transition: all 0.15s; min-width: 36px; }
    #page-top-bar a[data-setting="false"] { background-color: #dc2626; }
    #page-top-bar a[data-setting="false"]:hover { background-color: #b91c1c; }
    #page-top-bar a[data-setting="true"] { background-color: #16a34a; }
    #page-top-bar a[data-setting="true"]:hover { background-color: #15803d; }
  `;
    addCssToHead(topBarStyles);

    var topBarContent = '<div class="page-top-bar-content">';
    topBarContent += '<div id="top-bar-title">PAS — Auth Stub</div>';
    topBarContent += '<div id="top-bar-options">';
    topBarContent += '<div><span>Auto submit</span> <a href="#" id="toggle-submit-form" data-setting="true">YES</a></div>';
    topBarContent += '<div><span>Hide form</span> <a href="#" id="toggle-page-overlay" data-setting="true">YES</a></div>';
    topBarContent += '</div></div>';
    topBar.innerHTML = topBarContent;

    var toggleOverlayLink = document.querySelector('#toggle-page-overlay');
    var toggleSubmitFormLink = document.querySelector('#toggle-submit-form');
    if (toggleOverlayLink) {
        toggleOverlayLink.addEventListener("click", function(e) { e.preventDefault(); e.stopPropagation(); toggleOverlay(); }, false);
    }
    if (toggleSubmitFormLink) {
        toggleSubmitFormLink.addEventListener("click", function(e) { e.preventDefault(); e.stopPropagation(); toggleFormSubmit(); }, false);
    }
}

function createOverlay() {
    var pageOverlay = document.createElement("div");
    pageOverlay.style.display = "flex";
    pageOverlay.setAttribute('id', 'page-overlay');
    document.body.insertBefore(pageOverlay, document.body.firstChild);

    var overlayStyles = `
    #page-overlay { background: #f8fafc; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif; font-size: 14px; font-weight: 400; position: fixed; top: 42px; left: 0; right: 0; bottom: 0; z-index: 99999; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; text-align: left; }

    /* Header */
    #app-header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 24px 40px 20px; flex-shrink: 0; }
    #app-header-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    #app-title-block h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; margin: 0 0 2px; line-height: 1.2; }
    #app-title-block .subtitle { font-size: 13px; color: #64748b; margin: 0; }
    #app-header-stats { display: flex; gap: 20px; align-items: center; }
    .stat-item { text-align: right; }
    .stat-item .stat-value { font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1; letter-spacing: -0.02em; }
    .stat-item .stat-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin-top: 4px; }
    #version-badge { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 999px; font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

    /* Help button */
    #help-button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; color: #475569; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.12s; font-family: inherit; text-decoration: none; }
    #help-button:hover { border-color: #3b82f6; color: #1e40af; background: #eff6ff; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.08); }
    #help-button svg { flex-shrink: 0; }

    /* Main layout */
    #app-body { flex: 1; min-height: 0; display: flex; max-width: 1400px; width: 100%; margin: 0 auto; }

    /* Sidebar */
    #shortcuts-wrapper { width: 220px; flex-shrink: 0; padding: 24px 16px 24px 40px; overflow-y: auto; border-right: 1px solid #e2e8f0; background: #fff; box-sizing: border-box; }
    #shortcuts-wrapper .shortcuts-heading { font-weight: 600; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; padding: 0 10px; }
    #shortcuts-wrapper ul { list-style: none; padding: 0; margin: 0; }
    #shortcuts-wrapper ul li { margin: 1px 0; }
    #shortcuts-wrapper ul li a { display: flex; align-items: center; gap: 10px; padding: 7px 10px; color: #475569; text-decoration: none; font-size: 13px; border-radius: 6px; transition: all 0.12s; font-weight: 500; position: relative; cursor: pointer; }
    #shortcuts-wrapper ul li a:hover { background: #f8fafc; color: #0f172a; }
    #shortcuts-wrapper ul li a.active { background: #eff6ff; color: #1e40af; font-weight: 600; }
    #shortcuts-wrapper ul li a.active::before { content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 3px; height: 18px; background: #3b82f6; border-radius: 0 3px 3px 0; }
    #shortcuts-wrapper ul li a .sb-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    #shortcuts-wrapper ul li a .sb-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #shortcuts-wrapper ul li a .sb-count { color: #94a3b8; font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; }
    #shortcuts-wrapper ul li a.active .sb-count { color: #3b82f6; }
    #shortcuts-wrapper .back-to-top { font-weight: 500; margin-top: 16px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; padding-left: 10px; padding-right: 10px; }
    #shortcuts-wrapper .back-to-top a { color: #3b82f6; text-decoration: none; display: flex; align-items: center; gap: 6px; cursor: pointer; }
    #shortcuts-wrapper .back-to-top a:hover { color: #1e40af; }

    /* Scroll area */
    #page-overlay-wrapper { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; padding: 24px 40px 80px; box-sizing: border-box; }
    #page-overlay-wrapper::-webkit-scrollbar { width: 10px; }
    #page-overlay-wrapper::-webkit-scrollbar-track { background: transparent; }
    #page-overlay-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; border: 2px solid #f8fafc; }
    #page-overlay-wrapper::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    /* Cards */
    .user-type-selector { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; display: block; margin: 6px 0; transition: all 0.12s ease; position: relative; }
    .user-type-selector:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04); transform: translateY(-1px); }
    .user-type-selector a { color: #0f172a; display: block; padding: 12px 16px; text-decoration: none; }
    .user-type-selector .row-title { font-size: 14px; font-weight: 600; color: #0f172a; display: block; margin-bottom: 6px; letter-spacing: -0.005em; }
    .user-type-selector:hover .row-title { color: #1e40af; }
    .user-type-selector .row-meta-line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .user-type-selector .row-returnid { display: inline-flex; align-items: center; background: #f1f5f9; color: #334155; padding: 3px 9px; border-radius: 5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; font-weight: 500; }
    .user-type-selector .row-returnid.empty { background: #fef3c7; color: #92400e; font-style: italic; font-family: inherit; }
    .user-type-selector .row-tech { color: #94a3b8; font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.01em; }

    .user-type-selector[data-section] { border-left: 3px solid transparent; }

    .user-type-selector.error-case { border-left: 3px solid #dc2626 !important; background: #fef2f2; }
    .user-type-selector.error-case .row-title { color: #991b1b; }
    .user-type-selector.error-case .row-title::before { content: '⚠'; margin-right: 6px; color: #dc2626; font-weight: 700; }

    /* Section header */
    .section-header { display: flex; align-items: center; gap: 10px; margin: 28px 0 8px; padding: 0 4px; scroll-margin-top: 16px; }
    .section-header:first-child { margin-top: 0; }
    .section-header .section-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .section-header .section-title { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; }
    .section-header .section-count { font-size: 11px; color: #94a3b8; font-weight: 500; font-variant-numeric: tabular-nums; background: #f1f5f9; padding: 2px 8px; border-radius: 999px; }
    .section-header .section-line { flex: 1; height: 1px; background: linear-gradient(to right, #e2e8f0, transparent); }

    /* Submit button */
    #submit-button-wrapper { position: fixed; right: 24px; bottom: 24px; z-index: 200; }
    #script-submit { display: none; padding: 11px 22px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; font-family: inherit; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.12s; }
    #script-submit:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }

    /* ====== HELP MODAL ====== */
    #help-modal-backdrop { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 9999998; align-items: center; justify-content: center; padding: 40px 20px; animation: helpFadeIn 0.15s ease-out; }
    #help-modal-backdrop.open { display: flex; }
    @keyframes helpFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes helpSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    #help-modal { background: #fff; border-radius: 12px; max-width: 760px; width: 100%; max-height: calc(100vh - 80px); overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.05); animation: helpSlideUp 0.18s ease-out; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif; }
    #help-modal-header { padding: 22px 28px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    #help-modal-header h2 { margin: 0 0 2px; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.015em; }
    #help-modal-header .help-subtitle { margin: 0; font-size: 13px; color: #64748b; }
    #help-modal-close { background: transparent; border: none; cursor: pointer; padding: 6px; border-radius: 6px; color: #64748b; transition: all 0.12s; display: flex; align-items: center; justify-content: center; }
    #help-modal-close:hover { background: #f1f5f9; color: #0f172a; }
    #help-modal-body { padding: 24px 28px 28px; overflow-y: auto; flex: 1; }
    #help-modal-body::-webkit-scrollbar { width: 8px; }
    #help-modal-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .help-step { margin-bottom: 24px; }
    .help-step:last-child { margin-bottom: 0; }
    .help-step-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .help-step-num { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #3b82f6; color: #fff; border-radius: 50%; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .help-step-title { font-size: 15px; font-weight: 600; color: #0f172a; letter-spacing: -0.01em; }
    .help-step-desc { color: #475569; font-size: 13px; line-height: 1.5; margin: 0 0 10px 34px; }
    .help-step-desc code { background: #f1f5f9; color: #1e40af; padding: 1px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    .help-code-block { position: relative; margin-left: 34px; background: #0f172a; border-radius: 8px; overflow: hidden; }
    .help-code-block pre { margin: 0; padding: 14px 16px; padding-right: 80px; color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; line-height: 1.55; overflow-x: auto; white-space: pre; }
    .help-code-block pre::-webkit-scrollbar { height: 6px; }
    .help-code-block pre::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    .help-copy-btn { position: absolute; top: 8px; right: 8px; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 4px 10px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.12s; font-family: inherit; }
    .help-copy-btn:hover { background: #334155; color: #fff; border-color: #475569; }
    .help-copy-btn.copied { background: #16a34a; border-color: #16a34a; color: #fff; }
    .help-tip { background: #eff6ff; border-left: 3px solid #3b82f6; padding: 12px 14px; border-radius: 6px; margin-top: 16px; font-size: 13px; color: #1e40af; line-height: 1.5; }
    .help-tip strong { color: #1e3a8a; }

    /* Syntax-ish highlighting via CSS classes */
    .hc-key { color: #93c5fd; }
    .hc-str { color: #86efac; }
    .hc-comment { color: #64748b; font-style: italic; }
    .hc-punct { color: #cbd5e1; }
    .hc-var { color: #fcd34d; }

    body.overlay-open { overflow: hidden; }

    @media (max-width: 900px) {
      #shortcuts-wrapper { display: none; }
      #app-header { padding: 20px; }
      #page-overlay-wrapper { padding: 20px; }
      #app-header-stats { gap: 12px; }
      .stat-item { display: none; }
    }
  `;
    addCssToHead(overlayStyles);

    var userTypesObject = JSON.parse(userProfiles);

    var sectionCounts = {};
    var currentSection = null;
    var totalProfiles = 0;
    for (var k = 0; k < userTypesObject.length; k++) {
        if (userTypesObject[k].hasOwnProperty('divider')) {
            currentSection = slugify(userTypesObject[k].divider);
            sectionCounts[currentSection] = 0;
        } else if (currentSection) {
            sectionCounts[currentSection]++;
            totalProfiles++;
        }
    }

    pageOverlay.innerHTML = `
    <div id='app-header'>
      <div id='app-header-inner'>
        <div id='app-title-block'>
          <h1>PAS Test Profiles</h1>
          <p class='subtitle'>Select a profile to authenticate and proceed to the filing journey</p>
        </div>
        <div id='app-header-stats'>
          <div class='stat-item'>
            <div class='stat-value'>${totalProfiles}</div>
            <div class='stat-label'>Profiles</div>
          </div>
          <div class='stat-item'>
            <div class='stat-value'>${Object.keys(sectionCounts).length}</div>
            <div class='stat-label'>Categories</div>
          </div>
          <button id='help-button' type='button'>
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'></path><line x1='12' y1='17' x2='12.01' y2='17'></line></svg>
            How to add a profile
          </button>
          <div id='version-badge'>v${scriptVersion}</div>
        </div>
      </div>
    </div>
    <div id='app-body'>
      <nav id='shortcuts-wrapper'>
        <div class='shortcuts-heading'>Categories</div>
        <ul id='sidebar-list'></ul>
        <div class='back-to-top'><a id='back-to-top-link'>↑ Back to top</a></div>
      </nav>
      <main id='page-overlay-wrapper'>
        <div id='profile-list'></div>
      </main>
    </div>
    <div id='submit-button-wrapper'><button id='script-submit'>Submit</button></div>
  `;

    // Help modal markup (appended to body so it sits above everything)
    var helpModalHtml = `
    <div id='help-modal-backdrop'>
      <div id='help-modal' role='dialog' aria-labelledby='help-modal-title'>
        <div id='help-modal-header'>
          <div>
            <h2 id='help-modal-title'>How to add a new profile or category</h2>
            <p class='help-subtitle'>Edit this userscript and add entries to <code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:12px;color:#1e40af">userProfiles</code></p>
          </div>
          <button id='help-modal-close' type='button' aria-label='Close'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg>
          </button>
        </div>
        <div id='help-modal-body'>

          <div class='help-step'>
            <div class='help-step-header'>
              <span class='help-step-num'>1</span>
              <span class='help-step-title'>Add a new category (divider)</span>
            </div>
            <p class='help-step-desc'>Dividers create section headers in the main list and entries in the sidebar. Drop one in <code>userProfiles</code> before the profiles you want to group.</p>
            <div class='help-code-block'>
              <pre data-copy='{ &quot;divider&quot;:&quot;My New Section&quot; }, +'><span class="hc-punct">'</span><span class="hc-punct">{ </span><span class="hc-key">"divider"</span><span class="hc-punct">:</span><span class="hc-str">"My New Section"</span><span class="hc-punct"> }, '</span> <span class="hc-punct">+</span></pre>
              <button class='help-copy-btn' data-copy-target='prev'>Copy</button>
            </div>
          </div>

          <div class='help-step'>
            <div class='help-step-header'>
              <span class='help-step-num'>2</span>
              <span class='help-step-title'>Add a profile entry</span>
            </div>
            <p class='help-step-desc'>Each profile is a JSON object. Place it under the divider it belongs to. To add a second identifier, include <code>identifierName2</code> and <code>identifierValue2</code>: the script clicks the green + button and fills the new row. Leave them out if you only need one identifier.</p>
            <div class='help-code-block'>
              <pre data-copy='{ &quot;description&quot;:&quot;My new profile&quot;, &quot;enrolmentKey&quot;:&quot;HMRC-CIS-ORG&quot;, &quot;identifierName&quot;:&quot;TaxOfficeNumber&quot;, &quot;identifierValue&quot;:&quot;100&quot;, &quot;identifierName2&quot;:&quot;TaxOfficeReference&quot;, &quot;identifierValue2&quot;:&quot;AB123&quot;, &quot;enrolmentStatus&quot;:&quot;Activated&quot;, &quot;affinityGroup&quot;:&quot;Organisation&quot;, &quot;returnId&quot;: &quot;&quot; }, +'><span class="hc-punct">'</span><span class="hc-punct">{ </span><span class="hc-key">"description"</span><span class="hc-punct">:</span><span class="hc-str">"My new profile"</span><span class="hc-punct">, </span><span class="hc-key">"enrolmentKey"</span><span class="hc-punct">:</span><span class="hc-str">"HMRC-CIS-ORG"</span><span class="hc-punct">, </span>
<span class="hc-punct">  </span><span class="hc-key">"identifierName"</span><span class="hc-punct">:</span><span class="hc-str">"TaxOfficeNumber"</span><span class="hc-punct">, </span><span class="hc-key">"identifierValue"</span><span class="hc-punct">:</span><span class="hc-str">"100"</span><span class="hc-punct">, </span>
<span class="hc-punct">  </span><span class="hc-key">"identifierName2"</span><span class="hc-punct">:</span><span class="hc-str">"TaxOfficeReference"</span><span class="hc-punct">, </span><span class="hc-key">"identifierValue2"</span><span class="hc-punct">:</span><span class="hc-str">"AB123"</span><span class="hc-punct">, </span>
<span class="hc-punct">  </span><span class="hc-key">"enrolmentStatus"</span><span class="hc-punct">:</span><span class="hc-str">"Activated"</span><span class="hc-punct">, </span><span class="hc-key">"affinityGroup"</span><span class="hc-punct">:</span><span class="hc-str">"Organisation"</span><span class="hc-punct">, </span>
<span class="hc-punct">  </span><span class="hc-key">"returnId"</span><span class="hc-punct">: </span><span class="hc-str">""</span><span class="hc-punct"> }, '</span> <span class="hc-punct">+</span></pre>
              <button class='help-copy-btn' data-copy-target='prev'>Copy</button>
            </div>
          </div>

          <div class='help-step'>
            <div class='help-step-header'>
              <span class='help-step-num'>3</span>
              <span class='help-step-title'>Pick a colour for the category</span>
            </div>
            <p class='help-step-desc'>The sidebar dot and card accent are driven by <code>sectionColors</code>. Use the slugified divider name as the key — lowercase, hyphens for spaces.</p>
            <div class='help-code-block'>
              <pre data-copy="var sectionColors = {
  // ... existing entries
  'my-new-section': '#3b82f6',  // any hex colour
};"><span class="hc-comment">// in sectionColors:</span>
<span class="hc-var">var</span> sectionColors <span class="hc-punct">=</span> <span class="hc-punct">{</span>
<span class="hc-punct">  </span><span class="hc-comment">// ... existing entries</span>
<span class="hc-punct">  </span><span class="hc-str">'my-new-section'</span><span class="hc-punct">: </span><span class="hc-str">'#3b82f6'</span><span class="hc-punct">,  </span><span class="hc-comment">// any hex colour</span>
<span class="hc-punct">};</span></pre>
              <button class='help-copy-btn' data-copy-target='prev'>Copy</button>
            </div>
          </div>

          <div class='help-tip'>
            <strong>Tip:</strong> The section slug is the divider name lowercased with spaces replaced by hyphens. <code style="background:#dbeafe;padding:1px 5px;border-radius:3px;font-family:ui-monospace,monospace;font-size:12px">"My New Section"</code> becomes <code style="background:#dbeafe;padding:1px 5px;border-radius:3px;font-family:ui-monospace,monospace;font-size:12px">my-new-section</code>. If the slug doesn't match the key in <code style="background:#dbeafe;padding:1px 5px;border-radius:3px;font-family:ui-monospace,monospace;font-size:12px">sectionColors</code>, it falls back to a neutral grey.
          </div>

        </div>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', helpModalHtml);

    document.body.classList.add('overlay-open');

    var profileList = document.getElementById("profile-list");
    var pageOverlayWrapper = document.getElementById("page-overlay-wrapper");

    var sectionForRow = null;
    for (var i = 0, len = userTypesObject.length; i < len; ++i) {
        (function(i) {
            var entry = userTypesObject[i];
            if (entry.hasOwnProperty('divider')) {
                sectionForRow = slugify(entry.divider);
                var color = sectionColors[sectionForRow] || '#64748b';
                var headerHtml = '<div class="section-header" id="' + sectionForRow + '" data-section="' + sectionForRow + '">' +
                    '<div class="section-dot" style="background:' + color + '"></div>' +
                    '<div class="section-title">' + escapeHtml(entry.divider) + '</div>' +
                    '<div class="section-count">' + sectionCounts[sectionForRow] + '</div>' +
                    '<div class="section-line"></div>' +
                    '</div>';
                profileList.insertAdjacentHTML('beforeend', headerHtml);
            } else {
                var isError = entry.description.indexOf('Error case') === 0;
                var rowClass = 'user-type-selector' + (isError ? ' error-case' : '');
                var color = sectionColors[sectionForRow] || '#64748b';
                var borderStyle = isError ? '' : ' style="border-left-color:' + color + '"';


                var credIdHtml = entry.hasOwnProperty('authorityId')
                    ? ' · CredID ' + escapeHtml(entry.authorityId)
                    : '';
                var techHtml = escapeHtml(entry.enrolmentKey) + ' · ' + escapeHtml(entry.identifierName) + ' · ' + escapeHtml(entry.identifierValue);
                if (entry.identifierName2 && entry.identifierValue2) {
                    techHtml += ' · ' + escapeHtml(entry.identifierName2) + ' · ' + escapeHtml(entry.identifierValue2);
                }
                techHtml += credIdHtml;

                var rowHtml = '<div class="' + rowClass + '" id="select-user-' + i + '" data-section="' + sectionForRow + '"' + borderStyle + '>' +
                    '<a href="#">' +
                    '<span class="row-title">' + escapeHtml(entry.description) + '</span>' +
                    '<span class="row-meta-line">' +
                    '<span class="row-tech">' + techHtml + '</span>' +
                    '</span>' +
                    '</a>' +
                    '</div>';
                profileList.insertAdjacentHTML('beforeend', rowHtml);

                var authId = entry.hasOwnProperty('authorityId') ? entry.authorityId : "noAuthorityId";
                document.getElementById('select-user-' + i).addEventListener("click", function(e) {
                    e.preventDefault();
                    clickCount += 1;
                    submitForm(entry.description, entry.affinityGroup, entry.enrolmentKey, entry.identifierName, entry.identifierValue, entry.enrolmentStatus, authId, submitFormVal, clickCount, entry.returnId, entry.identifierName2, entry.identifierValue2);
                }, false);
            }
        }(i));
    }

    // Build sidebar
    var sidebarList = document.getElementById('sidebar-list');
    var sidebarHtml = '';
    for (var s = 0; s < userTypesObject.length; s++) {
        if (userTypesObject[s].hasOwnProperty('divider')) {
            var slug = slugify(userTypesObject[s].divider);
            var sbColor = sectionColors[slug] || '#64748b';
            sidebarHtml += '<li><a data-section-link="' + slug + '">' +
                '<span class="sb-dot" style="background:' + sbColor + '"></span>' +
                '<span class="sb-label">' + escapeHtml(userTypesObject[s].divider) + '</span>' +
                '<span class="sb-count">' + sectionCounts[slug] + '</span>' +
                '</a></li>';
        }
    }
    sidebarList.innerHTML = sidebarHtml;

    document.getElementById("script-submit").addEventListener("click", function() {
        $("#submit").click();
    });

    // --- Sidebar click navigation ---
    function scrollToSection(slug) {
        var target = document.getElementById(slug);
        if (!target) return;
        var wrapperTop = pageOverlayWrapper.getBoundingClientRect().top;
        var targetTop = target.getBoundingClientRect().top;
        var delta = targetTop - wrapperTop - 16;
        pageOverlayWrapper.scrollTop = pageOverlayWrapper.scrollTop + delta;
    }

    var sidebarLinkEls = document.querySelectorAll('#shortcuts-wrapper a[data-section-link]');
    sidebarLinkEls.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            scrollToSection(link.getAttribute('data-section-link'));
        });
    });

    document.getElementById('back-to-top-link').addEventListener('click', function(e) {
        e.preventDefault();
        pageOverlayWrapper.scrollTop = 0;
    });

    // --- Active section highlighting ---
    function updateActiveSection() {
        var headers = profileList.querySelectorAll('.section-header');
        var wrapperRect = pageOverlayWrapper.getBoundingClientRect();
        var current = null;
        for (var h = 0; h < headers.length; h++) {
            var header = headers[h];
            var top = header.getBoundingClientRect().top - wrapperRect.top;
            if (top < 80) {
                current = header.getAttribute('data-section');
            } else {
                break;
            }
        }
        if (!current && headers.length > 0) {
            current = headers[0].getAttribute('data-section');
        }
        sidebarLinkEls.forEach(function(link) {
            if (link.getAttribute('data-section-link') === current) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    pageOverlayWrapper.addEventListener('scroll', updateActiveSection);
    setTimeout(updateActiveSection, 50);

    // --- Help modal ---
    var helpBackdrop = document.getElementById('help-modal-backdrop');
    var helpButton = document.getElementById('help-button');
    var helpClose = document.getElementById('help-modal-close');

    function openHelp() {
        helpBackdrop.classList.add('open');
    }
    function closeHelp() {
        helpBackdrop.classList.remove('open');
    }

    helpButton.addEventListener('click', openHelp);
    helpClose.addEventListener('click', closeHelp);
    helpBackdrop.addEventListener('click', function(e) {
        if (e.target === helpBackdrop) closeHelp();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && helpBackdrop.classList.contains('open')) {
            closeHelp();
        }
    });

    // Copy buttons in help modal
    document.querySelectorAll('.help-copy-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var pre = btn.previousElementSibling;
            var text = pre && pre.getAttribute('data-copy') ? pre.getAttribute('data-copy') : (pre ? pre.textContent : '');
            if (!text) return;
            var done = function() {
                btn.classList.add('copied');
                btn.textContent = '✓ Copied';
                setTimeout(function() {
                    btn.classList.remove('copied');
                    btn.textContent = 'Copy';
                }, 1600);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(function() {
                    // Fallback for non-secure contexts
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    try { document.execCommand('copy'); done(); } catch(err) {}
                    document.body.removeChild(ta);
                });
            } else {
                var ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); done(); } catch(err) {}
                document.body.removeChild(ta);
            }
        });
    });
}

function showOverlay() {
    document.getElementById("page-overlay").style.display = "flex";
    document.body.classList.add('overlay-open');
}

function hideOverlay() {
    document.getElementById("page-overlay").style.display = "none";
    document.body.classList.remove('overlay-open');
}

function toggleOverlay() {
    if (document.getElementById("page-overlay")) {
        var overlay = document.getElementById("page-overlay");
        if (overlay.style.display === "none") {
            toggleYesNo(document.getElementById("toggle-page-overlay"));
            showOverlay();
        } else {
            toggleYesNo(document.getElementById("toggle-page-overlay"));
            hideOverlay();
        }
    } else {
        toggleYesNo(document.getElementById("toggle-page-overlay"));
        createOverlay();
    }
}

function toggleFormSubmit() {
    if (submitFormVal == true) {
        toggleYesNo(document.getElementById("toggle-submit-form"));
        document.getElementById("script-submit").style.display = "block";
        submitFormVal = false;
    } else {
        toggleYesNo(document.getElementById("toggle-submit-form"));
        document.getElementById("script-submit").style.display = "none";
        submitFormVal = true;
    }
}

var enrolmentsArray = [];

// Polls until an element matching the selector exists (or the timeout passes), then calls back
function waitForElement(selector, callback, timeoutMs) {
    var start = Date.now();
    (function check() {
        if ($(selector).length > 0) {
            callback(true);
        } else if (Date.now() - start > timeoutMs) {
            callback(false);
        } else {
            setTimeout(check, 50);
        }
    })();
}

function submitForm(description, affinityGroup, enrlKey, idName, idVal, status, authId, submitFormVal, numOfClicks, returnId, idName2, idVal2) {
    var rowId = numOfClicks - 1;

    // Use the "continue" param from the sign-in URL if present, otherwise fall back to the PAS default
    var continueParam = new URLSearchParams(window.location.search).get("continue");
    var isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    var redirectUrl = continueParam
        ? continueParam
        : (isLocal ? "http://localhost:61002/cis-paye-penalties-and-appeals" : "/cis-paye-penalties-and-appeals");

    // Add returnId to redirect URL if it exists
    if (returnId && returnId !== "") {
        redirectUrl += (redirectUrl.indexOf("?") === -1 ? "?" : "&") + "returnId=" + encodeURIComponent(returnId);
    }

    if (enrolmentsArray.indexOf(enrlKey) !== -1) {
        alert("You cannot add another '" + enrlKey + "' enrolment.");
        console.log("Existing enrolments:", enrolmentsArray);
        return;
    }
    enrolmentsArray.push(enrlKey);

    // Redirect + affinity group + credential id
    $("input[type='text'][name='redirectionUrl']").val(redirectUrl);
    $("select[name='affinityGroup']").val(affinityGroup);
    if (authId !== "noAuthorityId") {
        $("input[type='text'][name='authorityId']").val(authId);
    } else {
        $("input[type='text'][name='authorityId']").val(""); // empty CredId
    }

    // Step 1: enrolment key + first identifier + status
    $("input[type='text'][name='enrolment[" + rowId + "].name']").val(enrlKey);
    $("input[type='text'][name='enrolment[" + rowId + "].taxIdentifier[0].name']").val(idName);
    $("input[type='text'][name='enrolment[" + rowId + "].taxIdentifier[0].value']").val(idVal);
    $("select[name='enrolment[" + rowId + "].state']").val(status);

    if (rowId >= 3) {
        $("#js-add-enrolment").click();
    }

    function finish() {
        if (submitFormVal == true) {
            $("#submit").click();
        }
    }

    // Step 2: click the green + button (id add-ident-btn-<row>) to create the second identifier row,
    // Step 3: wait for the new inputs to exist, then fill them in
    if (idName2 && idVal2) {
        var addBtn = document.getElementById("add-ident-btn-" + rowId);
        if (!addBtn) {
            console.warn("PAS Script: button #add-ident-btn-" + rowId + " not found");
            finish();
            return;
        }
        addBtn.click();

        var nameSelector = "input[type='text'][name='enrolment[" + rowId + "].taxIdentifier[1].name']";
        var valueSelector = "input[type='text'][name='enrolment[" + rowId + "].taxIdentifier[1].value']";

        waitForElement(nameSelector, function(found) {
            if (found) {
                $(nameSelector).val(idName2);
                $(valueSelector).val(idVal2);
            } else {
                console.warn("PAS Script: second identifier inputs did not appear after clicking the + button");
            }
            finish();
        }, 2000);
    } else {
        finish();
    }
}

// Wait for jQuery to be loaded
function waitForJQuery(callback) {
    if (typeof jQuery !== 'undefined') {
        callback();
    } else {
        setTimeout(function() {
            waitForJQuery(callback);
        }, 100);
    }
}

waitForJQuery(function() {
    $(document).ready(function() {
        'use strict';
        createOverlay();
        createTopBar();
    });
});