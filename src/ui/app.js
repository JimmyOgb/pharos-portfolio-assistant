/**
 * Pharos Portfolio Assistant — Frontend Application Logic
 * Interacts with server-side read-only API routes (/api/health, /api/portfolio, /api/ask)
 * Zero client-side private key handling.
 */

// DOM Elements
const addressInput = document.getElementById("addressInput");
const portfolioForm = document.getElementById("portfolioForm");
const refreshBtn = document.getElementById("refreshBtn");
const inspectBtn = document.getElementById("inspectBtn");
const alertBanner = document.getElementById("alertBanner");
const loadingIndicator = document.getElementById("loadingIndicator");
const loadingText = document.getElementById("loadingText");
const blockTicker = document.getElementById("blockTicker");

// KPI Value Elements
const totalExposureVal = document.getElementById("totalExposureVal");
const accountingExplanation = document.getElementById("accountingExplanation");
const liquidProsVal = document.getElementById("liquidProsVal");
const wrappedProsVal = document.getElementById("wrappedProsVal");
const stakedProsVal = document.getElementById("stakedProsVal");

// Protocol & Provenance Elements
const protocolTableBody = document.getElementById("protocolTableBody");
const provenanceList = document.getElementById("provenanceList");
const provenanceBlockTag = document.getElementById("provenanceBlockTag");

// Assistant Chat Elements
const assistantForm = document.getElementById("assistantForm");
const queryInput = document.getElementById("queryInput");
const chatFeed = document.getElementById("chatFeed");

// State
let currentAddress = "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2";
let latestObservedBlock = null;

// Helper: Show Alert
function showAlert(message, type = "error") {
  alertBanner.textContent = message;
  alertBanner.className = `alert-banner ${type}`;
  alertBanner.classList.remove("hidden");
}

function hideAlert() {
  alertBanner.classList.add("hidden");
  alertBanner.textContent = "";
}

// Helper: Format Address
function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// 1. Initial Health Check
async function fetchHealth() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.blockHeight) {
      latestObservedBlock = data.blockHeight;
      blockTicker.textContent = `Block: #${data.blockHeight}`;
    }
  } catch (err) {
    blockTicker.textContent = "Block: Syncing...";
  }
}

// 2. Inspect Portfolio
async function inspectPortfolio(address) {
  const addr = (address || addressInput.value || "").trim();

  // Strict client-side EVM address validation
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    showAlert("Please enter a valid 40-character hexadecimal EVM address (e.g. 0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2).", "error");
    return;
  }

  hideAlert();
  currentAddress = addr;
  addressInput.value = addr;
  loadingIndicator.classList.remove("hidden");
  loadingText.textContent = `Querying live Pacific Mainnet for ${shortAddr(addr)}...`;

  try {
    const res = await fetch(`/api/portfolio?address=${encodeURIComponent(addr)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    // Update KPI values
    totalExposureVal.textContent = data.accounting.totalProsExposure;
    liquidProsVal.textContent = data.accounting.liquidNativePros;
    wrappedProsVal.textContent = data.accounting.wrappedVaultPros;
    stakedProsVal.textContent = data.accounting.stakedVaultProsShares;

    if (data.accounting.explanation) {
      accountingExplanation.textContent = data.accounting.explanation;
    }

    latestObservedBlock = data.observedBlockNumber;
    blockTicker.textContent = `Block: #${data.observedBlockNumber}`;
    provenanceBlockTag.textContent = `Pinned Block: #${data.observedBlockNumber}`;

    // Render Protocol Table
    renderProtocolTable(data.positions);

    // Render Provenance Evidence
    renderProvenance(data.positions, data.observedBlockNumber);

  } catch (err) {
    showAlert(`Portfolio inspection error: ${err.message}`, "error");
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// Render Protocol Table
function renderProtocolTable(positions) {
  protocolTableBody.innerHTML = "";

  positions.forEach((pos) => {
    const row = document.createElement("tr");

    let explorerHtml = "L1 Consensus State";
    if (pos.provenance.sourceContract !== "NATIVE_CONSENSUS_BALANCE") {
      const contract = pos.provenance.sourceContract;
      explorerHtml = `<a class="contract-link" href="https://pharosscan.xyz/address/${contract}" target="_blank" rel="noreferrer">${shortAddr(contract)}</a>`;
    }

    let tagClass = "tag-blue";
    if (pos.locationType === "CANONICAL_WRAPPING_VAULT") tagClass = "tag-purple";
    if (pos.locationType === "LIQUID_STAKING_VAULT") tagClass = "tag-emerald";

    row.innerHTML = `
      <td><strong>${pos.assetName} (${pos.assetSymbol})</strong></td>
      <td><span class="tag ${tagClass}">${pos.locationType}</span></td>
      <td>${explorerHtml}</td>
      <td><strong>${pos.formattedAmount} ${pos.assetSymbol}</strong></td>
      <td><span class="text-dim">${pos.underlyingEquivalentRatio}</span></td>
    `;
    protocolTableBody.appendChild(row);
  });
}

// Render Provenance Evidence
function renderProvenance(positions, blockNumber) {
  provenanceList.innerHTML = "";

  positions.forEach((pos) => {
    const p = pos.provenance;
    const card = document.createElement("div");
    card.className = "prov-item";

    card.innerHTML = `
      <div class="prov-header">
        <span>Asset: ${pos.assetSymbol} (${pos.assetName})</span>
        <span>Block #${p.blockNumber}</span>
      </div>
      <div class="prov-detail">
        <span>Contract: ${p.sourceContract}</span>
        <span>Method: ${p.methodCalled} (${p.selector})</span>
      </div>
      <div class="prov-hex">
        <span>Raw EVM Hex: <code>${p.rawHex}</code></span>
      </div>
    `;
    provenanceList.appendChild(card);
  });
}

// 3. Ask Assistant
async function askAssistant(queryText) {
  const query = (queryText || queryInput.value || "").trim();
  if (!query) return;

  const addr = currentAddress;

  // Append user message to feed
  appendMessage("user", query);
  queryInput.value = "";

  // Append temporary thinking message
  const loadingBubble = appendMessage("bot", "Analyzing on-chain portfolio state against Pacific Mainnet...", "THINKING");

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: addr,
        query: query,
        block: latestObservedBlock,
      }),
    });

    const data = await res.json();
    loadingBubble.remove();

    if (!res.ok) {
      appendMessage("bot", `Error: ${data.error || "Failed to process query"}`, "ERROR");
      return;
    }

    // Format and append assistant response
    appendBotResponse(data);

  } catch (err) {
    loadingBubble.remove();
    appendMessage("bot", `Network error: ${err.message}`, "ERROR");
  }
}

