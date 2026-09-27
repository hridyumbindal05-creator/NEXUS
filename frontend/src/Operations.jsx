import { useMemo, useState } from "react";

function Operations({ dataset }) {
  const [selectedRegion, setSelectedRegion] =
    useState("All Regions");

  // =========================================================
  // HELPERS
  // =========================================================

  const toNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    const number = Number(
      String(value)
        .replace(/₹/g, "")
        .replace(/,/g, "")
        .trim()
    );

    return Number.isFinite(number)
      ? number
      : 0;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  // =========================================================
  // DATA COLUMNS
  // =========================================================

  const metrics = dataset?.metrics;

  const ordersColumn =
    metrics?.ordersColumn || null;

  const deliveryColumn =
    metrics?.deliveryColumn || null;

  const regionColumn =
    metrics?.regionColumn || null;

  const revenueColumn =
    metrics?.revenueColumn || null;

  // =========================================================
  // OPERATIONAL RECORDS
  // =========================================================

  const operationalRows = useMemo(() => {
    if (!dataset?.data) {
      return [];
    }

    return dataset.data
      .map((row) => ({
        region: regionColumn
          ? String(
              row[regionColumn] ?? ""
            ).trim()
          : "Unknown",

        orders: ordersColumn
          ? toNumber(
              row[ordersColumn]
            )
          : 1,

        deliveryDays: deliveryColumn
          ? toNumber(
              row[deliveryColumn]
            )
          : null,

        revenue: revenueColumn
          ? toNumber(
              row[revenueColumn]
            )
          : 0,
      }))
      .filter((row) => row.region);
  }, [
    dataset,
    ordersColumn,
    deliveryColumn,
    regionColumn,
    revenueColumn,
  ]);

  // =========================================================
  // CORE OPERATIONS METRICS
  // =========================================================

  const totalOrders =
    operationalRows.reduce(
      (sum, row) =>
        sum + row.orders,
      0
    );

  const deliveryRecords =
    operationalRows.filter(
      (row) =>
        row.deliveryDays !== null &&
        row.deliveryDays > 0
    );

  const averageDeliveryDays =
    deliveryRecords.length > 0
      ? deliveryRecords.reduce(
          (sum, row) =>
            sum + row.deliveryDays,
          0
        ) / deliveryRecords.length
      : 0;

  const fastDeliveryRecords =
    deliveryRecords.filter(
      (row) =>
        row.deliveryDays <= 3
    );

  const delayedDeliveryRecords =
    deliveryRecords.filter(
      (row) =>
        row.deliveryDays > 4
    );

  const fastDeliveryRate =
    deliveryRecords.length > 0
      ? (fastDeliveryRecords.length /
          deliveryRecords.length) *
        100
      : 0;

  const delayedDeliveryRate =
    deliveryRecords.length > 0
      ? (delayedDeliveryRecords.length /
          deliveryRecords.length) *
        100
      : 0;

  // =========================================================
  // DELIVERY DISTRIBUTION
  // =========================================================

  const deliveryDistribution = [
    {
      label: "1–2 days",
      count: deliveryRecords.filter(
        (row) =>
          row.deliveryDays <= 2
      ).length,
    },
    {
      label: "3–4 days",
      count: deliveryRecords.filter(
        (row) =>
          row.deliveryDays >= 3 &&
          row.deliveryDays <= 4
      ).length,
    },
    {
      label: "5–6 days",
      count: deliveryRecords.filter(
        (row) =>
          row.deliveryDays >= 5 &&
          row.deliveryDays <= 6
      ).length,
    },
    {
      label: "7+ days",
      count: deliveryRecords.filter(
        (row) =>
          row.deliveryDays >= 7
      ).length,
    },
  ];

  const maxDeliveryCount =
    Math.max(
      ...deliveryDistribution.map(
        (item) => item.count
      ),
      1
    );

  // =========================================================
  // REGIONAL OPERATIONS
  // =========================================================

  const regionalData = useMemo(() => {
    const regionMap = {};

    operationalRows.forEach(
      (row) => {
        if (!regionMap[row.region]) {
          regionMap[row.region] = {
            region: row.region,
            orders: 0,
            revenue: 0,
            deliveryTotal: 0,
            deliveryCount: 0,
          };
        }

        regionMap[row.region].orders +=
          row.orders;

        regionMap[row.region].revenue +=
          row.revenue;

        if (
          row.deliveryDays !== null &&
          row.deliveryDays > 0
        ) {
          regionMap[
            row.region
          ].deliveryTotal +=
            row.deliveryDays;

          regionMap[
            row.region
          ].deliveryCount += 1;
        }
      }
    );

    return Object.values(
      regionMap
    )
      .map((region) => ({
        ...region,

        averageDelivery:
          region.deliveryCount >
          0
            ? region.deliveryTotal /
              region.deliveryCount
            : 0,

        orderShare:
          totalOrders > 0
            ? (region.orders /
                totalOrders) *
              100
            : 0,
      }))
      .sort(
        (a, b) =>
          b.orders - a.orders
      );
  }, [
    operationalRows,
    totalOrders,
  ]);

  const filteredRegionalData =
    selectedRegion === "All Regions"
      ? regionalData
      : regionalData.filter(
          (region) =>
            region.region ===
            selectedRegion
        );

  const busiestRegion =
    regionalData.length > 0
      ? regionalData[0]
      : null;

  const slowestRegion =
    regionalData.length > 0
      ? [...regionalData].sort(
          (a, b) =>
            b.averageDelivery -
            a.averageDelivery
        )[0]
      : null;

  // =========================================================
  // OPERATIONAL ASSESSMENT
  // =========================================================

  let operationalStatus =
    "HEALTHY";

  if (
    delayedDeliveryRate > 30
  ) {
    operationalStatus =
      "NEEDS ATTENTION";
  } else if (
    delayedDeliveryRate > 15
  ) {
    operationalStatus =
      "MONITOR";
  }

  const operationalScore =
    deliveryRecords.length > 0
      ? Math.max(
          0,
          Math.min(
            100,
            100 -
              delayedDeliveryRate
          )
        )
      : 0;

  // =========================================================
  // BUSINESS ACTIONS
  // =========================================================

  const actions = [
    {
      priority:
        delayedDeliveryRate >
        20
          ? "HIGH"
          : "MEDIUM",

      title:
        delayedDeliveryRate >
        20
          ? "Reduce delivery delays"
          : "Monitor delivery delays",

      description:
        deliveryRecords.length > 0
          ? `${delayedDeliveryRate.toFixed(
              1
            )}% of delivery records took more than four days.`
          : "Delivery-time data is required for delay analysis.",

      owner: "Operations",
    },

    {
      priority: "MEDIUM",

      title: slowestRegion
        ? `Review ${slowestRegion.region} delivery`
        : "Review regional delivery",

      description:
        slowestRegion
          ? `${slowestRegion.region} has the highest average delivery time among detected regions.`
          : "Regional delivery analysis requires region and delivery fields.",

      owner: "Operations",
    },

    {
      priority: "MEDIUM",

      title: busiestRegion
        ? `Monitor ${busiestRegion.region} workload`
        : "Monitor regional workload",

      description:
        busiestRegion
          ? `${busiestRegion.region} accounts for ${busiestRegion.orderShare.toFixed(
              1
            )}% of detected order volume.`
          : "Order and region fields are required for workload analysis.",

      owner: "Operations",
    },
  ];

  // =========================================================
  // NO DATA STATE
  // =========================================================

  if (!dataset) {
    return (
      <section
        className="dashboard-section operations-section"
        id="operations"
      >
        <div className="section-title">
          <div>
            <p className="tagline">
              OPERATIONS
            </p>

            <h2>
              Operational intelligence
            </h2>

            <p className="section-description">
              Upload business data to activate
              operations analysis.
            </p>
          </div>
        </div>

        <div className="operations-panel">
          <div className="product-empty-state">
            <span>
              NO USER DATA
            </span>

            <h3>
              Operations analysis is waiting.
            </h3>

            <p>
              Upload data containing Orders,
              Delivery_Days and Region fields
              to activate this section.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================
  // MAIN VIEW
  // =========================================================

  return (
    <section
      className="dashboard-section operations-section"
      id="operations"
    >

      {/* HEADER */}

      <div className="section-title">
        <div>

          <p className="tagline">
            OPERATIONS
          </p>

          <h2>
            Operational intelligence
          </h2>

          <p className="section-description">
            Operational metrics calculated directly
            from the uploaded dataset.
          </p>

        </div>

        {regionColumn && (
          <select
            className="period-select"
            value={selectedRegion}
            onChange={(event) =>
              setSelectedRegion(
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
        )}

      </div>

      {/* =====================================================
          KPI GRID
      ====================================================== */}

      <div className="operations-kpi-grid">

        <div className="operations-kpi-card positive">
          <div className="operations-kpi-top">
            <span>
              TOTAL ORDERS
            </span>

            <span className="operations-kpi-status">
              LIVE DATA
            </span>
          </div>

          <h3>
            {formatNumber(
              totalOrders
            )}
          </h3>

          <p className="positive">
            Calculated from uploaded orders
          </p>

          <div className="operations-kpi-details">
            <div>
              <span>
                RECORDS
              </span>

              <strong>
                {formatNumber(
                  operationalRows.length
                )}
              </strong>
            </div>

            <div>
              <span>
                REGIONS
              </span>

              <strong>
                {formatNumber(
                  regionalData.length
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="operations-kpi-card">
          <div className="operations-kpi-top">
            <span>
              AVG DELIVERY TIME
            </span>

            <span className="operations-kpi-status">
              LIVE DATA
            </span>
          </div>

          <h3>
            {averageDeliveryDays > 0
              ? `${averageDeliveryDays.toFixed(
                  1
                )} days`
              : "N/A"}
          </h3>

          <p className="positive">
            Calculated from delivery records
          </p>

          <div className="operations-kpi-details">
            <div>
              <span>
                FAST ≤3 DAYS
              </span>

              <strong>
                {fastDeliveryRate.toFixed(
                  1
                )}
                %
              </strong>
            </div>

            <div>
              <span>
                DELAYED &gt;4 DAYS
              </span>

              <strong>
                {delayedDeliveryRate.toFixed(
                  1
                )}
                %
              </strong>
            </div>
          </div>
        </div>

        <div
          className={`operations-kpi-card ${
            delayedDeliveryRate >
            20
              ? "warning"
              : "positive"
          }`}
        >
          <div className="operations-kpi-top">
            <span>
              DELAY RATE
            </span>

            <span className="operations-kpi-status">
              {operationalStatus}
            </span>
          </div>

          <h3>
            {deliveryRecords.length > 0
              ? `${delayedDeliveryRate.toFixed(
                  1
                )}%`
              : "N/A"}
          </h3>

          <p
            className={
              delayedDeliveryRate >
              20
                ? "warning"
                : "positive"
            }
          >
            Delivery records above four days
          </p>

          <div className="operations-kpi-details">
            <div>
              <span>
                DELAYED RECORDS
              </span>

              <strong>
                {formatNumber(
                  delayedDeliveryRecords.length
                )}
              </strong>
            </div>

            <div>
              <span>
                ANALYZED
              </span>

              <strong>
                {formatNumber(
                  deliveryRecords.length
                )}
              </strong>
            </div>
          </div>
        </div>

        <div
          className={`operations-kpi-card ${
            operationalScore >=
            80
              ? "positive"
              : "warning"
          }`}
        >
          <div className="operations-kpi-top">
            <span>
              DELIVERY HEALTH
            </span>

            <span className="operations-kpi-status">
              {operationalScore >=
              80
                ? "STABLE"
                : "REVIEW"}
            </span>
          </div>

          <h3>
            {deliveryRecords.length > 0
              ? `${operationalScore.toFixed(
                  0
                )}/100`
              : "N/A"}
          </h3>

          <p className="positive">
            Derived from delay rate
          </p>

          <div className="operations-kpi-details">
            <div>
              <span>
                FAST DELIVERY
              </span>

              <strong>
                {fastDeliveryRate.toFixed(
                  1
                )}
                %
              </strong>
            </div>

            <div>
              <span>
                STATUS
              </span>

              <strong>
                {operationalStatus}
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* =====================================================
          DELIVERY DISTRIBUTION
      ====================================================== */}

      <div className="operations-panel">

        <div className="panel-header">

          <div>

            <span>
              DELIVERY DISTRIBUTION
            </span>

            <h3>
              How quickly are orders being delivered?
            </h3>

          </div>

          <span className="panel-note">
            Based on uploaded delivery records
          </span>

        </div>

        <div className="delivery-distribution">

          {deliveryDistribution.map(
            (item) => {

              const percentage =
                deliveryRecords.length >
                0
                  ? (item.count /
                      deliveryRecords.length) *
                    100
                  : 0;

              return (
                <div
                  className="delivery-band"
                  key={item.label}
                >

                  <div className="delivery-band-header">

                    <span>
                      {item.label}
                    </span>

                    <strong>
                      {formatNumber(
                        item.count
                      )}
                    </strong>

                  </div>

                  <div className="delivery-band-bar">

                    <div
                      className="delivery-band-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    ></div>

                  </div>

                  <small>
                    {percentage.toFixed(
                      1
                    )}
                    % of delivery records
                  </small>

                </div>
              );
            }
          )}

        </div>

      </div>

      {/* =====================================================
          REGIONAL OPERATIONS
      ====================================================== */}

      <div className="operations-panel">

        <div className="panel-header">

          <div>

            <span>
              REGIONAL OPERATIONS
            </span>

            <h3>
              Order workload and delivery performance
            </h3>

          </div>

        </div>

        <div className="operations-table">

          <div className="operations-row operations-heading">

            <span>
              REGION
            </span>

            <span>
              ORDERS
            </span>

            <span>
              ORDER SHARE
            </span>

            <span>
              REVENUE
            </span>

            <span>
              AVG DELIVERY
            </span>

          </div>

          {filteredRegionalData.map(
            (region) => (

              <div
                className="operations-row"
                key={
                  region.region
                }
                style={{
                  gridTemplateColumns:
                    "1.5fr 1fr 1.2fr 1fr 1.2fr",
                  minWidth: "700px",
                }}
              >

                <span className="process-name">
                  {
                    region.region
                  }
                </span>

                <span>
                  {formatNumber(
                    region.orders
                  )}
                </span>

                <span>

                  <div className="mini-progress">

                    <div
                      className="mini-progress-fill"
                      style={{
                        width: `${Math.min(
                          region.orderShare,
                          100
                        )}%`,
                      }}
                    ></div>

                  </div>

                  <small>
                    {region.orderShare.toFixed(
                      1
                    )}
                    %
                  </small>

                </span>

                <span>
                  {formatCurrency(
                    region.revenue
                  )}
                </span>

                <span>
                  {region.averageDelivery >
                  0
                    ? `${region.averageDelivery.toFixed(
                        1
                      )} days`
                    : "N/A"}
                </span>

              </div>

            )
          )}

        </div>

      </div>

      {/* =====================================================
          OPERATIONAL INSIGHTS
      ====================================================== */}

      <div className="operations-capacity-grid">

        <div className="operations-panel">

          <div className="panel-header">

            <div>

              <span>
                OPERATIONAL ASSESSMENT
              </span>

              <h3>
                What does the data indicate?
              </h3>

            </div>

          </div>

          <div className="operations-insight-list">

            <div className="operations-insight">
              <span>
                FASTEST DELIVERY
              </span>

              <strong>
                {fastDeliveryRate.toFixed(
                  1
                )}
                %
              </strong>

              <p>
                of delivery records were completed
                within three days.
              </p>
            </div>

            <div className="operations-insight">
              <span>
                DELAY EXPOSURE
              </span>

              <strong>
                {delayedDeliveryRate.toFixed(
                  1
                )}
                %
              </strong>

              <p>
                of delivery records exceeded four
                days.
              </p>
            </div>

            <div className="operations-insight">
              <span>
                BUSIEST REGION
              </span>

              <strong>
                {busiestRegion
                  ? busiestRegion.region
                  : "N/A"}
              </strong>

              <p>
                carries the highest detected order
                volume.
              </p>
            </div>

          </div>

        </div>

        <div className="operations-panel">

          <div className="panel-header">

            <div>

              <span>
                DATA COVERAGE
              </span>

              <h3>
                Operational fields
              </h3>

            </div>

          </div>

          <div className="health-factors">

            <div>
              <span>
                Orders
              </span>

              <strong>
                {ordersColumn
                  ? "Detected ✓"
                  : "Missing"}
              </strong>
            </div>

            <div>
              <span>
                Delivery time
              </span>

              <strong>
                {deliveryColumn
                  ? "Detected ✓"
                  : "Missing"}
              </strong>
            </div>

            <div>
              <span>
                Region
              </span>

              <strong>
                {regionColumn
                  ? "Detected ✓"
                  : "Optional"}
              </strong>
            </div>

            <div>
              <span>
                Revenue
              </span>

              <strong>
                {revenueColumn
                  ? "Detected ✓"
                  : "Optional"}
              </strong>
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="operations-panel">

        <div className="panel-header">

          <div>

            <span>
              RECOMMENDED ACTIONS
            </span>

            <h3>
              Operational priorities
            </h3>

          </div>

        </div>

        <div className="operations-actions-grid">

          {actions.map(
            (action) => (

              <div
                className="operations-action"
                key={
                  action.title
                }
              >

                <div className="operations-action-top">

                  <span
                    className={`operations-priority ${action.priority.toLowerCase()}`}
                  >
                    {
                      action.priority
                    }
                  </span>

                  <span>
                    {
                      action.owner
                    }
                  </span>

                </div>

                <h4>
                  {
                    action.title
                  }
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
  );
}

export default Operations;