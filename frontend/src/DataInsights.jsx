import { useMemo } from "react";

function DataInsights({ dataset }) {
  // =========================================================
  // HELPERS
  // =========================================================

  const toNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number = Number(
      String(value)
        .replace(/₹/g, "")
        .replace(/,/g, "")
        .replace(/%/g, "")
        .trim()
    );

    return Number.isFinite(number)
      ? number
      : null;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 1,
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

  const normalizeText = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  // =========================================================
  // BASIC DATA
  // =========================================================

  const rows = dataset?.data || [];
  const columns = dataset?.columns || [];
  const columnTypes = dataset?.columnTypes || {};
  const metrics = dataset?.metrics || {};

  // =========================================================
  // FIELD ANALYSIS
  // =========================================================

  const numericColumns = useMemo(() => {
    return columns.filter(
      (column) =>
        columnTypes[column] === "Numeric"
    );
  }, [columns, columnTypes]);

  const dateColumns = useMemo(() => {
    return columns.filter(
      (column) =>
        columnTypes[column] === "Date"
    );
  }, [columns, columnTypes]);

  const textColumns = useMemo(() => {
    return columns.filter(
      (column) =>
        columnTypes[column] === "Text"
    );
  }, [columns, columnTypes]);

  // =========================================================
  // NUMERIC FIELD SUMMARY
  // =========================================================

  const numericSummary = useMemo(() => {
    return numericColumns
      .map((column) => {
        const values = rows
          .map((row) =>
            toNumber(row[column])
          )
          .filter(
            (value) =>
              value !== null
          );

        if (!values.length) {
          return {
            column,
            count: 0,
            total: 0,
            average: 0,
            minimum: 0,
            maximum: 0,
          };
        }

        const total = values.reduce(
          (sum, value) =>
            sum + value,
          0
        );

        const average =
          total / values.length;

        return {
          column,
          count: values.length,
          total,
          average,
          minimum: Math.min(
            ...values
          ),
          maximum: Math.max(
            ...values
          ),
        };
      })
      .sort(
        (a, b) =>
          b.total - a.total
      );
  }, [rows, numericColumns]);

  // =========================================================
  // CATEGORICAL ANALYSIS
  // =========================================================

  const categoricalAnalysis = useMemo(() => {
    return textColumns
      .map((column) => {
        const frequency = {};

        rows.forEach((row) => {
          const value = String(
            row[column] ?? ""
          ).trim();

          if (!value) {
            return;
          }

          if (!frequency[value]) {
            frequency[value] = 0;
          }

          frequency[value]++;
        });

        const values = Object.entries(
          frequency
        )
          .sort(
            (a, b) =>
              b[1] - a[1]
          )
          .slice(0, 5)
          .map(
            ([name, count]) => ({
              name,
              count,
            })
          );

        return {
          column,
          uniqueCount:
            Object.keys(
              frequency
            ).length,
          values,
        };
      })
      .filter(
        (item) =>
          item.uniqueCount > 0
      );
  }, [rows, textColumns]);

  // =========================================================
  // MISSING VALUES
  // =========================================================

  const missingByColumn = useMemo(() => {
    return columns
      .map((column) => {
        const missing = rows.filter(
          (row) => {
            const value =
              row[column];

            return (
              value === null ||
              value === undefined ||
              String(
                value
              ).trim() === ""
            );
          }
        ).length;

        return {
          column,
          missing,
          percentage:
            rows.length > 0
              ? (missing /
                  rows.length) *
                100
              : 0,
        };
      })
      .sort(
        (a, b) =>
          b.missing - a.missing
      );
  }, [rows, columns]);

  const totalMissing =
    missingByColumn.reduce(
      (sum, item) =>
        sum + item.missing,
      0
    );

  // =========================================================
  // GENERAL DATA QUALITY
  // =========================================================

  const completeness =
    rows.length > 0 &&
    columns.length > 0
      ? Math.max(
          0,
          100 -
            (totalMissing /
              (rows.length *
                columns.length)) *
              100
        )
      : 0;

  // =========================================================
  // IDENTIFY IMPORTANT NUMERIC FIELDS
  // =========================================================

  const highestValueField =
    numericSummary.length > 0
      ? numericSummary[0]
      : null;

  const highestAverageField =
    numericSummary.length > 0
      ? [...numericSummary].sort(
          (a, b) =>
            b.average -
            a.average
        )[0]
      : null;

  const largestRangeField =
    numericSummary.length > 0
      ? [...numericSummary].sort(
          (a, b) =>
            b.maximum -
            b.minimum -
            (a.maximum -
              a.minimum)
        )[0]
      : null;

  // =========================================================
  // GENERIC AUTOMATED INSIGHTS
  // =========================================================

  const insights = [];

  if (rows.length > 0) {
    insights.push({
      type: "DATASET",
      title: "Dataset successfully analyzed",
      value: formatNumber(
        rows.length
      ),
      description:
        `NEXUS analyzed ${formatNumber(
          rows.length
        )} records across ${formatNumber(
          columns.length
        )} detected fields.`,
      level: "positive",
    });
  }

  if (numericSummary.length > 0) {
    insights.push({
      type: "NUMERIC",
      title: `${numericSummary.length} measurable fields detected`,
      value: formatNumber(
        numericSummary.length
      ),
      description:
        "These fields can be used for totals, averages, comparisons and performance analysis.",
      level: "positive",
    });
  }

  if (highestValueField) {
    insights.push({
      type: "SCALE",
      title: `${highestValueField.column} has the largest total`,
      value:
        highestValueField.total >
        100000
          ? formatCurrency(
              highestValueField.total
            )
          : formatNumber(
              highestValueField.total
            ),
      description:
        `The total of ${highestValueField.column} is the largest among the detected numeric fields.`,
      level: "positive",
    });
  }

  if (
    totalMissing === 0 &&
    rows.length > 0
  ) {
    insights.push({
      type: "QUALITY",
      title: "No missing values detected",
      value: "100%",
      description:
        "Every detected field contains a value across the uploaded records.",
      level: "positive",
    });
  } else if (
    totalMissing > 0
  ) {
    const worstField =
      missingByColumn[0];

    insights.push({
      type: "QUALITY",
      title:
        worstField
          ? `${worstField.column} needs review`
          : "Missing data needs review",
      value:
        worstField
          ? `${worstField.percentage.toFixed(
              1
            )}%`
          : "REVIEW",
      description:
        worstField
          ? `${formatNumber(
              worstField.missing
            )} records are missing a value in ${worstField.column}.`
          : "Some values are missing from the dataset.",
      level: "warning",
    });
  }

  if (
    dateColumns.length > 0
  ) {
    insights.push({
      type: "TIME",
      title: "Time-based analysis available",
      value: formatNumber(
        dateColumns.length
      ),
      description:
        "Date fields were detected, enabling trend and period-based analysis.",
      level: "positive",
    });
  }

  if (
    textColumns.length > 0
  ) {
    const largestCategory =
      [...categoricalAnalysis].sort(
        (a, b) =>
          b.uniqueCount -
          a.uniqueCount
      )[0];

    insights.push({
      type: "CATEGORY",
      title: largestCategory
        ? `${largestCategory.column} contains category data`
        : "Categorical fields detected",
      value:
        largestCategory
          ? formatNumber(
              largestCategory.uniqueCount
            )
          : formatNumber(
              textColumns.length
            ),
      description:
        largestCategory
          ? `${largestCategory.uniqueCount} unique values were identified in ${largestCategory.column}.`
          : "Categorical fields can be used for segmentation and comparisons.",
      level: "neutral",
    });
  }

  // =========================================================
  // IMPORTANT BUSINESS FIELD COVERAGE
  // =========================================================

  const businessFields = [
    {
      name: "Revenue",
      detected:
        Boolean(
          metrics.revenueColumn
        ),
    },
    {
      name: "Cost",
      detected:
        Boolean(
          metrics.costColumn
        ),
    },
    {
      name: "Orders",
      detected:
        Boolean(
          metrics.ordersColumn
        ),
    },
    {
      name: "Customer",
      detected:
        Boolean(
          metrics.customerColumn
        ),
    },
    {
      name: "Product",
      detected:
        Boolean(
          metrics.productColumn
        ),
    },
    {
      name: "Region",
      detected:
        Boolean(
          metrics.regionColumn
        ),
    },
    {
      name: "Date",
      detected:
        Boolean(
          metrics.dateColumn
        ),
    },
    {
      name: "Delivery",
      detected:
        Boolean(
          metrics.deliveryColumn
        ),
    },
  ];

  const detectedBusinessFields =
    businessFields.filter(
      (field) =>
        field.detected
    ).length;

  // =========================================================
  // NO DATA STATE
  // =========================================================

  if (!dataset) {
    return (
      <section
        className="dashboard-section data-insights-section"
        id="data-insights"
      >
        <div className="section-title">
          <div>
            <p className="tagline">
              DATA & INSIGHTS
            </p>

            <h2>
              Understand your data
            </h2>

            <p className="section-description">
              Upload a business dataset to activate
              general-purpose data analysis.
            </p>
          </div>
        </div>

        <div className="insights-empty-state">
          <span>
            NO DATASET
          </span>

          <h3>
            Data insights are waiting for your file.
          </h3>

          <p>
            NEXUS will profile your dataset, identify
            important fields, summarize numeric values
            and surface useful observations.
          </p>
        </div>
      </section>
    );
  }

  // =========================================================
  // MAIN VIEW
  // =========================================================

  return (
    <section
      className="dashboard-section data-insights-section"
      id="data-insights"
    >
      {/* HEADER */}

      <div className="section-title">
        <div>
          <p className="tagline">
            DATA & INSIGHTS
          </p>

          <h2>
            Understand your data
          </h2>

          <p className="section-description">
            A general analytical view generated from
            the uploaded dataset.
          </p>
        </div>

        <div className="insights-source">
          <span>
            SOURCE
          </span>

          <strong>
            {dataset.fileName}
          </strong>
        </div>
      </div>

      {/* =====================================================
          DATASET OVERVIEW
      ====================================================== */}

      <div className="insights-overview-grid">

        <div className="insights-overview-card">
          <span>
            RECORDS
          </span>

          <strong>
            {formatNumber(
              rows.length
            )}
          </strong>

          <p>
            Rows analyzed
          </p>
        </div>

        <div className="insights-overview-card">
          <span>
            FIELDS
          </span>

          <strong>
            {formatNumber(
              columns.length
            )}
          </strong>

          <p>
            Columns detected
          </p>
        </div>

        <div className="insights-overview-card">
          <span>
            COMPLETENESS
          </span>

          <strong>
            {completeness.toFixed(
              1
            )}
            %
          </strong>

          <p>
            Data completeness
          </p>
        </div>

        <div className="insights-overview-card">
          <span>
            BUSINESS COVERAGE
          </span>

          <strong>
            {detectedBusinessFields}/8
          </strong>

          <p>
            Important business fields
          </p>
        </div>

      </div>

      {/* =====================================================
          AUTOMATED OBSERVATIONS
      ====================================================== */}

      <div className="insights-panel">

        <div className="panel-header">

          <div>
            <span>
              AUTOMATED OBSERVATIONS
            </span>

            <h3>
              What stands out in the dataset?
            </h3>
          </div>

          <small>
            {insights.length} observations
          </small>

        </div>

        <div className="insights-observation-grid">

          {insights.map(
            (insight) => (

              <div
                className={`insight-observation ${insight.level}`}
                key={
                  insight.title
                }
              >

                <span>
                  {insight.type}
                </span>

                <h4>
                  {insight.title}
                </h4>

                <strong>
                  {insight.value}
                </strong>

                <p>
                  {
                    insight.description
                  }
                </p>

              </div>

            )
          )}

        </div>

      </div>

      {/* =====================================================
          NUMERIC ANALYSIS
      ====================================================== */}

      <div className="insights-panel">

        <div className="panel-header">

          <div>
            <span>
              NUMERIC ANALYSIS
            </span>

            <h3>
              Measurable fields
            </h3>
          </div>

          <small>
            {
              numericColumns.length
            }{" "}
            numeric fields
          </small>

        </div>

        {numericSummary.length ===
        0 ? (
          <div className="insights-sub-empty">
            No numeric fields were detected in
            this dataset.
          </div>
        ) : (
          <div className="numeric-analysis-table">

            <div className="numeric-row numeric-heading">

              <span>
                FIELD
              </span>

              <span>
                RECORDS
              </span>

              <span>
                TOTAL
              </span>

              <span>
                AVERAGE
              </span>

              <span>
                MIN
              </span>

              <span>
                MAX
              </span>

            </div>

            {numericSummary.map(
              (item) => (

                <div
                  className="numeric-row"
                  key={
                    item.column
                  }
                >

                  <strong>
                    {
                      item.column
                    }
                  </strong>

                  <span>
                    {
                      formatNumber(
                        item.count
                      )
                    }
                  </span>

                  <span>
                    {
                      item.total >
                      100000
                        ? formatCurrency(
                            item.total
                          )
                        : formatNumber(
                            item.total
                          )
                    }
                  </span>

                  <span>
                    {
                      item.average >
                      100000
                        ? formatCurrency(
                            item.average
                          )
                        : formatNumber(
                            item.average
                          )
                    }
                  </span>

                  <span>
                    {
                      item.minimum >
                      100000
                        ? formatCurrency(
                            item.minimum
                          )
                        : formatNumber(
                            item.minimum
                          )
                    }
                  </span>

                  <span>
                    {
                      item.maximum >
                      100000
                        ? formatCurrency(
                            item.maximum
                          )
                        : formatNumber(
                            item.maximum
                          )
                    }
                  </span>

                </div>

              )
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          CATEGORY ANALYSIS
      ====================================================== */}

      <div className="insights-category-grid">

        {categoricalAnalysis
          .slice(0, 4)
          .map((category) => (

            <div
              className="insights-panel category-panel"
              key={
                category.column
              }
            >

              <div className="panel-header">

                <div>

                  <span>
                    CATEGORY
                  </span>

                  <h3>
                    {
                      category.column
                    }
                  </h3>

                </div>

                <small>
                  {
                    formatNumber(
                      category.uniqueCount
                    )
                  }{" "}
                  unique
                </small>

              </div>

              <div className="category-list">

                {category.values.map(
                  (item, index) => (

                    <div
                      className="category-item"
                      key={
                        item.name
                      }
                    >

                      <div className="category-rank">

                        <span>
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <strong>
                          {
                            item.name
                          }
                        </strong>

                      </div>

                      <span>
                        {
                          formatNumber(
                            item.count
                          )
                        }
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

          ))}

      </div>

      {/* =====================================================
          DATA QUALITY
      ====================================================== */}

      <div className="insights-panel">

        <div className="panel-header">

          <div>

            <span>
              DATA QUALITY
            </span>

            <h3>
              Fields requiring attention
            </h3>

          </div>

          <strong
            className={
              completeness >= 98
                ? "quality-good"
                : completeness >= 90
                ? "quality-warning"
                : "quality-bad"
            }
          >
            {completeness.toFixed(
              1
            )}
            %
          </strong>

        </div>

        <div className="quality-field-list">

          {missingByColumn
            .slice(0, 6)
            .map((item) => (

              <div
                className="quality-field"
                key={
                  item.column
                }
              >

                <div>

                  <span>
                    {
                      item.column
                    }
                  </span>

                  <small>
                    {
                      item.missing ===
                      0
                        ? "Complete"
                        : `${formatNumber(
                            item.missing
                          )} missing`
                    }
                  </small>

                </div>

                <div className="quality-bar">

                  <div
                    className="quality-fill"
                    style={{
                      width: `${Math.max(
                        0,
                        100 -
                          item.percentage
                      )}%`,
                    }}
                  ></div>

                </div>

                <strong>
                  {
                    item.missing ===
                    0
                      ? "100%"
                      : `${(
                          100 -
                          item.percentage
                        ).toFixed(
                          1
                        )}%`
                  }
                </strong>

              </div>

            ))}

        </div>

      </div>

      {/* =====================================================
          DATA-DRIVEN OPPORTUNITIES
      ====================================================== */}

      <div className="insights-panel">

        <div className="panel-header">

          <div>

            <span>
              NEXT ANALYSIS OPPORTUNITIES
            </span>

            <h3>
              What NEXUS can analyze next
            </h3>

          </div>

        </div>

        <div className="analysis-opportunity-grid">

          <div>
            <span>
              TIME TRENDS
            </span>

            <strong>
              {dateColumns.length >
              0
                ? "Available ✓"
                : "Needs date field"}
            </strong>

            <p>
              Compare performance across days,
              weeks or months.
            </p>
          </div>

          <div>
            <span>
              SEGMENTATION
            </span>

            <strong>
              {textColumns.length >
              0
                ? `${textColumns.length} fields`
                : "Needs category fields"}
            </strong>

            <p>
              Compare products, regions,
              customers or other categories.
            </p>
          </div>

          <div>
            <span>
              NUMERIC COMPARISON
            </span>

            <strong>
              {numericColumns.length}
            </strong>

            <p>
              Measure relationships between
              business metrics.
            </p>
          </div>

          <div>
            <span>
              BUSINESS METRICS
            </span>

            <strong>
              {detectedBusinessFields}/8
            </strong>

            <p>
              Core fields available for
              deeper business analysis.
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}

export default DataInsights;