const PORTAL_DATA = {
  kpis: [
    { label: "Total Annual Recurring Revenue", value: "$1,480K", delta: "+18.4% vs last quarter" },
    { label: "Active Enterprise Accounts", value: "142", delta: "+12 new accounts" },
    { label: "Net Retention Rate", value: "114.6%", delta: "+3.1% improvement" },
    { label: "Average Deal Velocity", value: "19 Days", delta: "-4 days faster" },
  ],
  monthlySeries: {
    labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
    actual: [190, 215, 208, 245, 272, 298],
    target: [185, 205, 215, 235, 260, 280],
  },
  accounts: [
    { id: 1, name: "Kestrel Logistics", region: "MENA", revenue: 310, growth: 24.5, status: "Expanding" },
    { id: 2, name: "Harborview FinTech", region: "Europe", revenue: 265, growth: 16.2, status: "Active" },
    { id: 3, name: "Solstice Health", region: "North America", revenue: 240, growth: 19.8, status: "Active" },
    { id: 4, name: "Crestline Retail", region: "APAC", revenue: 185, growth: 8.4, status: "Review" },
    { id: 5, name: "Meridian CloudOps", region: "Europe", revenue: 295, growth: 28.1, status: "Expanding" },
    { id: 6, name: "Bayside Energy", region: "North America", revenue: 185, growth: 11.7, status: "Active" },
  ],
};

const state = {
  activeView: "overview",
  theme: "dark",
  searchQuery: "",
  statusFilter: "all",
  sortKey: "revenue",
  sortDirection: "desc",
};

let revenueChartInstance = null;
let regionChartInstance = null;

function renderKpis() {
  const kpiGrid = document.getElementById("kpi-grid");
  kpiGrid.innerHTML = PORTAL_DATA.kpis
    .map(
      (kpi) => `
      <article class="kpi-card">
        <p class="kpi-label">${kpi.label}</p>
        <p class="kpi-value">${kpi.value}</p>
        <p class="kpi-delta">${kpi.delta}</p>
      </article>
    `
    )
    .join("");
}

function getFilteredAndSortedAccounts() {
  const query = state.searchQuery.trim().toLowerCase();

  const filtered = PORTAL_DATA.accounts.filter((item) => {
    const matchesStatus = state.statusFilter === "all" || item.status === state.statusFilter;
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.region.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  return filtered.sort((a, b) => {
    const valA = a[state.sortKey];
    const valB = b[state.sortKey];
    const comparison =
      typeof valA === "string" ? valA.localeCompare(valB) : Number(valA) - Number(valB);
    return state.sortDirection === "asc" ? comparison : -comparison;
  });
}

function renderMatrix() {
  const tbody = document.getElementById("matrix-tbody");
  const rows = getFilteredAndSortedAccounts();

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5">No matching enterprise accounts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td><strong>${row.name}</strong></td>
        <td>${row.region}</td>
        <td>$${row.revenue}K</td>
        <td>+${row.growth}%</td>
        <td><span class="status-badge">${row.status}</span></td>
      </tr>
    `
    )
    .join("");

  document.querySelectorAll(".sort-btn").forEach((btn) => {
    const isCurrent = btn.dataset.sort === state.sortKey;
    btn.classList.toggle("active", isCurrent);
    const indicator = btn.querySelector(".sort-indicator");
    if (indicator) {
      indicator.textContent = isCurrent ? (state.sortDirection === "asc" ? "↑" : "↓") : "↕";
    }
  });
}

function getRegionCounts() {
  return PORTAL_DATA.accounts.reduce((acc, item) => {
    acc[item.region] = (acc[item.region] || 0) + 1;
    return acc;
  }, {});
}

function renderCharts() {
  if (typeof Chart === "undefined") return;

  const styles = getComputedStyle(document.documentElement);
  const textColor = styles.getPropertyValue("--text-secondary").trim();
  const gridColor = styles.getPropertyValue("--grid-line").trim();
  const accentColor = styles.getPropertyValue("--accent").trim();

  const revCtx = document.getElementById("revenueChart").getContext("2d");
  const regCtx = document.getElementById("regionChart").getContext("2d");

  if (revenueChartInstance) revenueChartInstance.destroy();
  if (regionChartInstance) regionChartInstance.destroy();

  revenueChartInstance = new Chart(revCtx, {
    type: "bar",
    data: {
      labels: PORTAL_DATA.monthlySeries.labels,
      datasets: [
        {
          label: "Actual ($K)",
          data: PORTAL_DATA.monthlySeries.actual,
          backgroundColor: accentColor,
          borderRadius: 6,
        },
        {
          label: "Target ($K)",
          data: PORTAL_DATA.monthlySeries.target,
          backgroundColor: "rgba(148, 163, 184, 0.35)",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } },
      },
    },
  });

  const regionCounts = getRegionCounts();
  regionChartInstance = new Chart(regCtx, {
    type: "doughnut",
    data: {
      labels: Object.keys(regionCounts),
      datasets: [
        {
          data: Object.values(regionCounts),
          backgroundColor: [accentColor, "#38bdf8", "#f59e0b", "#a78bfa"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { color: textColor } } },
    },
  });
}

function applyView(viewName) {
  state.activeView = viewName;
  window.location.hash = viewName;

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    const panelView = panel.dataset.viewPanel;
    const shouldShow = viewName === "overview" || panelView === viewName;
    panel.classList.toggle("is-hidden", !shouldShow);
  });

  if (viewName === "overview" || viewName === "analytics") {
    renderCharts();
  }
}

function applyTheme(themeName) {
  state.theme = themeName;
  document.documentElement.setAttribute("data-theme", themeName);
  document.getElementById("theme-label").textContent =
    themeName === "dark" ? "Light Mode" : "Dark Mode";
  renderCharts();
}

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyView(btn.dataset.view));
  });

  document.getElementById("theme-toggle").addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderMatrix();
  });

  document.getElementById("status-filter").addEventListener("change", (e) => {
    state.statusFilter = e.target.value;
    renderMatrix();
  });

  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.sort;
      if (state.sortKey === key) {
        state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDirection = key === "name" || key === "region" || key === "status" ? "asc" : "desc";
      }
      renderMatrix();
    });
  });

  window.addEventListener("hashchange", () => {
    const hashView = window.location.hash.replace("#", "");
    if (["overview", "analytics", "matrix"].includes(hashView)) {
      applyView(hashView);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderKpis();
  renderMatrix();
  bindEvents();
  const initialHash = window.location.hash.replace("#", "");
  applyView(["overview", "analytics", "matrix"].includes(initialHash) ? initialHash : "overview");
});