import { useEffect, useState } from "react";

function DatasetHistory({ onSelectDataset, selectedDatasetId }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (datasetId, fileName) => {
  const confirmed = window.confirm(
    `Delete "${fileName}" permanently?`
  );

  if (!confirmed) return;

  try {
    setDeletingId(datasetId);

    const response = await fetch(
      `http://localhost:5000/api/datasets/${datasetId}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Delete failed."
      );
    }

    await loadDatasets();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Unable to delete dataset.");
  } finally {
    setDeletingId(null);
  }
};
  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/datasets"
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load datasets."
        );
      }

      setDatasets(result.datasets || []);
    } catch (err) {
      console.error("Dataset history error:", err);

      setError(
        "Unable to load dataset history. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Unknown";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section
      id="dataset-history"
      className="dataset-history-section"
    >
      <div className="section-title">
        <div>
          <p className="tagline">DATA MANAGEMENT</p>
          <h2>Dataset History</h2>
          <p className="section-subtitle">
            View and switch between datasets saved in NEXUS.
          </p>
        </div>

        <button
          className="history-refresh-btn"
          onClick={loadDatasets}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="history-state">
          Loading saved datasets...
        </div>
      )}

      {error && (
        <div className="history-error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        datasets.length === 0 && (
          <div className="history-empty">
            <div className="history-empty-icon">📂</div>
            <h3>No saved datasets</h3>
            <p>
              Upload your first CSV or Excel file to
              create a dataset history.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        datasets.length > 0 && (
          <div className="history-list">
            {datasets.map((dataset) => {
              const isActive =
                String(dataset.id) ===
                String(selectedDatasetId);

              return (
                <div
                  className={`history-card ${
                    isActive ? "active" : ""
                  }`}
                  key={dataset.id}
                >
                  <div className="history-card-main">
                    <div className="history-file-icon">
                      📊
                    </div>

                    <div className="history-file-info">
                      <h3>{dataset.file_name}</h3>

                      <p>
                        {dataset.row_count} records
                        {" • "}
                        {dataset.column_count} columns
                      </p>

                      <small>
                        Uploaded:{" "}
                        {formatDate(
                          dataset.uploaded_at
                        )}
                      </small>
                    </div>
                  </div>

                  <div className="history-card-right">
                    {isActive && (
                      <span className="history-active-badge">
                        ACTIVE
                      </span>
                    )}

                    <button
                      className="history-load-btn"
                      onClick={() =>
                        onSelectDataset(dataset.id)
                      }
                    >
                      {isActive
                        ? "Loaded"
                        : "Load Dataset"}
                    </button>
                    <button
  className="history-delete-btn"
  onClick={() =>
    handleDelete(
      dataset.id,
      dataset.file_name
    )
  }
  disabled={deletingId === dataset.id}
>
  {deletingId === dataset.id
    ? "Deleting..."
    : "Delete"}
</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </section>
  );
}

export default DatasetHistory;