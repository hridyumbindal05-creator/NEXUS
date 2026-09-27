import { useState } from "react";
import "./App.css";
import { Analytics } from "@vercel/analytics/react";

import ProductManagement from "./ProductManagement";
import Operations from "./Operations";
import DataUpload from "./DataUpload";
import ProjectManagement from "./ProjectManagement";
import DataInsights from "./DataInsights";
import Reports from "./Reports";
import DatasetHistory from "./DatasetHistory";


function App() {
  // =========================================================
  // STATE
  // =========================================================

  const [showDashboard, setShowDashboard] =
    useState(false);

  const [selectedPeriod, setSelectedPeriod] =
    useState("6months");

  const [hoveredPoint, setHoveredPoint] =
    useState(null);

  const [uploadedDataset, setUploadedDataset] =
    useState(null);

  const [selectedDatasetId, setSelectedDatasetId] =
    useState(null);

  const [analysisRegion, setAnalysisRegion] =
    useState("All Regions");

  // =========================================================
  // REAL-TIME DATE / TIME
  // =========================================================

  const currentDate = new Date();
  const currentHour = currentDate.getHours();

  let greeting;

  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 17) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  const reportPeriod =
    currentDate.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });

  const lastUpdated =
    currentDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // =========================================================
  // FORMAT HELPERS
  // =========================================================

  const formatCurrency = (value) => {
    if (!Number.isFinite(value)) {
      return "—";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatCurrencyLakhs = (value) => {
    if (!Number.isFinite(value)) {
      return "—";
    }

    return `₹${(value / 100000).toFixed(1)}L`;
  };

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) {
      return "—";
    }

    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDecimal = (value) => {
    if (!Number.isFinite(value)) {
      return "—";
    }

    return Number(value).toFixed(1);
  };

  // =========================================================
  // DEMO KPI DATA
  // Used only when no file has been uploaded
  // =========================================================

  const demoKpis = [
    {
      label: "TOTAL REVENUE",
      value: "₹12.4L",
      change: "+8.2%",
      changeText: "vs last month",
      target: "₹11.8L",
      variance: "+₹0.6L",
      progress: 100,
      status: "DEMO DATA",
      statusType: "positive",
      definition:
        "Demo revenue displayed before a business dataset is uploaded.",
    },

    {
      label: "GROSS MARGIN",
      value: "34.7%",
      change: "+2.1 pp",
      changeText: "vs last month",
      target: "32.0%",
      variance: "+2.7 pp",
      progress: 100,
      status: "DEMO DATA",
      statusType: "positive",
      definition:
        "Demo gross margin displayed before a business dataset is uploaded.",
    },

    {
      label: "TOTAL ORDERS",
      value: "1,284",
      change: "+5.4%",
      changeText: "vs last month",
      target: "1,200",
      variance: "+84",
      progress: 100,
      status: "DEMO DATA",
      statusType: "positive",
      definition:
        "Demo order count displayed before a business dataset is uploaded.",
    },

    {
      label: "CUSTOMERS",
      value: "540",
      change: "+6.3%",
      changeText: "vs last month",
      target: "500",
      variance: "+40",
      progress: 100,
      status: "DEMO DATA",
      statusType: "positive",
      definition:
        "Demo customer count displayed before a business dataset is uploaded.",
    },
  ];

  // =========================================================
  // LIVE KPI DATA
  // =========================================================

  const liveKpis = uploadedDataset?.metrics
    ? [
        {
          label: "TOTAL REVENUE",
          value: formatCurrency(
            uploadedDataset.metrics.totalRevenue
          ),
          change: "CALCULATED",
          changeText: "from your data",
          target: "—",
          variance: "—",
          progress: 100,
          status: "LIVE DATA",
          statusType: "positive",
          definition:
            "Total revenue calculated directly from the uploaded dataset.",
        },

        {
          label: "GROSS MARGIN",
          value: `${formatDecimal(
            uploadedDataset.metrics.grossMargin
          )}%`,
          change: "CALCULATED",
          changeText: "revenue vs cost",
          target: "—",
          variance: "—",
          progress: Math.min(
            Math.max(
              uploadedDataset.metrics.grossMargin,
              0
            ),
            100
          ),
          status: "LIVE DATA",
          statusType: "positive",
          definition:
            "Gross margin calculated from uploaded revenue and cost fields.",
        },

        {
          label: "TOTAL ORDERS",
          value: formatNumber(
            uploadedDataset.metrics.totalOrders
          ),
          change: "CALCULATED",
          changeText: "from your data",
          target: "—",
          variance: "—",
          progress: 100,
          status: "LIVE DATA",
          statusType: "positive",
          definition:
            "Total order quantity calculated from the uploaded dataset.",
        },

        {
          label: "CUSTOMERS",
          value: formatNumber(
            uploadedDataset.metrics.uniqueCustomers
          ),
          change: "UNIQUE",
          changeText: "customers detected",
          target: "—",
          variance: "—",
          progress: 100,
          status: "LIVE DATA",
          statusType: "positive",
          definition:
            "Unique customers detected in the uploaded dataset.",
        },

        {
          label: "AVERAGE ORDER VALUE",
          value: formatCurrency(
            uploadedDataset.metrics.averageOrderValue
          ),
          change: "CALCULATED",
          changeText: "revenue / orders",
          target: "—",
          variance: "—",
          progress: 100,
          status: "LIVE DATA",
          statusType: "positive",
          definition:
            "Average revenue generated per order.",
        },

        {
          label: "AVG DELIVERY TIME",
          value: `${formatDecimal(
            uploadedDataset.metrics.averageDeliveryDays
          )} days`,
          change: "CALCULATED",
          changeText: "from your data",
          target: "—",
          variance: "—",
          progress: 100,
          status: "LIVE DATA",
          statusType: "positive",
          definition:
            "Average delivery duration calculated from uploaded delivery data.",
        },

        {
          label: "PRODUCTS",
          value: formatNumber(
            uploadedDataset.metrics.uniqueProducts
          ),
          change: "UNIQUE",
          changeText: "products detected",
          target: "—",
          variance: "—",
          progress: 100,
          status: "LIVE DATA",
          statusType: "positive",
          definition:
            "Unique products detected in the uploaded dataset.",
        },

        {
          label: "REGIONS",
          value: formatNumber(
            uploadedDataset.metrics.uniqueRegions
          ),
          change: "UNIQUE",
          changeText: "regions detected",
          target: "—",
          variance: "—",
          progress: 100,
          status: "LIVE DATA",
          statusType: "positive",
          definition:
            "Unique regions detected in the uploaded dataset.",
        },
      ]
    : [];

  const dashboardKpis = uploadedDataset
    ? liveKpis
    : demoKpis;

  // =========================================================
  // SAMPLE PERFORMANCE DATA
  // =========================================================

  const sampleRevenueDataByPeriod = {
    "6months": [
      { month: "Apr", value: 820000 },
      { month: "May", value: 910000 },
      { month: "Jun", value: 870000 },
      { month: "Jul", value: 1040000 },
      { month: "Aug", value: 980000 },
      { month: "Sep", value: 1240000 },
    ],

    "3months": [
      { month: "Jul", value: 1040000 },
      { month: "Aug", value: 980000 },
      { month: "Sep", value: 1240000 },
    ],

    "30days": [
      { month: "Week 1", value: 270000 },
      { month: "Week 2", value: 310000 },
      { month: "Week 3", value: 300000 },
      { month: "Week 4", value: 360000 },
    ],
  };

  // =========================================================
  // USER PERFORMANCE DATA
  // =========================================================

  const getUserPerformanceData = () => {
    if (
      !uploadedDataset?.data ||
      !uploadedDataset?.metrics
    ) {
      return null;
    }

    const dateColumn =
      uploadedDataset.metrics.dateColumn;

    const revenueColumn =
      uploadedDataset.metrics.revenueColumn;

    if (!dateColumn || !revenueColumn) {
      return null;
    }

    const rows = uploadedDataset.data
      .map((row) => {
        const date = new Date(
          row[dateColumn]
        );

        const revenue = Number(
          String(
            row[revenueColumn] ?? ""
          )
            .replace(/₹/g, "")
            .replace(/,/g, "")
            .trim()
        );

        return {
          date,
          revenue: Number.isFinite(revenue)
            ? revenue
            : 0,
        };
      })
      .filter(
        (item) =>
          !Number.isNaN(
            item.date.getTime()
          )
      )
      .sort(
        (a, b) =>
          a.date.getTime() -
          b.date.getTime()
      );

    if (!rows.length) {
      return null;
    }

    const latestDate =
      new Date(
        rows[rows.length - 1].date
      );

    // ---------------------------------------------------------
    // MONTHLY DATA
    // ---------------------------------------------------------

    const buildMonthlyData = (months) => {
      const result = [];

      for (
        let index = months - 1;
        index >= 0;
        index--
      ) {
        const targetDate =
          new Date(latestDate);

        targetDate.setMonth(
          targetDate.getMonth() - index
        );

        const targetYear =
          targetDate.getFullYear();

        const targetMonth =
          targetDate.getMonth();

        const monthlyRevenue =
          rows
            .filter(
              (item) =>
                item.date.getFullYear() ===
                  targetYear &&
                item.date.getMonth() ===
                  targetMonth
            )
            .reduce(
              (sum, item) =>
                sum + item.revenue,
              0
            );

        result.push({
          month:
            targetDate.toLocaleDateString(
              "en-IN",
              {
                month: "short",
              }
            ),
          value: monthlyRevenue,
        });
      }

      return result;
    };

    // ---------------------------------------------------------
    // LAST 30 DAYS
    // ---------------------------------------------------------

    const build30DayData = () => {
      const startDate =
        new Date(latestDate);

      startDate.setDate(
        startDate.getDate() - 29
      );

      const result = [
        {
          month: "Week 1",
          value: 0,
        },
        {
          month: "Week 2",
          value: 0,
        },
        {
          month: "Week 3",
          value: 0,
        },
        {
          month: "Week 4",
          value: 0,
        },
      ];

      rows.forEach((item) => {
        if (
          item.date < startDate ||
          item.date > latestDate
        ) {
          return;
        }

        const dayDifference =
          Math.floor(
            (item.date -
              startDate) /
              (1000 *
                60 *
                60 *
                24)
          );

        let weekIndex =
          Math.floor(
            dayDifference / 7
          );

        if (weekIndex > 3) {
          weekIndex = 3;
        }

        result[weekIndex].value +=
          item.revenue;
      });

      return result;
    };

    return {
      "6months":
        buildMonthlyData(6),

      "3months":
        buildMonthlyData(3),

      "30days":
        build30DayData(),
    };
  };

  const userPerformanceData =
    getUserPerformanceData();

  const revenueDataByPeriod =
    userPerformanceData ||
    sampleRevenueDataByPeriod;

  const rawRevenueData =
    revenueDataByPeriod[
      selectedPeriod
    ] || [];

  // Ignore empty periods for visual trend analysis
  // when actual user data is available.
  const populatedRevenueData =
    rawRevenueData.filter(
      (item) => item.value > 0
    );

  const revenueData =
    uploadedDataset &&
    populatedRevenueData.length > 0
      ? populatedRevenueData
      : rawRevenueData;

  // =========================================================
  // CHART CALCULATIONS
  // =========================================================

  const maxRevenue =
    revenueData.length > 0
      ? Math.max(
          ...revenueData.map(
            (item) => item.value
          )
        )
      : 0;

  const minRevenue =
    revenueData.length > 0
      ? Math.min(
          ...revenueData.map(
            (item) => item.value
          )
        )
      : 0;

  const revenueRange =
    maxRevenue - minRevenue || 1;

  const chartPoints =
    revenueData.map(
      (item, index) => {
        const x =
          revenueData.length === 1
            ? 300
            : 25 +
              (index * 550) /
                (revenueData.length - 1);

        const y =
          205 -
          ((item.value -
            minRevenue) /
            revenueRange) *
            160;

        return {
          x,
          y,
          month: item.month,
          value: item.value,
        };
      }
    );

  // =========================================================
  // REVENUE GROWTH
  // =========================================================

  const firstRevenue =
    revenueData.length > 0
      ? revenueData[0].value
      : 0;

  const latestRevenue =
    revenueData.length > 0
      ? revenueData[
          revenueData.length - 1
        ].value
      : 0;

  const revenueGrowth =
    firstRevenue > 0 &&
    revenueData.length > 1
      ? ((latestRevenue -
          firstRevenue) /
          firstRevenue) *
        100
      : 0;

  const growthLabel =
    revenueData.length > 1
      ? `${
          revenueGrowth >= 0
            ? "+"
            : ""
        }${revenueGrowth.toFixed(
          1
        )}%`
      : "N/A";

  const periodNames = {
    "6months":
      "the selected six-month period",

    "3months":
      "the selected three-month period",

    "30days":
      "the selected 30-day period",
  };

  // =========================================================
  // REGIONAL ANALYSIS
  // =========================================================

  const sampleRegionalData = [
    {
      region: "North",
      revenue: 380000,
      orders: 392,
    },
    {
      region: "West",
      revenue: 320000,
      orders: 336,
    },
    {
      region: "South",
      revenue: 290000,
      orders: 301,
    },
    {
      region: "East",
      revenue: 250000,
      orders: 255,
    },
  ];

  const getLiveRegionalData = () => {
    if (
      !uploadedDataset?.data ||
      !uploadedDataset?.metrics
    ) {
      return null;
    }

    const regionColumn =
      uploadedDataset.metrics.regionColumn;

    const revenueColumn =
      uploadedDataset.metrics.revenueColumn;

    const ordersColumn =
      uploadedDataset.metrics.ordersColumn;

    if (!regionColumn) {
      return null;
    }

    const regionMap = {};

    uploadedDataset.data.forEach(
      (row) => {
        const region = String(
          row[regionColumn] ?? ""
        ).trim();

        if (!region) {
          return;
        }

        if (!regionMap[region]) {
          regionMap[region] = {
            region,
            revenue: 0,
            orders: 0,
          };
        }

        const revenue =
          revenueColumn
            ? Number(
                String(
                  row[revenueColumn] ??
                    ""
                )
                  .replace(
                    /₹/g,
                    ""
                  )
                  .replace(
                    /,/g,
                    ""
                  )
              )
            : 0;

        const orders =
          ordersColumn
            ? Number(
                String(
                  row[ordersColumn] ??
                    ""
                ).replace(
                  /,/g,
                  ""
                )
              )
            : 1;

        regionMap[
          region
        ].revenue +=
          Number.isFinite(
            revenue
          )
            ? revenue
            : 0;

        regionMap[
          region
        ].orders +=
          Number.isFinite(
            orders
          )
            ? orders
            : 1;
      }
    );

    return Object.values(
      regionMap
    ).sort(
      (a, b) =>
        b.revenue - a.revenue
    );
  };

  const regionalData =
    getLiveRegionalData() ||
    sampleRegionalData;

  const filteredRegionalData =
    analysisRegion === "All Regions"
      ? regionalData
      : regionalData.filter(
          (item) =>
            item.region ===
            analysisRegion
        );

  const topRegion =
    regionalData.length > 0
      ? regionalData[0]
      : null;

  const bottomRegion =
    regionalData.length > 0
      ? regionalData[
          regionalData.length - 1
        ]
      : null;

  // =========================================================
  // PRODUCT ANALYSIS
  // =========================================================

  const getProductPerformance = () => {
    if (
      !uploadedDataset?.data ||
      !uploadedDataset?.metrics
    ) {
      return [];
    }

    const productColumn =
      uploadedDataset.metrics.productColumn;

    const revenueColumn =
      uploadedDataset.metrics.revenueColumn;

    const ordersColumn =
      uploadedDataset.metrics.ordersColumn;

    if (
      !productColumn ||
      !revenueColumn
    ) {
      return [];
    }

    const productMap = {};

    uploadedDataset.data.forEach(
      (row) => {
        const product = String(
          row[productColumn] ??
            ""
        ).trim();

        if (!product) {
          return;
        }

        if (!productMap[product]) {
          productMap[product] = {
            product,
            revenue: 0,
            orders: 0,
          };
        }

        const revenue =
          Number(
            String(
              row[revenueColumn] ??
                ""
            )
              .replace(
                /₹/g,
                ""
              )
              .replace(
                /,/g,
                ""
              )
          );

        const orders =
          ordersColumn
            ? Number(
                String(
                  row[ordersColumn] ??
                    ""
                ).replace(
                  /,/g,
                  ""
                )
              )
            : 1;

        productMap[
          product
        ].revenue +=
          Number.isFinite(
            revenue
          )
            ? revenue
            : 0;

        productMap[
          product
        ].orders +=
          Number.isFinite(
            orders
          )
            ? orders
            : 1;
      }
    );

    return Object.values(
      productMap
    ).sort(
      (a, b) =>
        b.revenue - a.revenue
    );
  };

  const productPerformance =
    getProductPerformance();

  const topProduct =
    productPerformance.length > 0
      ? productPerformance[0]
      : null;

  const bottomProduct =
    productPerformance.length > 0
      ? productPerformance[
          productPerformance.length - 1
        ]
      : null;

  // =========================================================
  // BUSINESS FINDINGS
  // =========================================================

  const grossMargin =
    uploadedDataset?.metrics?.grossMargin ??
    null;

  const averageDelivery =
    uploadedDataset?.metrics
      ?.averageDeliveryDays ?? null;

  const analysisFindings = [
    {
      category: "REVENUE",

      title:
        revenueData.length > 1
          ? latestRevenue >
            firstRevenue
            ? "Revenue is growing"
            : latestRevenue <
              firstRevenue
            ? "Revenue is declining"
            : "Revenue is stable"
          : "Revenue trend unavailable",

      value:
        revenueData.length > 1
          ? growthLabel
          : "N/A",

      description:
        revenueData.length > 1
          ? `Revenue moved from ${formatCurrency(
              firstRevenue
            )} to ${formatCurrency(
              latestRevenue
            )} across the populated periods.`
          : "More than one populated period is required to determine revenue growth.",

      severity:
        revenueData.length > 1 &&
        revenueGrowth < 0
          ? "warning"
          : "positive",
    },

    {
      category: "PROFITABILITY",

      title:
        grossMargin !== null
          ? grossMargin >= 30
            ? "Healthy gross margin"
            : "Margin requires attention"
          : "Profitability unavailable",

      value:
        grossMargin !== null
          ? `${grossMargin.toFixed(
              1
            )}%`
          : "N/A",

      description:
        grossMargin !== null
          ? `Gross margin calculated from your uploaded revenue and cost data is ${grossMargin.toFixed(
              1
            )}%.`
          : "Revenue and Cost fields are required for profitability analysis.",

      severity:
        grossMargin !== null &&
        grossMargin >= 30
          ? "positive"
          : "warning",
    },

    {
      category: "PRODUCT",

      title: topProduct
        ? `${topProduct.product} leads revenue`
        : "Product analysis unavailable",

      value: topProduct
        ? formatCurrency(
            topProduct.revenue
          )
        : "N/A",

      description: topProduct
        ? `${topProduct.product} currently generates the highest detected revenue.`
        : "Product and Revenue fields are required for product analysis.",

      severity: topProduct
        ? "positive"
        : "warning",
    },

    {
      category: "REGIONAL",

      title: bottomRegion
        ? `${bottomRegion.region} has the lowest revenue`
        : "Regional analysis unavailable",

      value: bottomRegion
        ? formatCurrency(
            bottomRegion.revenue
          )
        : "N/A",

      description:
        topRegion &&
        bottomRegion
          ? `${topRegion.region} leads detected regional revenue while ${bottomRegion.region} contributes the least.`
          : "Region and Revenue fields are required for regional analysis.",

      severity:
        topRegion &&
        bottomRegion &&
        topRegion.region !==
          bottomRegion.region
          ? "warning"
          : "positive",
    },
  ];

  // =========================================================
  // BUSINESS ACTIONS
  // =========================================================

  const businessActions = [
    {
      priority: "HIGH",

      title: bottomRegion
        ? `Investigate ${bottomRegion.region}`
        : "Review regional performance",

      description:
        bottomRegion
          ? `Compare ${bottomRegion.region}'s revenue and order volume against stronger regions to identify the performance gap.`
          : "Review regional performance after a region field is detected.",

      owner: "Business Analysis",
    },

    {
      priority:
        grossMargin !== null &&
        grossMargin < 30
          ? "HIGH"
          : "MEDIUM",

      title:
        grossMargin !== null &&
        grossMargin < 30
          ? "Review margin drivers"
          : "Monitor profitability",

      description:
        grossMargin !== null
          ? `Current gross margin is ${grossMargin.toFixed(
              1
            )}%. Review cost structure and pricing.`
          : "Upload Revenue and Cost fields to enable profitability analysis.",

      owner: "Business Analysis",
    },

    {
      priority: "MEDIUM",

      title: topProduct
        ? `Protect ${topProduct.product}'s performance`
        : "Review product performance",

      description: topProduct
        ? `${topProduct.product} currently generates the highest detected revenue. Monitor demand and availability.`
        : "Use product-level analysis to identify your strongest products.",

      owner: "Product Management",
    },

    {
      priority:
        averageDelivery !== null &&
        averageDelivery > 4
          ? "HIGH"
          : "MEDIUM",

      title:
        averageDelivery !== null &&
        averageDelivery > 4
          ? "Reduce delivery time"
          : "Monitor delivery time",

      description:
        averageDelivery !== null
          ? `Average delivery time is ${averageDelivery.toFixed(
              1
            )} days. Review delays if this exceeds the business target.`
          : "Add delivery-time data to enable operational delivery analysis.",

      owner: "Operations",
    },
  ];

  // =========================================================
  // PROJECT DATA
  // =========================================================

  const projects = [
    {
      type: "PRODUCT",
      name: "Website Redesign",
      progress: 78,
      status: "On track",
      due: "October 12",
    },

    {
      type: "PRODUCT",
      name: "Mobile Application",
      progress: 52,
      status: "In progress",
      due: "November 4",
    },

    {
      type: "OPERATIONS",
      name: "CRM Implementation",
      progress: 91,
      status: "Almost complete",
      due: "September 28",
    },
  ];

  // =========================================================
  // ALERT DATA
  // =========================================================

  const alerts = [
    {
      priority: "HIGH PRIORITY",
      level: "high",

      title:
        averageDelivery !== null &&
        averageDelivery > 4
          ? "Delivery time requires attention"
          : "Monitor delivery performance",

      description:
        averageDelivery !== null
          ? `Average delivery time is ${averageDelivery.toFixed(
              1
            )} days based on your uploaded data.`
          : "Upload delivery-time data to activate operational monitoring.",

      action: "Investigate",
    },

    {
      priority: "MEDIUM PRIORITY",
      level: "medium",

      title: bottomRegion
        ? `${bottomRegion.region} needs analysis`
        : "Regional analysis required",

      description:
        bottomRegion
          ? `${bottomRegion.region} currently has the lowest detected regional revenue.`
          : "Upload regional data to enable regional monitoring.",

      action: "Analyze",
    },

    {
      priority: "MEDIUM PRIORITY",
      level: "medium",

      title:
        topProduct
          ? `Monitor ${topProduct.product}`
          : "Review product performance",

      description:
        topProduct
          ? `${topProduct.product} currently contributes the highest detected product revenue.`
          : "Upload product data to enable product monitoring.",

      action: "Review",
    },
  ];

  // =========================================================
  // DASHBOARD VIEW
  // =========================================================

  if (showDashboard) {
    return (
      <div className="dashboard">

        {/* ===================================================
            DASHBOARD HEADER
        ==================================================== */}

        <header className="dashboard-header">

          <div className="logo">
            NEXUS
          </div>

          <nav className="dashboard-nav">

            <a href="#overview">
              Overview
            </a>

            <a href="#analysis">
              Analysis
            </a>

            <a href="#products">
              Products
            </a>

            <a href="#operations">
              Operations
            </a>

            <a href="#performance">
              Performance
            </a>

            <a href="#projects">
              Projects
            </a>
            <a href="#data-insights">
              Insights
            </a>

            <a href="#dataset-history">
              History
            </a>

            <a href="#reports">
              Reports
            </a>

            <a href="#data-upload">
              Data
            </a>

            <a href="#alerts">
              Alerts
            </a>

          </nav>

          <button
            className="back-btn"
            onClick={() =>
              setShowDashboard(
                false
              )
            }
          >
            ← Home
          </button>

        </header>

        <main className="dashboard-content">

          {/* =================================================
              OVERVIEW
          ================================================= */}

          <section
            className="dashboard-title"
            id="overview"
          >

            <div>

              <p className="tagline">
                BUSINESS OVERVIEW
              </p>

              <h1>
                {greeting}.
              </h1>

              <p className="dashboard-description">

                {uploadedDataset
                  ? `Live analysis of ${uploadedDataset.fileName}`
                  : "Upload your business data to generate a live analysis."}

              </p>

            </div>

            <div className="date-box">

              <span>
                REPORT PERIOD
              </span>

              <strong>
                {reportPeriod}
              </strong>

              <small>
                Updated at{" "}
                {lastUpdated}
              </small>

            </div>

          </section>

          {/* =================================================
              KPI CARDS
          ================================================= */}

          <section className="kpi-grid">

            {dashboardKpis.map(
              (kpi) => (

                <div
                  className={`kpi-card ${kpi.statusType}`}
                  key={
                    kpi.label
                  }
                  title={
                    kpi.definition
                  }
                >

                  <div className="kpi-header">

                    <span>
                      {kpi.label}
                    </span>

                    <span
                      className={`kpi-status ${kpi.statusType}`}
                    >
                      {kpi.status}
                    </span>

                  </div>

                  <h2>
                    {kpi.value}
                  </h2>

                  <p
                    className={`kpi-change ${kpi.statusType}`}
                  >

                    {kpi.change}

                    <span>
                      {kpi.changeText}
                    </span>

                  </p>

                  <div className="kpi-details">

                    <div>

                      <span>
                        TARGET
                      </span>

                      <strong>
                        {kpi.target}
                      </strong>

                    </div>

                    <div>

                      <span>
                        VARIANCE
                      </span>

                      <strong>
                        {kpi.variance}
                      </strong>

                    </div>

                  </div>

                  <div className="kpi-progress">

                    <div
                      className="kpi-progress-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            kpi.progress,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    ></div>

                  </div>

                  <p className="kpi-definition">
                    {kpi.definition}
                  </p>

                </div>

              )
            )}

          </section>

          {/* =================================================
              BUSINESS ANALYSIS
          ================================================= */}

          <section
            className="dashboard-section"
            id="analysis"
          >

            <div className="section-title">

              <div>

                <p className="tagline">
                  BUSINESS ANALYSIS
                </p>

                <h2>
                  What is happening in the business?
                </h2>

                <p className="section-description">
                  NEXUS derives findings from the
                  uploaded business dataset.
                </p>

              </div>

              <select
                className="period-select"
                value={
                  analysisRegion
                }
                onChange={(event) =>
                  setAnalysisRegion(
                    event.target.value
                  )
                }
              >

                <option>
                  All Regions
                </option>

                {regionalData.map(
                  (region) => (

                    <option
                      key={
                        region.region
                      }
                      value={
                        region.region
                      }
                    >
                      {
                        region.region
                      }
                    </option>

                  )
                )}

              </select>

            </div>

            <div className="analysis-summary-grid">

              {analysisFindings.map(
                (finding) => (

                  <div
                    className={`analysis-card ${finding.severity}`}
                    key={
                      finding.title
                    }
                  >

                    <span>
                      {finding.category}
                    </span>

                    <h3>
                      {finding.title}
                    </h3>

                    <strong>
                      {finding.value}
                    </strong>

                    <p>
                      {finding.description}
                    </p>

                  </div>

                )
              )}

            </div>

            <div className="analysis-regional">

              <div className="regional-header">

                <div>

                  <span>
                    REGIONAL PERFORMANCE
                  </span>

                  <h3>
                    Revenue by region
                  </h3>

                </div>

                <p>
                  Based on detected regional data.
                </p>

              </div>

              <div className="regional-table">

                <div className="table-row table-heading">

                  <span>
                    REGION
                  </span>

                  <span>
                    REVENUE
                  </span>

                  <span>
                    ORDERS
                  </span>

                </div>

                {filteredRegionalData.map(
                  (region) => (

                    <div
                      className="table-row"
                      key={
                        region.region
                      }
                    >

                      <span>
                        {region.region}
                      </span>

                      <span>
                        {formatCurrency(
                          region.revenue
                        )}
                      </span>

                      <span>
                        {formatNumber(
                          region.orders
                        )}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

            <div className="action-panel">

              <div className="action-panel-header">

                <div>

                  <span>
                    RECOMMENDED ACTIONS
                  </span>

                  <h3>
                    Areas worth investigating
                  </h3>

                </div>

              </div>

              <div className="action-grid">

                {businessActions.map(
                  (action) => (

                    <div
                      className="action-card"
                      key={
                        action.title
                      }
                    >

                      <div className="action-top">

                        <span
                          className={`priority ${action.priority.toLowerCase()}`}
                        >
                          {
                            action.priority
                          }
                        </span>

                        <span className="action-owner">
                          {
                            action.owner
                          }
                        </span>

                      </div>

                      <h4>
                        {action.title}
                      </h4>

                      <p>
                        {
                          action.description
                        }
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>

          </section>

          {/* =================================================
              PRODUCT MANAGEMENT
          ================================================= */}

          <ProductManagement dataset={uploadedDataset} />

          {/* =================================================
              OPERATIONS
          ================================================= */}

          <Operations dataset={uploadedDataset} />

          {/* =================================================
              PERFORMANCE
          ================================================= */}

          <section
            className="dashboard-section"
            id="performance"
          >

            <div className="section-title">

              <div>

                <p className="tagline">
                  PERFORMANCE
                </p>

                <h2>
                  Business performance
                </h2>

              </div>

              <select
                className="period-select"
                value={
                  selectedPeriod
                }
                onChange={(event) =>
                  setSelectedPeriod(
                    event.target.value
                  )
                }
              >

                <option value="6months">
                  Last 6 months
                </option>

                <option value="3months">
                  Last 3 months
                </option>

                <option value="30days">
                  Last 30 days
                </option>

              </select>

            </div>

            <div className="performance-card">

              {/* LEFT SIDE */}

              <div className="chart-area">

                <div className="chart-header">

                  <div>

                    <span className="chart-title">
                      Revenue Trend
                    </span>

                    <p>
                      Revenue performance over time
                    </p>

                  </div>

                  <div className="chart-current-value">

                    <span>
                      CURRENT
                    </span>

                    <strong>
                      {formatCurrency(
                        latestRevenue
                      )}
                    </strong>

                  </div>

                </div>

                <div className="chart-wrapper">

                  <div className="y-axis">

                    <span>
                      {formatCurrencyLakhs(
                        maxRevenue
                      )}
                    </span>

                    <span>
                      {formatCurrencyLakhs(
                        (
                          maxRevenue +
                          minRevenue
                        ) / 2
                      )}
                    </span>

                    <span>
                      {formatCurrencyLakhs(
                        minRevenue
                      )}
                    </span>

                  </div>

                  <svg
                    className="performance-chart"
                    viewBox="0 0 600 240"
                    preserveAspectRatio="none"
                  >

                    <line
                      x1="25"
                      y1="45"
                      x2="575"
                      y2="45"
                      className="chart-grid-line"
                    />

                    <line
                      x1="25"
                      y1="125"
                      x2="575"
                      y2="125"
                      className="chart-grid-line"
                    />

                    <line
                      x1="25"
                      y1="205"
                      x2="575"
                      y2="205"
                      className="chart-grid-line"
                    />

                    <polyline
                      points={chartPoints
                        .map(
                          (point) =>
                            `${point.x},${point.y}`
                        )
                        .join(" ")}
                      fill="none"
                      className="chart-main-line"
                    />

                    {chartPoints.map(
                      (point) => (

                        <g
                          key={
                            point.month
                          }
                          onMouseEnter={() =>
                            setHoveredPoint(
                              point
                            )
                          }
                          onMouseLeave={() =>
                            setHoveredPoint(
                              null
                            )
                          }
                        >

                          <circle
                            cx={
                              point.x
                            }
                            cy={
                              point.y
                            }
                            r="10"
                            className="chart-point-hit"
                          />

                          <circle
                            cx={
                              point.x
                            }
                            cy={
                              point.y
                            }
                            r="6"
                            className="chart-point"
                          />

                          {hoveredPoint?.month ===
                            point.month && (

                            <g>

                              <rect
                                x={
                                  point.x -
                                  45
                                }
                                y={
                                  point.y -
                                  55
                                }
                                width="90"
                                height="35"
                                rx="7"
                                className="chart-tooltip"
                              />

                              <text
                                x={
                                  point.x
                                }
                                y={
                                  point.y -
                                  33
                                }
                                textAnchor="middle"
                                className="chart-tooltip-text"
                              >
                                {
                                  formatCurrencyLakhs(
                                    point.value
                                  )
                                }
                              </text>

                            </g>

                          )}

                        </g>

                      )
                    )}

                  </svg>

                </div>

                <div className="chart-labels">

                  {revenueData.map(
                    (item) => (

                      <span
                        key={
                          item.month
                        }
                      >
                        {
                          item.month
                        }
                      </span>

                    )
                  )}

                </div>

              </div>

              {/* RIGHT SIDE */}

              <div className="performance-summary">

                <span>
                  REVENUE GROWTH
                </span>

                <strong>
                  {growthLabel}
                </strong>

                <p>
                  {revenueData.length >
                    1
                    ? `Revenue moved from ${formatCurrency(
                        firstRevenue
                      )} to ${formatCurrency(
                        latestRevenue
                      )} over ${periodNames[
                        selectedPeriod
                      ]}.`
                    : "There is not enough populated data to calculate growth for this period."}
                </p>

                <div className="summary-divider"></div>

                <div className="summary-stat">

                  <span>
                    STARTING VALUE
                  </span>

                  <strong>
                    {formatCurrency(
                      firstRevenue
                    )}
                  </strong>

                </div>

                <div className="summary-stat">

                  <span>
                    LATEST VALUE
                  </span>

                  <strong>
                    {formatCurrency(
                      latestRevenue
                    )}
                  </strong>

                </div>

                <div className="summary-stat">

                  <span>
                    CHANGE
                  </span>

                  <strong className="summary-growth">
                    {growthLabel}
                  </strong>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              PROJECT MANAGEMENT
          ================================================= */}

           <ProjectManagement
            dataset={uploadedDataset}
          />

          <DataInsights
            dataset={uploadedDataset}
          />

          <DatasetHistory
            selectedDatasetId={selectedDatasetId}
            onSelectDataset={(id) => {
              setSelectedDatasetId(id);
            }}
          />

          <Reports dataset={uploadedDataset} />

          {/* =================================================
              BUSINESS SIGNALS
          ================================================= */}

          <section className="dashboard-section">

            <div className="section-title">

              <div>

                <p className="tagline">
                  CROSS-FUNCTIONAL SIGNALS
                </p>

                <h2>
                  Signals across the business
                </h2>

              </div>

            </div>

            <div className="signal-grid">

              <div className="signal-card">

                <span>
                  BUSINESS ANALYSIS
                </span>

                <h3>
                  {bottomRegion
                    ? `${bottomRegion.region} revenue`
                    : "Regional revenue"}
                </h3>

                <strong>
                  {bottomRegion
                    ? formatCurrency(
                        bottomRegion.revenue
                      )
                    : "—"}
                </strong>

                <p>
                  Review regional contribution
                  and identify performance gaps.
                </p>

              </div>

              <div className="signal-card">

                <span>
                  OPERATIONS
                </span>

                <h3>
                  Average delivery
                </h3>

                <strong>
                  {averageDelivery !==
                  null
                    ? `${averageDelivery.toFixed(
                        1
                      )} days`
                    : "—"}
                </strong>

                <p>
                  Monitor delivery duration
                  against the desired target.
                </p>

              </div>

              <div className="signal-card">

                <span>
                  PRODUCT MANAGEMENT
                </span>

                <h3>
                  Top product
                </h3>

                <strong>
                  {topProduct
                    ? topProduct.product
                    : "—"}
                </strong>

                <p>
                  Highest detected revenue
                  contribution.
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              DATA UPLOAD
          ================================================= */}

          <DataUpload
            selectedDatasetId={selectedDatasetId}
            onDataLoaded={(dataset) => {
              setUploadedDataset(dataset);

              if (dataset.datasetId) {
                setSelectedDatasetId(dataset.datasetId);
              }
            }}
          />

          {/* =================================================
              ALERTS
          ================================================= */}

          <section
            className="dashboard-section"
            id="alerts"
          >

            <div className="section-title">

              <div>

                <p className="tagline">
                  ATTENTION REQUIRED
                </p>

                <h2>
                  Business alerts
                </h2>

              </div>

            </div>

            <div className="alert-grid">

              {alerts.map(
                (alert) => (

                  <div
                    className={`alert-card ${alert.level}`}
                    key={
                      alert.title
                    }
                  >

                    <span>
                      {
                        alert.priority
                      }
                    </span>

                    <h3>
                      {
                        alert.title
                      }
                    </h3>

                    <p>
                      {
                        alert.description
                      }
                    </p>

                    <button>
                      {
                        alert.action
                      }{" "}
                      →
                    </button>

                  </div>

                )
              )}

            </div>

          </section>

        </main>

      </div>
    );
  }

  // =========================================================
  // LANDING PAGE
  // =========================================================

  return (
    <div className="app">
      <Analytics />

      <header className="header">

        <div className="logo">
          NEXUS
        </div>

        <nav className="nav">

          <a href="#home">
            Home
          </a>

          <a href="#features">
            Capabilities
          </a>

          <a href="#about">
            About
          </a>

        </nav>

        <button
          className="login-btn"
          onClick={() =>
            setShowDashboard(
              true
            )
          }
        >
          Get Started
        </button>

      </header>

      <main>

        <section
          className="hero"
          id="home"
        >

          <div className="hero-content">

            <p className="tagline">
              BUSINESS INTELLIGENCE
            </p>

            <h1>
              Turn data into{" "}
              <span>
                better decisions.
              </span>
            </h1>

            <p className="description">
              NEXUS transforms business data
              into KPIs, trends, insights and
              actions across business analysis,
              product management, operations and
              project management.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-btn"
                onClick={() =>
                  setShowDashboard(
                    true
                  )
                }
              >
                Explore NEXUS
              </button>

              <a
                className="secondary-btn"
                href="#features"
              >
                Explore capabilities
              </a>

            </div>

          </div>

          <div className="hero-card">

            <div className="orb"></div>

            <div className="card-content">

              <span>
                ●
              </span>

              <h2>
                NEXUS
              </h2>

              <p>
                Business. Intelligence. Insights.
              </p>

            </div>

          </div>

        </section>

        <section
          className="features"
          id="features"
        >

          <div className="section-heading">

            <p className="tagline">
              BUILT FOR BUSINESS TEAMS
            </p>

            <h2>
              From data to decisions.
            </h2>

          </div>

          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                01
              </div>

              <h3>
                Business Analysis
              </h3>

              <p>
                Identify trends, compare
                performance and surface
                business problems.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                02
              </div>

              <h3>
                Product & Operations
              </h3>

              <p>
                Monitor products, processes,
                operational efficiency and
                customer-facing performance.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                03
              </div>

              <h3>
                Data & Decisions
              </h3>

              <p>
                Convert raw business data into
                KPIs, findings and actionable
                recommendations.
              </p>

            </div>

          </div>

        </section>

      </main>

      <footer id="about">

        <p>
          © 2026 NEXUS. Built for better
          business decisions.
        </p>

      </footer>

    </div>
  );
}

export default App;