// Helper: Append User Message
function appendMessage(sender, text, badgeText = "") {
  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}-message`;
  msg.textContent = text;
  chatFeed.appendChild(msg);
  chatFeed.scrollTop = chatFeed.scrollHeight;
  return msg;
}

// Helper: Append Structured Bot Response
function appendBotResponse(data) {
  const msg = document.createElement("div");
  msg.className = "chat-message bot-message";

  const header = document.createElement("div");
  header.className = "bot-message-header";

  const intentTag = document.createElement("span");
  intentTag.className = "intent-badge";
  intentTag.textContent = `Intent: ${data.intent} (${Math.round(data.confidence * 100)}%)`;

  const timeTag = document.createElement("span");
  timeTag.className = "text-dim";
  timeTag.textContent = `Block #${data.blockNumber}`;

  header.appendChild(intentTag);
  header.appendChild(timeTag);
  msg.appendChild(header);

  const textDiv = document.createElement("div");
  textDiv.className = "bot-message-text";
  textDiv.textContent = data.answerText;
  msg.appendChild(textDiv);

  if (data.provenanceList && data.provenanceList.length > 0) {
    const provDiv = document.createElement("div");
    provDiv.className = "bot-message-prov";
    provDiv.textContent = `Provenances attached: ${data.provenanceList.length} on-chain contract read(s) at block #${data.blockNumber}`;
    msg.appendChild(provDiv);
  }

  chatFeed.appendChild(msg);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

// Event Listeners
portfolioForm.addEventListener("submit", (e) => {
  e.preventDefault();
  inspectPortfolio(addressInput.value);
});

refreshBtn.addEventListener("click", () => {
  inspectPortfolio(addressInput.value);
});

assistantForm.addEventListener("submit", (e) => {
  e.preventDefault();
  askAssistant(queryInput.value);
});

// Quick address sample chips
document.querySelectorAll(".chip[data-address]").forEach((chip) => {
  chip.addEventListener("click", () => {
    const addr = chip.getAttribute("data-address");
    addressInput.value = addr;
    inspectPortfolio(addr);
  });
});

// Suggested question chips
document.querySelectorAll(".question-chip[data-query]").forEach((chip) => {
  chip.addEventListener("click", () => {
    const q = chip.getAttribute("data-query");
    queryInput.value = q;
    askAssistant(q);
  });
});

// Auto-run on load
window.addEventListener("DOMContentLoaded", async () => {
  await fetchHealth();
  // Automatically inspect canonical deployer as default demonstration
  inspectPortfolio(currentAddress);
});
