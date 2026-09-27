import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

function DataUpload({
  onDataLoaded,
  selectedDatasetId,
}) {
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columnTypes, setColumnTypes] = useState({});
  const [missingCount, setMissingCount] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [regionalMetrics, setRegionalMetrics] = useState([]);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [databaseStatus, setDatabaseStatus] = useState("idle");
  const [databaseMessage, setDatabaseMessage] = useState("");

  // =====================================================
  // HELPERS
  // =====================================================

  const normalizeColumnName = (name) =>
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const findColumn = (availableColumns, possibleNames) => {
    const normalizedColumns = availableColumns.map((column) => ({
      original: column,
      normalized: normalizeColumnName(column),
    }));

    for (const possibleName of possibleNames) {
      const normalizedTarget =
        normalizeColumnName(possibleName);

      const exactMatch = normalizedColumns.find(
        (column) =>
          column.normalized === normalizedTarget
      );

      if (exactMatch) {
        return exactMatch.original;
      }
    }

    for (const possibleName of possibleNames) {
      const normalizedTarget =
        normalizeColumnName(possibleName);

      const partialMatch = normalizedColumns.find(
        (column) =>
          column.normalized.includes(normalizedTarget)
      );

      if (partialMatch) {
        return partialMatch.original;
      }
    }

    return null;
  };

  const toNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    const cleaned = String(value)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();

    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 1,
    }).format(value || 0);
  };

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const isDateColumn = (columnName) => {
    const name = String(columnName).toLowerCase();

    return (
      name.includes("date") ||
      name.includes("timestamp") ||
      name.includes("datetime") ||
      name.includes("created_at") ||
      name.includes("updated_at")
    );
  };

  const excelSerialToDate = (serial) => {
    const excelEpoch =
      new Date(Date.UTC(1899, 11, 30));

    const milliseconds =
      serial * 24 * 60 * 60 * 1000;

    return new Date(
      excelEpoch.getTime() + milliseconds
    );
  };

  const formatDateValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    if (typeof value === "number") {
      const convertedDate =
        excelSerialToDate(value);

      return convertedDate
        .toISOString()
        .split("T")[0];
    }

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed
        .toISOString()
        .split("T")[0];
    }

    return String(value);
  };

  // =====================================================
  // COLUMN TYPE DETECTION
  // =====================================================

  const detectColumnType = (
    columnName,
    values
  ) => {
    if (isDateColumn(columnName)) {
      return "Date";
    }

    const nonEmptyValues = values.filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== ""
    );

    if (!nonEmptyValues.length) {
      return "Empty";
    }

    const numericValues =
      nonEmptyValues.filter((value) => {
        if (typeof value === "number") {
          return true;
        }

        const converted = Number(
          String(value).replace(/,/g, "").trim()
        );

        return (
          !Number.isNaN(converted) &&
          String(value).trim() !== ""
        );
      });

    if (
      numericValues.length ===
      nonEmptyValues.length
    ) {
      return "Numeric";
    }

    return "Text";
  };

  // =====================================================
  // MISSING VALUES
  // =====================================================

  const calculateMissingValues = (
    rows,
    detectedColumns
  ) => {
    let missing = 0;

    rows.forEach((row) => {
      detectedColumns.forEach((column) => {
        const value = row[column];

        if (
          value === null ||
          value === undefined ||
          String(value).trim() === ""
        ) {
          missing += 1;
        }
      });
    });

    return missing;
  };

  // =====================================================
  // KPI ENGINE
  // =====================================================

  const calculateBusinessMetrics = (
    rows,
    detectedColumns
  ) => {
    const revenueColumn = findColumn(
      detectedColumns,
      [
        "Revenue",
        "Sales",
        "Total Revenue",
        "Amount",
        "Sales Amount",
      ]
    );

    const costColumn = findColumn(
      detectedColumns,
      [
        "Cost",
        "COGS",
        "Total Cost",
        "Expense",
      ]
    );

    const ordersColumn = findColumn(
      detectedColumns,
      [
        "Orders",
        "Order Count",
        "Quantity",
        "Units",
      ]
    );

    const customerColumn = findColumn(
      detectedColumns,
      [
        "Customer",
        "Customer ID",
        "Customer_ID",
        "Client",
      ]
    );

    const productColumn = findColumn(
      detectedColumns,
      [
        "Product",
        "Product Name",
        "Product_Name",
        "Item",
      ]
    );

    const regionColumn = findColumn(
      detectedColumns,
      [
        "Region",
        "Area",
        "Territory",
        "Zone",
      ]
    );

    const deliveryColumn = findColumn(
      detectedColumns,
      [
        "Delivery_Days",
        "Delivery Days",
        "Delivery Time",
        "Processing Days",
      ]
    );

    const dateColumn = findColumn(
      detectedColumns,
      [
        "Date",
        "Order Date",
        "Order_Date",
        "Transaction Date",
        "Created Date",
      ]
    );

    // ---------------------------------------------------
    // BASIC CALCULATIONS
    // ---------------------------------------------------

    const totalRevenue = revenueColumn
      ? rows.reduce(
          (sum, row) =>
            sum +
            toNumber(
              row[revenueColumn]
            ),
          0
        )
      : 0;

    const totalCost = costColumn
      ? rows.reduce(
          (sum, row) =>
            sum +
            toNumber(row[costColumn]),
          0
        )
      : 0;

    const totalOrders = ordersColumn
      ? rows.reduce(
          (sum, row) =>
            sum +
            toNumber(row[ordersColumn]),
          0
        )
      : rows.length;

    const grossProfit =
      totalRevenue - totalCost;

    const grossMargin =
      totalRevenue > 0
        ? (grossProfit / totalRevenue) * 100
        : 0;

    const uniqueCustomers =
      customerColumn
        ? new Set(
            rows
              .map((row) =>
                String(
                  row[customerColumn]
                ).trim()
              )
              .filter(Boolean)
          ).size
        : 0;

    const uniqueProducts =
      productColumn
        ? new Set(
            rows
              .map((row) =>
                String(
                  row[productColumn]
                ).trim()
              )
              .filter(Boolean)
          ).size
        : 0;

    const uniqueRegions =
      regionColumn
        ? new Set(
            rows
              .map((row) =>
                String(
                  row[regionColumn]
                ).trim()
              )
              .filter(Boolean)
          ).size
        : 0;

    const averageOrderValue =
      totalOrders > 0
        ? totalRevenue / totalOrders
        : 0;

    const deliveryValues = deliveryColumn
      ? rows
          .map((row) =>
            toNumber(
              row[deliveryColumn]
            )
          )
          .filter((value) => value > 0)
      : [];

    const averageDeliveryDays =
      deliveryValues.length > 0
        ? deliveryValues.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / deliveryValues.length
        : 0;

    // ---------------------------------------------------
    // DATE RANGE
    // ---------------------------------------------------

    let earliestDate = null;
    let latestDate = null;

    if (dateColumn) {
      const dates = rows
        .map(
          (row) =>
            new Date(
              row[dateColumn]
            )
        )
        .filter(
          (date) =>
            !Number.isNaN(
              date.getTime()
            )
        )
        .sort(
          (a, b) =>
            a.getTime() -
            b.getTime()
        );

      if (dates.length > 0) {
        earliestDate =
          dates[0]
            .toISOString()
            .split("T")[0];

        latestDate =
          dates[dates.length - 1]
            .toISOString()
            .split("T")[0];
      }
    }

    return {
      revenueColumn,
      costColumn,
      ordersColumn,
      customerColumn,
      productColumn,
      regionColumn,
      deliveryColumn,
      dateColumn,

      totalRevenue,
      totalCost,
      grossProfit,
      grossMargin,
      totalOrders,
      uniqueCustomers,
      uniqueProducts,
      uniqueRegions,
      averageOrderValue,
      averageDeliveryDays,

      earliestDate,
      latestDate,
    };
  };

  // =====================================================
  // REGIONAL ANALYSIS
  // =====================================================

  const calculateRegionalMetrics = (
    rows,
    detectedColumns
  ) => {
    const regionColumn = findColumn(
      detectedColumns,
      [
        "Region",
        "Area",
        "Territory",
        "Zone",
      ]
    );

    const revenueColumn = findColumn(
      detectedColumns,
      [
        "Revenue",
        "Sales",
        "Total Revenue",
        "Amount",
      ]
    );

    const ordersColumn = findColumn(
      detectedColumns,
      [
        "Orders",
        "Order Count",
        "Quantity",
        "Units",
      ]
    );

    if (!regionColumn) {
      return [];
    }

    const regionMap = {};

    rows.forEach((row) => {
      const region = String(
        row[regionColumn]
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

      regionMap[region].revenue +=
        revenueColumn
          ? toNumber(
              row[revenueColumn]
            )
          : 0;

      regionMap[region].orders +=
        ordersColumn
          ? toNumber(
              row[ordersColumn]
            )
          : 1;
    });

    return Object.values(
      regionMap
    ).sort(
      (a, b) =>
        b.revenue - a.revenue
    );
  };

  // =====================================================
  // SAVE DATASET TO BACKEND
  // =====================================================

  const saveDatasetToDatabase = async (
    uploadedFileName,
    detectedColumns,
    cleanedData
  ) => {
    setDatabaseStatus("saving");
    setDatabaseMessage(
      "Saving dataset to NEXUS database..."
    );

    try {
      const response = await fetch(
        "http://localhost:5000/api/datasets/upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: uploadedFileName,
            columns: detectedColumns,
            rows: cleanedData,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Database upload failed."
        );
      }

      setDatabaseStatus("success");
      setDatabaseMessage(
        `Saved to database successfully. Dataset ID: ${result.dataset.id}`
      );

      return result.dataset;
    } catch (databaseError) {
      console.error(
        "Database upload error:",
        databaseError
      );

      setDatabaseStatus("error");
      setDatabaseMessage(
        "Dataset analyzed locally, but database save failed."
      );

      return null;
    }
  };
  // =====================================================
  // RESTORE LATEST DATASET FROM DATABASE
  // =====================================================

 const loadLatestDataset = async () => {
  try {
    const listResponse = await fetch(
      "http://localhost:5000/api/datasets"
    );

    const listResult = await listResponse.json();

    if (
      !listResponse.ok ||
      !listResult.success ||
      !listResult.datasets?.length
    ) {
      return;
    }

    const selectedDataset =
      selectedDatasetId
        ? listResult.datasets.find(
            (item) =>
              String(item.id) ===
              String(selectedDatasetId)
          )
        : listResult.datasets[0];

    if (!selectedDataset) {
      return;
    }

    const dataResponse = await fetch(
      `http://localhost:5000/api/datasets/${selectedDataset.id}`
    );

    const dataResult =
      await dataResponse.json();

    if (
      !dataResponse.ok ||
      !dataResult.success
    ) {
      return;
    }

    const restoredData =
      dataResult.rows;

    if (!restoredData.length) {
      return;
    }

    const restoredColumns =
      Object.keys(restoredData[0]);

    const restoredTypes = {};

    restoredColumns.forEach((column) => {
      restoredTypes[column] =
        detectColumnType(
          column,
          restoredData.map(
            (row) => row[column]
          )
        );
    });

    const restoredMissing =
      calculateMissingValues(
        restoredData,
        restoredColumns
      );

    const restoredMetrics =
      calculateBusinessMetrics(
        restoredData,
        restoredColumns
      );

    const restoredRegionalData =
      calculateRegionalMetrics(
        restoredData,
        restoredColumns
      );

    setFileName(
      dataResult.dataset.file_name
    );

    setData(restoredData);
    setColumns(restoredColumns);
    setColumnTypes(restoredTypes);
    setMissingCount(restoredMissing);
    setMetrics(restoredMetrics);
    setRegionalMetrics(
      restoredRegionalData
    );

    setDatabaseStatus("success");

    setDatabaseMessage(
      `Dataset restored from database. Dataset ID: ${selectedDataset.id}`
    );

    if (onDataLoaded) {
      onDataLoaded({
        fileName:
          dataResult.dataset.file_name,
        data: restoredData,
        columns: restoredColumns,
        columnTypes: restoredTypes,
        missingValues:
          restoredMissing,
        metrics:
          restoredMetrics,
        datasetId:
          selectedDataset.id,
      });
    }

  } catch (restoreError) {
    console.error(
      "Dataset restore error:",
      restoreError
    );
  }
};

  // =====================================================
  // AUTO RESTORE ON PAGE LOAD
  // =====================================================

  useEffect(() => {
    loadLatestDataset();
  }, []);
  // =====================================================
  // PROCESS FILE
  // =====================================================

  const processFile = (file) => {
    setError("");
    setDatabaseStatus("idle");
    setDatabaseMessage("");

    if (!file) {
      return;
    }

    const extension = file.name
      .split(".")
      .pop()
      .toLowerCase();

    const allowedExtensions = [
      "csv",
      "xlsx",
      "xls",
    ];

    if (
      !allowedExtensions.includes(
        extension
      )
    ) {
      setError(
        "Please upload a CSV, XLSX or XLS file."
      );

      return;
    }

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(
          event.target.result,
          {
            type: "array",
            cellDates: false,
          }
        );

        const firstSheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];

        const rawData =
          XLSX.utils.sheet_to_json(
            firstSheet,
            {
              defval: "",
            }
          );

        if (!rawData.length) {
          setError(
            "The uploaded file is empty."
          );

          setData([]);
          setColumns([]);
          setMetrics(null);

          return;
        }

        const detectedColumns =
          Object.keys(rawData[0]);

        // ------------------------------------------------
        // CLEAN DATA
        // ------------------------------------------------

        const cleanedData =
          rawData.map((row) => {
            const cleanedRow = {};

            detectedColumns.forEach(
              (column) => {
                const originalValue =
                  row[column];

                if (
                  isDateColumn(column)
                ) {
                  cleanedRow[column] =
                    formatDateValue(
                      originalValue
                    );
                } else {
                  cleanedRow[column] =
                    originalValue;
                }
              }
            );

            return cleanedRow;
          });

        // ------------------------------------------------
        // TYPES
        // ------------------------------------------------

        const detectedTypes = {};

        detectedColumns.forEach(
          (column) => {
            detectedTypes[column] =
              detectColumnType(
                column,
                cleanedData.map(
                  (row) =>
                    row[column]
                )
              );
          }
        );

        // ------------------------------------------------
        // QUALITY
        // ------------------------------------------------

        const missingValues =
          calculateMissingValues(
            cleanedData,
            detectedColumns
          );

        // ------------------------------------------------
        // KPI ENGINE
        // ------------------------------------------------

        const calculatedMetrics =
          calculateBusinessMetrics(
            cleanedData,
            detectedColumns
          );

        // ------------------------------------------------
        // REGIONAL ANALYSIS
        // ------------------------------------------------

        const regionalData =
          calculateRegionalMetrics(
            cleanedData,
            detectedColumns
          );

        // ------------------------------------------------
        // UPDATE LOCAL STATE
        // ------------------------------------------------

        setData(cleanedData);
        setColumns(detectedColumns);
        setColumnTypes(
          detectedTypes
        );
        setMissingCount(
          missingValues
        );
        setMetrics(
          calculatedMetrics
        );
        setRegionalMetrics(
          regionalData
        );

        // ------------------------------------------------
        // SEND TO PARENT
        // ------------------------------------------------

        let savedDataset = null;

        if (onDataLoaded) {
          onDataLoaded({
            fileName: file.name,
            data: cleanedData,
            columns: detectedColumns,
            columnTypes: detectedTypes,
            missingValues,
            metrics:
              calculatedMetrics,
            datasetId: null,
          });
        }

        // ------------------------------------------------
        // SAVE TO BACKEND / SUPABASE
        // ------------------------------------------------

        savedDataset =
          await saveDatasetToDatabase(
            file.name,
            detectedColumns,
            cleanedData
          );

        // ------------------------------------------------
        // UPDATE PARENT WITH DATABASE ID
        // ------------------------------------------------

        if (
          savedDataset &&
          onDataLoaded
        ) {
          onDataLoaded({
            fileName: file.name,
            data: cleanedData,
            columns: detectedColumns,
            columnTypes: detectedTypes,
            missingValues,
            metrics:
              calculatedMetrics,
            datasetId:
              savedDataset.id,
          });
        }
      } catch (fileError) {
        console.error(
          "File processing error:",
          fileError
        );

        setError(
          "Unable to read this file. Please check the file format."
        );

        setData([]);
        setColumns([]);
        setMetrics(null);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // =====================================================
  // INPUT
  // =====================================================

  const handleFileInput = (event) => {
    const file =
      event.target.files?.[0];

    processFile(file);
  };

  // =====================================================
  // DROP
  // =====================================================

  const handleDrop = (event) => {
    event.preventDefault();

    setDragActive(false);

    const file =
      event.dataTransfer.files?.[0];

    processFile(file);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <section
      className="data-upload-page"
      id="data-upload"
    >
      <div className="data-upload-header">
        <p className="tagline">
          DATA INPUT
        </p>

        <h1>
          Bring your business data.
        </h1>

        <p className="data-upload-description">
          Upload your CSV or Excel data
          and NEXUS will analyze it,
          calculate business KPIs and
          prepare it for decision-making.
        </p>
      </div>

      {/* =================================================
          UPLOAD
      ================================================== */}

      <div
        className={`upload-zone ${
          dragActive
            ? "drag-active"
            : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() =>
          setDragActive(false)
        }
        onDrop={handleDrop}
      >
        <div className="upload-icon">
          ↑
        </div>

        <h2>
          Upload your business data
        </h2>

        <p>
          Drag and drop your file here
          <br />
          or choose a file from your computer
        </p>

        <label className="upload-button">
          Choose File

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={
              handleFileInput
            }
            hidden
          />
        </label>

        <small>
          Supported formats: CSV, XLSX, XLS
        </small>
      </div>

      {/* =================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {/* =================================================
          DATABASE STATUS
      ================================================== */}

      {databaseStatus === "saving" && (
        <div className="upload-info">
          <strong>⏳ Saving dataset...</strong>
          <p>
            {databaseMessage}
          </p>
        </div>
      )}

      {databaseStatus === "success" && (
        <div className="upload-success">
          <strong>
            ✓ Dataset saved successfully
          </strong>
          <p>
            {databaseMessage}
          </p>
        </div>
      )}

      {databaseStatus === "error" && (
        <div className="upload-warning">
          <strong>
            ⚠ Database save failed
          </strong>
          <p>
            {databaseMessage}
          </p>
        </div>
      )}

      {/* =================================================
          DATA
      ================================================== */}

      {data.length > 0 && (
        <div className="dataset-summary">
          <div className="dataset-summary-top">
            <div>
              <span>
                DATASET READY
              </span>

              <h2>
                {fileName}
              </h2>
            </div>

            <div className="dataset-ready-badge">
              ✓ Analyzed
            </div>
          </div>

          {/* BASIC STATS */}

          <div className="dataset-stats">
            <div>
              <span>ROWS</span>

              <strong>
                {data.length.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>COLUMNS</span>

              <strong>
                {columns.length}
              </strong>
            </div>

            <div>
              <span>
                MISSING VALUES
              </span>

              <strong
                className={
                  missingCount === 0
                    ? "data-good"
                    : "data-warning"
                }
              >
                {missingCount}
              </strong>
            </div>

            <div>
              <span>STATUS</span>

              <strong>
                {missingCount === 0
                  ? "CLEAN"
                  : "REVIEW"}
              </strong>
            </div>
          </div>

          {/* =================================================
              BUSINESS KPIs
          ================================================== */}

          {metrics && (
            <div className="uploaded-kpi-section">
              <div className="panel-header">
                <div>
                  <span>
                    CALCULATED FROM YOUR DATA
                  </span>

                  <h3>
                    Business performance snapshot
                  </h3>
                </div>

                <small>
                  NEXUS KPI ENGINE
                </small>
              </div>

              <div className="uploaded-kpi-grid">
                <div className="uploaded-kpi-card">
                  <span>
                    TOTAL REVENUE
                  </span>

                  <strong>
                    {formatCurrency(
                      metrics.totalRevenue
                    )}
                  </strong>

                  <p>
                    Sum of detected revenue values
                  </p>
                </div>

                <div className="uploaded-kpi-card">
                  <span>
                    GROSS MARGIN
                  </span>

                  <strong>
                    {metrics.grossMargin.toFixed(
                      1
                    )}
                    %
                  </strong>

                  <p>
                    Based on revenue minus cost
                  </p>
                </div>

                <div className="uploaded-kpi-card">
                  <span>
                    TOTAL ORDERS
                  </span>

                  <strong>
                    {formatNumber(
                      metrics.totalOrders
                    )}
                  </strong>

                  <p>
                    Sum of detected order values
                  </p>
                </div>

                <div className="uploaded-kpi-card">
                  <span>
                    CUSTOMERS
                  </span>

                  <strong>
                    {formatNumber(
                      metrics.uniqueCustomers
                    )}
                  </strong>

                  <p>
                    Unique customer records
                  </p>
                </div>

                <div className="uploaded-kpi-card">
                  <span>
                    AVERAGE ORDER VALUE
                  </span>

                  <strong>
                    {formatCurrency(
                      metrics.averageOrderValue
                    )}
                  </strong>

                  <p>
                    Revenue divided by orders
                  </p>
                </div>

                <div className="uploaded-kpi-card">
                  <span>
                    AVG DELIVERY TIME
                  </span>

                  <strong>
                    {metrics.averageDeliveryDays.toFixed(
                      1
                    )}
                    days
                  </strong>

                  <p>
                    Average detected delivery time
                  </p>
                </div>

                <div className="uploaded-kpi-card">
                  <span>
                    PRODUCTS
                  </span>

                  <strong>
                    {metrics.uniqueProducts}
                  </strong>

                  <p>
                    Unique products detected
                  </p>
                </div>

                <div className="uploaded-kpi-card">
                  <span>
                    REGIONS
                  </span>

                  <strong>
                    {metrics.uniqueRegions}
                  </strong>

                  <p>
                    Unique regions detected
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              COLUMN DETECTION
          ================================================== */}

          <div className="column-detection">
            <div className="panel-header">
              <div>
                <span>
                  DETECTED FIELDS
                </span>

                <h3>
                  What did NEXUS identify?
                </h3>
              </div>
            </div>

            <div className="column-detection-grid">
              {columns.map(
                (column) => (
                  <div
                    className="column-detection-card"
                    key={column}
                  >
                    <strong>
                      {column}
                    </strong>

                    <span>
                      {columnTypes[column]}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* =================================================
              REGIONAL ANALYSIS
          ================================================== */}

          {regionalMetrics.length > 0 && (
            <div className="uploaded-regional-panel">
              <div className="panel-header">
                <div>
                  <span>
                    REGIONAL ANALYSIS
                  </span>

                  <h3>
                    Revenue by region
                  </h3>
                </div>
              </div>

              <div className="uploaded-regional-table">
                <div className="uploaded-regional-row uploaded-heading">
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

                {regionalMetrics.map(
                  (item) => (
                    <div
                      className="uploaded-regional-row"
                      key={item.region}
                    >
                      <strong>
                        {item.region}
                      </strong>

                      <span>
                        {formatCurrency(
                          item.revenue
                        )}
                      </span>

                      <span>
                        {formatNumber(
                          item.orders
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* =================================================
              DATA PREVIEW
          ================================================== */}

          <div className="data-preview">
            <div className="panel-header">
              <div>
                <span>
                  DATA PREVIEW
                </span>

                <h3>
                  First 5 records
                </h3>
              </div>
            </div>

            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    {columns.map(
                      (column) => (
                        <th key={column}>
                          {column}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {data
                    .slice(0, 5)
                    .map(
                      (
                        row,
                        index
                      ) => (
                        <tr key={index}>
                          {columns.map(
                            (column) => (
                              <td
                                key={column}
                              >
                                {String(
                                  row[column] ??
                                    ""
                                )}
                              </td>
                            )
                          )}
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================
              DATA QUALITY
          ================================================== */}

          <div className="data-quality-panel">
            <div className="panel-header">
              <div>
                <span>
                  DATA QUALITY
                </span>

                <h3>
                  Dataset readiness
                </h3>
              </div>

              <strong
                className={
                  missingCount === 0
                    ? "quality-good"
                    : "quality-warning"
                }
              >
                {missingCount === 0
                  ? "100%"
                  : "REVIEW"}
              </strong>
            </div>

            <div className="quality-checks">
              <div>
                <span>
                  File readable
                </span>

                <strong>
                  ✓
                </strong>
              </div>

              <div>
                <span>
                  Columns detected
                </span>

                <strong>
                  ✓
                </strong>
              </div>

              <div>
                <span>
                  Date fields detected
                </span>

                <strong>
                  {Object.values(
                    columnTypes
                  ).includes("Date")
                    ? "✓"
                    : "—"}
                </strong>
              </div>

              <div>
                <span>
                  Missing values
                </span>

                <strong>
                  {missingCount === 0
                    ? "✓"
                    : "!"}
                </strong>
              </div>

              <div>
                <span>
                  Database status
                </span>

                <strong>
                  {databaseStatus === "success"
                    ? "✓"
                    : databaseStatus === "saving"
                    ? "..."
                    : databaseStatus === "error"
                    ? "!"
                    : "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* =================================================
              NEXT
          ================================================== */}

          <div className="data-next-step">
            <div>
              <span>
                NEXT STAGE
              </span>

              <h3>
                Business analysis engine
              </h3>

              <p>
                NEXUS has now read your data,
                calculated core business metrics
                and saved the dataset to the
                NEXUS database when the backend
                is available.
              </p>
            </div>

            <button
              onClick={() =>
                window.alert(
                  "KPI engine and database processing completed successfully."
                )
              }
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default DataUpload;