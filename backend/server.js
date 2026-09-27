const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ==================================================
// BASIC TEST
// ==================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NEXUS Backend is running"
  });
});

// ==================================================
// DATABASE TEST
// ==================================================

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "NEXUS connected to PostgreSQL successfully",
      databaseTime: result.rows[0].now
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});

// ==================================================
// UPLOAD DATASET
// ==================================================

app.post("/api/datasets/upload", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      fileName,
      columns,
      rows
    } = req.body;

    if (
      !fileName ||
      !Array.isArray(columns) ||
      !Array.isArray(rows)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "fileName, columns and rows are required."
      });
    }

    await client.query("BEGIN");

    const datasetResult = await client.query(
      `
      INSERT INTO uploaded_datasets
      (file_name, row_count, column_count)
      VALUES ($1, $2, $3)
      RETURNING id, file_name, row_count, column_count, uploaded_at
      `,
      [
        fileName,
        rows.length,
        columns.length
      ]
    );

    const dataset =
      datasetResult.rows[0];

    for (const row of rows) {
      await client.query(
        `
        INSERT INTO dataset_rows
        (dataset_id, row_data)
        VALUES ($1, $2)
        `,
        [
          dataset.id,
          JSON.stringify(row)
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message:
        "Dataset uploaded successfully",
      dataset
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Dataset upload error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to upload dataset",
      error: error.message
    });

  } finally {
    client.release();
  }
});

// ==================================================
// GET ALL DATASETS
// ==================================================

app.get("/api/datasets", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        file_name,
        row_count,
        column_count,
        uploaded_at
      FROM uploaded_datasets
      ORDER BY uploaded_at DESC
      `
    );

    res.json({
      success: true,
      datasets: result.rows
    });

  } catch (error) {
    console.error(
      "Fetch datasets error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch datasets"
    });
  }
});

// ==================================================
// GET ONE DATASET
// ==================================================

app.get("/api/datasets/:id", async (req, res) => {
  try {
    const datasetId =
      req.params.id;

    const datasetResult =
      await pool.query(
        `
        SELECT
          id,
          file_name,
          row_count,
          column_count,
          uploaded_at
        FROM uploaded_datasets
        WHERE id = $1
        `,
        [datasetId]
      );

    if (
      datasetResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Dataset not found."
      });
    }

    const rowsResult =
      await pool.query(
        `
        SELECT row_data
        FROM dataset_rows
        WHERE dataset_id = $1
        ORDER BY id
        `,
        [datasetId]
      );

    res.json({
      success: true,
      dataset:
        datasetResult.rows[0],
      rows: rowsResult.rows.map(
        (row) => row.row_data
      )
    });

  } catch (error) {
    console.error(
      "Fetch dataset error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch dataset"
    });
  }
});

// ==================================================
// DELETE DATASET
// ==================================================

app.delete(
  "/api/datasets/:id",
  async (req, res) => {
    try {
      const datasetId =
        req.params.id;

      const result =
        await pool.query(
          `
          DELETE FROM uploaded_datasets
          WHERE id = $1
          RETURNING id, file_name
          `,
          [datasetId]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Dataset not found."
        });
      }

      res.json({
        success: true,
        message:
          "Dataset deleted successfully",
        dataset:
          result.rows[0]
      });

    } catch (error) {
      console.error(
        "Delete dataset error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete dataset",
        error: error.message
      });
    }
  }
);

// ==================================================
// START SERVER
// ==================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `NEXUS backend running on port ${PORT}`
  );
});