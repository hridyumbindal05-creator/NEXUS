import { useMemo, useState } from "react";

function ProductManagement({ dataset }) {
  const [selectedProduct, setSelectedProduct] =
    useState("All Products");

  const [sortBy, setSortBy] =
    useState("revenue");

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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(value);
  };

  // =========================================================
  // DETECT PRODUCT DATA
  // =========================================================

  const productColumn =
    dataset?.metrics?.productColumn || null;

  const revenueColumn =
    dataset?.metrics?.revenueColumn || null;

  const ordersColumn =
    dataset?.metrics?.ordersColumn || null;

  const customerColumn =
    dataset?.metrics?.customerColumn || null;

  // =========================================================
  // BUILD PRODUCT METRICS
  // =========================================================

  const products = useMemo(() => {
    if (
      !dataset?.data ||
      !productColumn
    ) {
      return [];
    }

    const productMap = {};

    dataset.data.forEach((row) => {
      const product = String(
        row[productColumn] ?? ""
      ).trim();

      if (!product) {
        return;
      }

      if (!productMap[product]) {
        productMap[product] = {
          name: product,
          revenue: 0,
          orders: 0,
          customers: new Set(),
        };
      }

      if (revenueColumn) {
        productMap[product].revenue +=
          toNumber(
            row[revenueColumn]
          );
      }

      if (ordersColumn) {
        productMap[product].orders +=
          toNumber(
            row[ordersColumn]
          );
      } else {
        productMap[product].orders += 1;
      }

      if (customerColumn) {
        const customer = String(
          row[customerColumn] ?? ""
        ).trim();

        if (customer) {
          productMap[
            product
          ].customers.add(customer);
        }
      }
    });

    const totalRevenue =
      Object.values(productMap).reduce(
        (sum, product) =>
          sum + product.revenue,
        0
      );

    return Object.values(productMap)
      .map((product) => ({
        ...product,

        customers:
          product.customers.size,

        revenueShare:
          totalRevenue > 0
            ? (product.revenue /
                totalRevenue) *
              100
            : 0,

        averageOrderValue:
          product.orders > 0
            ? product.revenue /
              product.orders
            : 0,
      }))
      .sort((a, b) => {
        if (sortBy === "orders") {
          return b.orders - a.orders;
        }

        if (sortBy === "customers") {
          return (
            b.customers -
            a.customers
          );
        }

        return (
          b.revenue - a.revenue
        );
      });
  }, [
    dataset,
    productColumn,
    revenueColumn,
    ordersColumn,
    customerColumn,
    sortBy,
  ]);

  // =========================================================
  // SELECTED PRODUCTS
  // =========================================================

  const filteredProducts =
    selectedProduct === "All Products"
      ? products
      : products.filter(
          (product) =>
            product.name ===
            selectedProduct
        );

  // =========================================================
  // PRODUCT INSIGHTS
  // =========================================================

  const topRevenueProduct =
    products.length > 0
      ? [...products].sort(
          (a, b) =>
            b.revenue - a.revenue
        )[0]
      : null;

  const topOrdersProduct =
    products.length > 0
      ? [...products].sort(
          (a, b) =>
            b.orders - a.orders
        )[0]
      : null;

  const lowestRevenueProduct =
    products.length > 0
      ? [...products].sort(
          (a, b) =>
            a.revenue - b.revenue
        )[0]
      : null;

  const totalProductRevenue =
    products.reduce(
      (sum, product) =>
        sum + product.revenue,
      0
    );

  const totalProductOrders =
    products.reduce(
      (sum, product) =>
        sum + product.orders,
      0
    );

  // =========================================================
  // PRODUCT DATA NOT AVAILABLE
  // =========================================================

  if (!dataset) {
    return (
      <section
        className="dashboard-section product-section"
        id="products"
      >
        <div className="section-title">
          <div>
            <p className="tagline">
              PRODUCT MANAGEMENT
            </p>

            <h2>
              Product intelligence
            </h2>

            <p className="section-description">
              Upload a business dataset to
              generate product-level analysis.
            </p>
          </div>
        </div>

        <div className="product-panel">
          <div className="product-empty-state">
            <span>
              NO USER DATA
            </span>

            <h3>
              Product analysis is waiting
              for a dataset.
            </h3>

            <p>
              Upload data containing Product,
              Revenue and preferably Orders
              and Customer fields to activate
              this section.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!productColumn) {
    return (
      <section
        className="dashboard-section product-section"
        id="products"
      >
        <div className="section-title">
          <div>
            <p className="tagline">
              PRODUCT MANAGEMENT
            </p>

            <h2>
              Product intelligence
            </h2>

            <p className="section-description">
              NEXUS could not identify a Product
              field in this dataset.
            </p>
          </div>
        </div>

        <div className="product-panel">
          <div className="product-empty-state">
            <span>
              FIELD REQUIRED
            </span>

            <h3>
              Product analysis unavailable.
            </h3>

            <p>
              Add a column such as Product,
              Product Name or Item to enable
              product analysis.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================
  // MAIN COMPONENT
  // =========================================================

  return (
    <section
      className="dashboard-section product-section"
      id="products"
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="section-title">
        <div>
          <p className="tagline">
            PRODUCT MANAGEMENT
          </p>

          <h2>
            Product intelligence
          </h2>

          <p className="section-description">
            Product performance calculated directly
            from the uploaded business dataset.
          </p>
        </div>

        <div className="product-filters">
          <select
            className="period-select"
            value={selectedProduct}
            onChange={(event) =>
              setSelectedProduct(
                event.target.value
              )
            }
          >
            <option>
              All Products
            </option>

            {products.map(
              (product) => (
                <option
                  key={product.name}
                  value={product.name}
                >
                  {product.name}
                </option>
              )
            )}
          </select>

          <select
            className="period-select"
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value
              )
            }
          >
            <option value="revenue">
              Sort: Revenue
            </option>

            <option value="orders">
              Sort: Orders
            </option>

            <option value="customers">
              Sort: Customers
            </option>
          </select>
        </div>
      </div>

      {/* =====================================================
          PRODUCT SUMMARY
      ====================================================== */}

      <div className="product-summary-grid">
        <div className="product-summary-card">
          <span>
            PRODUCTS DETECTED
          </span>

          <strong>
            {products.length}
          </strong>

          <p>
            Unique products identified
            in your dataset.
          </p>
        </div>

        <div className="product-summary-card">
          <span>
            PRODUCT REVENUE
          </span>

          <strong>
            {formatCurrency(
              totalProductRevenue
            )}
          </strong>

          <p>
            Revenue attributed to detected
            products.
          </p>
        </div>

        <div className="product-summary-card">
          <span>
            PRODUCT ORDERS
          </span>

          <strong>
            {formatNumber(
              totalProductOrders
            )}
          </strong>

          <p>
            Orders attributed to products.
          </p>
        </div>

        <div className="product-summary-card">
          <span>
            TOP PRODUCT
          </span>

          <strong>
            {topRevenueProduct
              ? topRevenueProduct.name
              : "—"}
          </strong>

          <p>
            Highest revenue contribution.
          </p>
        </div>
      </div>

      {/* =====================================================
          PRODUCT CARDS
      ====================================================== */}

      <div className="product-grid">
        {filteredProducts.map(
          (product) => (
            <div
              className="product-card"
              key={product.name}
            >
              <div className="product-card-header">
                <div>
                  <span>
                    PRODUCT
                  </span>

                  <h3>
                    {product.name}
                  </h3>
                </div>

                <span className="product-status active">
                  LIVE
                </span>
              </div>

              <div className="product-main-metric">
                <span>
                  REVENUE
                </span>

                <strong>
                  {formatCurrency(
                    product.revenue
                  )}
                </strong>

                <div className="product-progress">
                  <div
                    className="product-progress-fill"
                    style={{
                      width: `${Math.min(
                        product.revenueShare,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>

                <small className="product-share">
                  {product.revenueShare.toFixed(
                    1
                  )}
                  % of detected revenue
                </small>
              </div>

              <div className="product-metrics">
                <div>
                  <span>
                    ORDERS
                  </span>

                  <strong>
                    {formatNumber(
                      product.orders
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    CUSTOMERS
                  </span>

                  <strong>
                    {product.customers > 0
                      ? formatNumber(
                          product.customers
                        )
                      : "N/A"}
                  </strong>
                </div>

                <div>
                  <span>
                    AVG ORDER
                  </span>

                  <strong>
                    {formatCurrency(
                      product.averageOrderValue
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    REVENUE SHARE
                  </span>

                  <strong>
                    {product.revenueShare.toFixed(
                      1
                    )}
                    %
                  </strong>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* =====================================================
          PRODUCT PERFORMANCE
      ====================================================== */}

      <div className="product-analysis-grid">
        <div className="product-panel">
          <div className="panel-header">
            <div>
              <span>
                PRODUCT PERFORMANCE
              </span>

              <h3>
                Revenue contribution
              </h3>
            </div>

            <strong>
              {products.length}
            </strong>
          </div>

          <div className="product-ranking-list">
            {products.map(
              (product, index) => (
                <div
                  className="product-ranking-row"
                  key={product.name}
                >
                  <div className="product-ranking-name">
                    <span>
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <strong>
                      {product.name}
                    </strong>
                  </div>

                  <div className="product-ranking-bar">
                    <div
                      className="product-ranking-fill"
                      style={{
                        width: `${Math.min(
                          product.revenueShare,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>

                  <span>
                    {formatCurrency(
                      product.revenue
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="product-panel">
          <div className="panel-header">
            <div>
              <span>
                PRODUCT HEALTH
              </span>

              <h3>
                Current portfolio signals
              </h3>
            </div>
          </div>

          <div className="product-health-list">

            <div className="product-health-item">
              <span>
                Highest revenue
              </span>

              <strong>
                {topRevenueProduct
                  ? topRevenueProduct.name
                  : "—"}
              </strong>
            </div>

            <div className="product-health-item">
              <span>
                Highest order volume
              </span>

              <strong>
                {topOrdersProduct
                  ? topOrdersProduct.name
                  : "—"}
              </strong>
            </div>

            <div className="product-health-item">
              <span>
                Lowest revenue
              </span>

              <strong>
                {lowestRevenueProduct
                  ? lowestRevenueProduct.name
                  : "—"}
              </strong>
            </div>

            <div className="product-health-item">
              <span>
                Revenue concentration
              </span>

              <strong>
                {topRevenueProduct
                  ? `${topRevenueProduct.revenueShare.toFixed(
                      1
                    )}% in top product`
                  : "—"}
              </strong>
            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          PRODUCT DECISION SUPPORT
      ====================================================== */}

      <div className="product-panel">
        <div className="panel-header">
          <div>
            <span>
              PRODUCT DECISION SUPPORT
            </span>

            <h3>
              What does the data suggest?
            </h3>
          </div>
        </div>

        <div className="product-decision-grid">

          <div className="product-decision-card">
            <span>
              OPPORTUNITY
            </span>

            <h4>
              Protect the leading product
            </h4>

            <p>
              {topRevenueProduct
                ? `${topRevenueProduct.name} currently contributes the highest detected product revenue. Monitor availability, demand and customer response.`
                : "No leading product can be identified yet."}
            </p>
          </div>

          <div className="product-decision-card">
            <span>
              INVESTIGATION
            </span>

            <h4>
              Review the weakest contributor
            </h4>

            <p>
              {lowestRevenueProduct
                ? `${lowestRevenueProduct.name} has the lowest detected revenue contribution. Compare its order volume, pricing and demand with stronger products.`
                : "No low-performing product can be identified yet."}
            </p>
          </div>

          <div className="product-decision-card">
            <span>
              PORTFOLIO
            </span>

            <h4>
              Monitor concentration risk
            </h4>

            <p>
              {topRevenueProduct
                ? `${topRevenueProduct.name} contributes ${topRevenueProduct.revenueShare.toFixed(
                    1
                  )}% of detected product revenue. Track whether the portfolio is becoming overly dependent on one product.`
                : "Portfolio concentration cannot be calculated yet."}
            </p>
          </div>

        </div>
      </div>

      {/* =====================================================
          FEATURE / FEEDBACK AVAILABILITY
      ====================================================== */}

      <div className="product-panel product-data-availability">
        <div className="panel-header">
          <div>
            <span>
              PRODUCT DATA COVERAGE
            </span>

            <h3>
              Additional product intelligence
            </h3>
          </div>
        </div>

        <div className="data-coverage-grid">

          <div>
            <span>
              PRODUCT
            </span>

            <strong>
              {productColumn
                ? "Detected ✓"
                : "Missing"}
            </strong>
          </div>

          <div>
            <span>
              REVENUE
            </span>

            <strong>
              {revenueColumn
                ? "Detected ✓"
                : "Missing"}
            </strong>
          </div>

          <div>
            <span>
              ORDERS
            </span>

            <strong>
              {ordersColumn
                ? "Detected ✓"
                : "Optional"}
            </strong>
          </div>

          <div>
            <span>
              CUSTOMER
            </span>

            <strong>
              {customerColumn
                ? "Detected ✓"
                : "Optional"}
            </strong>
          </div>

        </div>

        <p className="product-data-note">
          Customer feedback, feature requests and
          product adoption analysis will become
          available when the uploaded dataset contains
          the corresponding fields.
        </p>
      </div>
    </section>
  );
}

export default ProductManagement;