import React, { useMemo } from "react";

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
};

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return "₹0";

  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }

  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }

  if (Math.abs(value) >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const formatNumber = (value) =>
  Math.round(value || 0).toLocaleString("en-IN");

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function Reports({ dataset }) {
  const report = useMemo(() => {
    if (!dataset || !dataset.data?.length) return null;

    const rows = dataset.data;
    const columns = dataset.columns || [];
    const metrics = dataset.metrics || {};

    const revenueColumn = metrics.revenueColumn;
    const costColumn = metrics.costColumn;
    const ordersColumn = metrics.ordersColumn;
    const productColumn = metrics.productColumn;
    const regionColumn = metrics.regionColumn;
    const dateColumn = metrics.dateColumn;
    const deliveryColumn = metrics.deliveryColumn;

    const totalRevenue = metrics.totalRevenue || 0;
    const totalCost = metrics.totalCost || 0;
    const grossProfit =
      metrics.grossProfit ?? Math.max(totalRevenue - totalCost, 0);
    const grossMargin =
      metrics.grossMargin ??
      (totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0);

    const totalOrders = metrics.totalOrders || 0;
    const uniqueProducts = metrics.uniqueProducts || 0;
    const uniqueRegions = metrics.uniqueRegions || 0;
    const uniqueCustomers = metrics.uniqueCustomers || 0;
    const averageOrderValue = metrics.averageOrderValue || 0;
    const averageDeliveryDays = metrics.averageDeliveryDays || 0;

    // ---------------------------------------------------
    // PRODUCT ANALYSIS
    // ---------------------------------------------------

    const productMap = {};

    if (productColumn && columns.includes(productColumn)) {
      rows.forEach((row) => {
        const product = String(row[productColumn] ?? "Unknown").trim();

        if (!product) return;

        if (!productMap[product]) {
          productMap[product] = {
            revenue: 0,
            orders: 0,
          };
        }

        if (revenueColumn) {
          productMap[product].revenue += toNumber(row[revenueColumn]);
        }

        if (ordersColumn) {
          productMap[product].orders += toNumber(row[ordersColumn]);
        }
      });
    }

    const products = Object.entries(productMap)
      .map(([name, values]) => ({
        name,
        ...values,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topProduct = products[0] || null;
    const lowestProduct = products[products.length - 1] || null;

    // ---------------------------------------------------
    // REGION ANALYSIS
    // ---------------------------------------------------

    const regionMap = {};

    if (regionColumn && columns.includes(regionColumn)) {
      rows.forEach((row) => {
        const region = String(row[regionColumn] ?? "Unknown").trim();

        if (!region) return;

        if (!regionMap[region]) {
          regionMap[region] = {
            revenue: 0,
            orders: 0,
          };
        }

        if (revenueColumn) {
          regionMap[region].revenue += toNumber(row[revenueColumn]);
        }

        if (ordersColumn) {
          regionMap[region].orders += toNumber(row[ordersColumn]);
        }
      });
    }

    const regions = Object.entries(regionMap)
      .map(([name, values]) => ({
        name,
        ...values,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topRegion = regions[0] || null;
    const lowestRegion = regions[regions.length - 1] || null;

    // ---------------------------------------------------
    // DELIVERY ANALYSIS
    // ---------------------------------------------------

    let delayedOrders = 0;
    let fastOrders = 0;

    if (deliveryColumn) {
      rows.forEach((row) => {
        const days = toNumber(row[deliveryColumn]);

        if (days > 4) delayedOrders += 1;
        if (days <= 3) fastOrders += 1;
      });
    }

    const deliveryRecords =
      deliveryColumn && rows.length > 0
        ? rows.filter(
            (row) =>
              row[deliveryColumn] !== null &&
              row[deliveryColumn] !== undefined &&
              row[deliveryColumn] !== ""
          ).length
        : 0;

    const delayRate =
      deliveryRecords > 0 ? (delayedOrders / deliveryRecords) * 100 : 0;

    // ---------------------------------------------------
    // DATE ANALYSIS
    // ---------------------------------------------------

    let earliestDate = null;
    let latestDate = null;

    if (dateColumn) {
      const dates = rows
        .map((row) => parseDate(row[dateColumn]))
        .filter(Boolean)
        .sort((a, b) => a - b);

      if (dates.length > 0) {
        earliestDate = dates[0];
        latestDate = dates[dates.length - 1];
      }
    }

    // ---------------------------------------------------
    // DATA QUALITY
    // ---------------------------------------------------

    let totalMissing = 0;
    let totalCells = rows.length * columns.length;

    columns.forEach((column) => {
      rows.forEach((row) => {
        const value = row[column];

        if (
          value === null ||
          value === undefined ||
          String(value).trim() === ""
        ) {
          totalMissing += 1;
        }
      });
    });

    const completeness =
      totalCells > 0
        ? ((totalCells - totalMissing) / totalCells) * 100
        : 100;

    // ---------------------------------------------------
    // REVENUE TREND
    // ---------------------------------------------------

    let revenueGrowth = null;

    if (dateColumn && revenueColumn) {
      const datedRows = rows
        .map((row) => {
          const date = parseDate(row[dateColumn]);
          const revenue = toNumber(row[revenueColumn]);

          return {
            date,
            revenue,
          };
        })
        .filter((item) => item.date);

      if (datedRows.length >= 2) {
        datedRows.sort((a, b) => a.date - b.date);

        const midpoint = Math.floor(datedRows.length / 2);

        const firstHalf = datedRows
          .slice(0, midpoint)
          .reduce((sum, item) => sum + item.revenue, 0);

        const secondHalf = datedRows
          .slice(midpoint)
          .reduce((sum, item) => sum + item.revenue, 0);

        if (firstHalf > 0) {
          revenueGrowth =
            ((secondHalf - firstHalf) / firstHalf) * 100;
        }
      }
    }

    // ---------------------------------------------------
    // OBSERVATIONS
    // ---------------------------------------------------

    const observations = [];

    if (topProduct) {
      observations.push({
        type: "positive",
        title: "Revenue leader",
        text: `${topProduct.name} generated the highest revenue at ${formatCurrency(
          topProduct.revenue
        )}.`,
      });
    }

    if (topRegion) {
      observations.push({
        type: "positive",
        title: "Leading region",
        text: `${topRegion.name} generated the highest regional revenue at ${formatCurrency(
          topRegion.revenue
        )}.`,
      });
    }

    if (revenueGrowth !== null) {
      observations.push({
        type: revenueGrowth >= 0 ? "positive" : "warning",
        title: revenueGrowth >= 0 ? "Revenue growing" : "Revenue pressure",
        text:
          revenueGrowth >= 0
            ? `Revenue increased by approximately ${Math.abs(
                revenueGrowth
              ).toFixed(1)}% across the available time period.`
            : `Revenue decreased by approximately ${Math.abs(
                revenueGrowth
              ).toFixed(1)}% across the available time period.`,
      });
    }

    if (delayRate > 20) {
      observations.push({
        type: "warning",
        title: "Delivery risk",
        text: `${delayRate.toFixed(
          1
        )}% of available delivery records exceed the 4-day threshold.`,
      });
    } else if (deliveryRecords > 0) {
      observations.push({
        type: "positive",
        title: "Delivery health",
        text: `Approximately ${(100 - delayRate).toFixed(
          1
        )}% of delivery records are within the 4-day threshold.`,
      });
    }

    if (grossMargin < 20 && totalRevenue > 0) {
      observations.push({
        type: "warning",
        title: "Margin pressure",
        text: `Gross margin is ${grossMargin.toFixed(
          1
        )}%, indicating that cost structure deserves attention.`,
      });
    } else if (totalRevenue > 0) {
      observations.push({
        type: "positive",
        title: "Margin position",
        text: `Gross margin stands at ${grossMargin.toFixed(
          1
        )}% based on the uploaded revenue and cost fields.`,
      });
    }

    if (completeness < 95) {
      observations.push({
        type: "warning",
        title: "Data quality",
        text: `Dataset completeness is ${completeness.toFixed(
          1
        )}%. Missing values should be reviewed before deeper analysis.`,
      });
    } else {
      observations.push({
        type: "positive",
        title: "Data quality",
        text: `Dataset completeness is ${completeness.toFixed(
          1
        )}%, providing a strong base for analysis.`,
      });
    }

    // ---------------------------------------------------
    // ACTIONS
    // ---------------------------------------------------

    const actions = [];

    if (topProduct) {
      actions.push(
        `Review ${topProduct.name}'s demand and inventory position because it contributes the most revenue.`
      );
    }

    if (lowestProduct && products.length > 1) {
      actions.push(
        `Investigate ${lowestProduct.name} for pricing, demand, promotion, or assortment issues.`
      );
    }

    if (topRegion && regions.length > 1) {
      actions.push(
        `Compare ${topRegion.name} against lower-performing regions to identify transferable practices.`
      );
    }

    if (delayRate > 20) {
      actions.push(
        "Investigate delayed deliveries by region, customer, supplier, or order type."
      );
    }

    if (grossMargin < 20) {
      actions.push(
        "Review high-cost products and cost drivers to identify margin improvement opportunities."
      );
    }

    if (revenueGrowth !== null && revenueGrowth < 0) {
      actions.push(
        "Investigate the recent revenue decline using product, region, and order-level trends."
      );
    }

    if (actions.length === 0) {
      actions.push(
        "Continue monitoring revenue, margin, customer activity, and operational performance."
      );
    }

    return {
      rows,
      columns,
      totalRevenue,
      totalCost,
      grossProfit,
      grossMargin,
      totalOrders,
      uniqueProducts,
      uniqueRegions,
      uniqueCustomers,
      averageOrderValue,
      averageDeliveryDays,
      topProduct,
      lowestProduct,
      topRegion,
      lowestRegion,
      delayRate,
      delayedOrders,
      fastOrders,
      deliveryRecords,
      earliestDate,
      latestDate,
      completeness,
      totalMissing,
      revenueGrowth,
      observations,
      actions,
    };
  }, [dataset]);

  const handlePrint = () => {
    window.print();
  };

  if (!report) {
    return (
      <section id="reports" className="dashboard-section reports-section">
        <div className="section-title">
          <div>
            <p className="tagline">EXECUTIVE REPORTING</p>
            <h2>Reports & Executive Summary</h2>
          </div>
        </div>

        <div className="reports-empty">
          <div className="reports-empty-icon">📄</div>
          <h3>No dataset available</h3>
          <p>
            Upload a CSV or Excel file to generate an executive summary
            from your business data.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="reports" className="dashboard-section reports-section">
      <div className="section-title">
        <div>
          <p className="tagline">EXECUTIVE REPORTING</p>
          <h2>Reports & Executive Summary</h2>
          <p className="section-subtitle">
            A management-ready summary generated from the uploaded dataset.
          </p>
        </div>

        <button className="report-print-btn" onClick={handlePrint}>
          🖨 Print / Save PDF
        </button>
      </div>

      <div className="report-source-bar">
        <span>Source:</span>
        <strong>{dataset.fileName}</strong>
        <span>•</span>
        <span>{report.rows.length} records</span>
        <span>•</span>
        <span>{report.columns.length} columns</span>
      </div>

      {/* EXECUTIVE KPI GRID */}
      <div className="report-kpi-grid">
        <div className="report-kpi-card">
          <span>Total Revenue</span>
          <strong>{formatCurrency(report.totalRevenue)}</strong>
        </div>

        <div className="report-kpi-card">
          <span>Gross Margin</span>
          <strong>{report.grossMargin.toFixed(1)}%</strong>
        </div>

        <div className="report-kpi-card">
          <span>Total Orders</span>
          <strong>{formatNumber(report.totalOrders)}</strong>
        </div>

        <div className="report-kpi-card">
          <span>Customers</span>
          <strong>{formatNumber(report.uniqueCustomers)}</strong>
        </div>

        <div className="report-kpi-card">
          <span>Average Order Value</span>
          <strong>{formatCurrency(report.averageOrderValue)}</strong>
        </div>

        <div className="report-kpi-card">
          <span>Average Delivery</span>
          <strong>{report.averageDeliveryDays.toFixed(1)} days</strong>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="report-summary-card">
        <div className="report-card-heading">
          <div>
            <p className="tagline">MANAGEMENT VIEW</p>
            <h3>Executive Summary</h3>
          </div>
        </div>

        <p>
          The uploaded dataset contains{" "}
          <strong>{formatNumber(report.rows.length)}</strong> records
          across <strong>{report.columns.length}</strong> fields. The
          business generated{" "}
          <strong>{formatCurrency(report.totalRevenue)}</strong> in
          revenue with a gross margin of{" "}
          <strong>{report.grossMargin.toFixed(1)}%</strong>.
          {report.topProduct && (
            <>
              {" "}
              <strong>{report.topProduct.name}</strong> is the leading
              product by revenue.
            </>
          )}
          {report.topRegion && (
            <>
              {" "}
              <strong>{report.topRegion.name}</strong> is the leading
              region by revenue.
            </>
          )}
        </p>
      </div>

      {/* OBSERVATIONS */}
      <div className="report-block">
        <div className="report-card-heading">
          <div>
            <p className="tagline">KEY FINDINGS</p>
            <h3>Business Observations</h3>
          </div>
        </div>

        <div className="report-observation-grid">
          {report.observations.map((item, index) => (
            <div
              key={index}
              className={`report-observation-card ${item.type}`}
            >
              <div className="report-observation-icon">
                {item.type === "warning" ? "⚠" : "✓"}
              </div>

              <div>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PERFORMANCE SNAPSHOT */}
      <div className="report-two-column">
        <div className="report-panel">
          <p className="tagline">PRODUCT PERFORMANCE</p>
          <h3>Product Snapshot</h3>

          {report.topProduct ? (
            <>
              <div className="report-highlight">
                <span>Top Product</span>
                <strong>{report.topProduct.name}</strong>
                <small>
                  {formatCurrency(report.topProduct.revenue)} revenue
                </small>
              </div>

              {report.lowestProduct &&
                report.lowestProduct.name !== report.topProduct.name && (
                  <div className="report-secondary">
                    <span>Lowest Revenue Product</span>
                    <strong>{report.lowestProduct.name}</strong>
                    <small>
                      {formatCurrency(report.lowestProduct.revenue)} revenue
                    </small>
                  </div>
                )}
            </>
          ) : (
            <p className="report-muted">
              Product-level data was not detected.
            </p>
          )}
        </div>

        <div className="report-panel">
          <p className="tagline">REGIONAL PERFORMANCE</p>
          <h3>Region Snapshot</h3>

          {report.topRegion ? (
            <>
              <div className="report-highlight">
                <span>Top Region</span>
                <strong>{report.topRegion.name}</strong>
                <small>
                  {formatCurrency(report.topRegion.revenue)} revenue
                </small>
              </div>

              {report.lowestRegion &&
                report.lowestRegion.name !== report.topRegion.name && (
                  <div className="report-secondary">
                    <span>Lowest Revenue Region</span>
                    <strong>{report.lowestRegion.name}</strong>
                    <small>
                      {formatCurrency(report.lowestRegion.revenue)} revenue
                    </small>
                  </div>
                )}
            </>
          ) : (
            <p className="report-muted">
              Regional data was not detected.
            </p>
          )}
        </div>
      </div>

      {/* OPERATIONS */}
      <div className="report-two-column">
        <div className="report-panel">
          <p className="tagline">OPERATIONS</p>
          <h3>Delivery Performance</h3>

          <div className="report-stat-row">
            <span>Average delivery</span>
            <strong>{report.averageDeliveryDays.toFixed(1)} days</strong>
          </div>

          <div className="report-stat-row">
            <span>Fast deliveries</span>
            <strong>{formatNumber(report.fastOrders)}</strong>
          </div>

          <div className="report-stat-row">
            <span>Delayed deliveries</span>
            <strong>{formatNumber(report.delayedOrders)}</strong>
          </div>

          <div className="report-stat-row">
            <span>Delay rate</span>
            <strong>{report.delayRate.toFixed(1)}%</strong>
          </div>
        </div>

        <div className="report-panel">
          <p className="tagline">DATA QUALITY</p>
          <h3>Dataset Health</h3>

          <div className="quality-score">
            <strong>{report.completeness.toFixed(1)}%</strong>
            <span>Complete</span>
          </div>

          <div className="report-stat-row">
            <span>Total missing cells</span>
            <strong>{formatNumber(report.totalMissing)}</strong>
          </div>

          <div className="report-stat-row">
            <span>Products detected</span>
            <strong>{formatNumber(report.uniqueProducts)}</strong>
          </div>

          <div className="report-stat-row">
            <span>Regions detected</span>
            <strong>{formatNumber(report.uniqueRegions)}</strong>
          </div>
        </div>
      </div>

      {/* RECOMMENDED ACTIONS */}
      <div className="report-actions-card">
        <div className="report-card-heading">
          <div>
            <p className="tagline">DECISION SUPPORT</p>
            <h3>Recommended Actions</h3>
          </div>
        </div>

        <div className="report-action-list">
          {report.actions.map((action, index) => (
            <div className="report-action-item" key={index}>
              <span>{index + 1}</span>
              <p>{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PERIOD */}
      {(report.earliestDate || report.latestDate) && (
        <div className="report-period">
          <span>Analysis period</span>
          <strong>
            {report.earliestDate
              ? report.earliestDate.toLocaleDateString("en-IN")
              : "—"}{" "}
            →{" "}
            {report.latestDate
              ? report.latestDate.toLocaleDateString("en-IN")
              : "—"}
          </strong>
        </div>
      )}
    </section>
  );
}