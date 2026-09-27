import { useMemo } from "react";

function ProjectManagement({ dataset }) {
  // =========================================================
  // HELPERS
  // =========================================================

  const normalize = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const findColumn = (columns, names) => {
    const normalizedColumns = columns.map(
      (column) => ({
        original: column,
        normalized: normalize(column),
      })
    );

    for (const name of names) {
      const target = normalize(name);

      const exact = normalizedColumns.find(
        (column) =>
          column.normalized === target
      );

      if (exact) {
        return exact.original;
      }
    }

    for (const name of names) {
      const target = normalize(name);

      const partial = normalizedColumns.find(
        (column) =>
          column.normalized.includes(target)
      );

      if (partial) {
        return partial.original;
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
      return null;
    }

    const number = Number(
      String(value)
        .replace("%", "")
        .replace(/,/g, "")
        .trim()
    );

    return Number.isFinite(number)
      ? number
      : null;
  };

  const parseDate = (value) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  };

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // COLUMN DETECTION
  // =========================================================

  const columns =
    dataset?.columns || [];

  const projectColumn =
    findColumn(columns, [
      "Project",
      "Project Name",
      "Project_Name",
      "Initiative",
      "Project Title",
    ]);

  const progressColumn =
    findColumn(columns, [
      "Progress",
      "Completion",
      "Completion %",
      "Completion Percentage",
      "Progress %",
    ]);

  const statusColumn =
    findColumn(columns, [
      "Status",
      "Project Status",
      "Project_Status",
    ]);

  const deadlineColumn =
    findColumn(columns, [
      "Deadline",
      "Due Date",
      "Due_Date",
      "End Date",
      "End_Date",
      "Target Date",
    ]);

  const ownerColumn =
    findColumn(columns, [
      "Owner",
      "Project Owner",
      "Manager",
      "Project Manager",
    ]);

  // =========================================================
  // PROJECT DATA
  // =========================================================

  const projects = useMemo(() => {
    if (
      !dataset?.data ||
      !projectColumn
    ) {
      return [];
    }

    const projectMap = {};

    dataset.data.forEach((row) => {
      const projectName = String(
        row[projectColumn] ?? ""
      ).trim();

      if (!projectName) {
        return;
      }

      if (!projectMap[projectName]) {
        projectMap[projectName] = {
          name: projectName,
          progressValues: [],
          statuses: [],
          deadlines: [],
          owners: [],
        };
      }

      if (progressColumn) {
        const progress =
          toNumber(
            row[progressColumn]
          );

        if (
          progress !== null
        ) {
          projectMap[
            projectName
          ].progressValues.push(
            Math.min(
              Math.max(
                progress,
                0
              ),
              100
            )
          );
        }
      }

      if (statusColumn) {
        const status = String(
          row[statusColumn] ?? ""
        ).trim();

        if (status) {
          projectMap[
            projectName
          ].statuses.push(status);
        }
      }

      if (deadlineColumn) {
        const deadline =
          parseDate(
            row[deadlineColumn]
          );

        if (deadline) {
          projectMap[
            projectName
          ].deadlines.push(
            deadline
          );
        }
      }

      if (ownerColumn) {
        const owner = String(
          row[ownerColumn] ?? ""
        ).trim();

        if (owner) {
          projectMap[
            projectName
          ].owners.push(owner);
        }
      }
    });

    return Object.values(
      projectMap
    ).map((project) => {
      const progress =
        project.progressValues.length >
        0
          ? project.progressValues.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
            project.progressValues.length
          : null;

      const deadline =
        project.deadlines.length >
        0
          ? new Date(
              Math.max(
                ...project.deadlines.map(
                  (date) =>
                    date.getTime()
                )
              )
            )
          : null;

      const owner =
        project.owners.length > 0
          ? project.owners[0]
          : "Unassigned";

      const status =
        project.statuses.length > 0
          ? project.statuses[
              project.statuses.length -
                1
            ]
          : null;

      let health = "UNKNOWN";

      if (
        progress !== null &&
        deadline
      ) {
        const today =
          new Date();

        const daysRemaining =
          Math.ceil(
            (deadline.getTime() -
              today.getTime()) /
              (1000 *
                60 *
                60 *
                24)
          );

        if (
          progress >= 90 &&
          daysRemaining >= 0
        ) {
          health = "HEALTHY";
        } else if (
          progress >= 60 &&
          daysRemaining >= 0
        ) {
          health = "ON TRACK";
        } else if (
          daysRemaining < 0 &&
          progress < 100
        ) {
          health = "OVERDUE";
        } else {
          health = "AT RISK";
        }
      } else if (
        progress !== null
      ) {
        health =
          progress >= 75
            ? "ON TRACK"
            : progress >= 40
            ? "MONITOR"
            : "AT RISK";
      } else if (status) {
        const normalizedStatus =
          status.toLowerCase();

        if (
          normalizedStatus.includes(
            "complete"
          )
        ) {
          health = "HEALTHY";
        } else if (
          normalizedStatus.includes(
            "risk"
          ) ||
          normalizedStatus.includes(
            "delay"
          )
        ) {
          health = "AT RISK";
        } else {
          health = "MONITOR";
        }
      }

      return {
        name: project.name,
        progress,
        deadline,
        owner,
        status,
        health,
      };
    });
  }, [
    dataset,
    projectColumn,
    progressColumn,
    statusColumn,
    deadlineColumn,
    ownerColumn,
  ]);

  // =========================================================
  // SUMMARY METRICS
  // =========================================================

  const projectsWithProgress =
    projects.filter(
      (project) =>
        project.progress !== null
    );

  const averageProgress =
    projectsWithProgress.length >
    0
      ? projectsWithProgress.reduce(
          (sum, project) =>
            sum +
            project.progress,
          0
        ) /
        projectsWithProgress.length
      : null;

  const atRiskProjects =
    projects.filter(
      (project) =>
        project.health ===
          "AT RISK" ||
        project.health ===
          "OVERDUE"
    );

  const overdueProjects =
    projects.filter(
      (project) =>
        project.health ===
        "OVERDUE"
    );

  const completedProjects =
    projects.filter(
      (project) =>
        project.progress !== null &&
        project.progress >= 100
    );

  const projectCoverage = {
    project: Boolean(
      projectColumn
    ),
    progress: Boolean(
      progressColumn
    ),
    status: Boolean(
      statusColumn
    ),
    deadline: Boolean(
      deadlineColumn
    ),
    owner: Boolean(
      ownerColumn
    ),
  };

  // =========================================================
  // NO DATA
  // =========================================================

  if (!dataset) {
    return (
      <section
        className="dashboard-section project-management-section"
        id="projects"
      >
        <div className="section-title">
          <div>
            <p className="tagline">
              PROJECT MANAGEMENT
            </p>

            <h2>
              Project intelligence
            </h2>

            <p className="section-description">
              Upload a dataset containing project
              information to activate project
              tracking.
            </p>
          </div>
        </div>

        <div className="project-empty-state">
          <span>
            NO DATASET
          </span>

          <h3>
            Project analysis is waiting for data.
          </h3>

          <p>
            Upload a project dataset containing
            fields such as Project, Progress,
            Deadline, Status or Owner.
          </p>
        </div>
      </section>
    );
  }

  // =========================================================
  // NO PROJECT FIELD
  // =========================================================

  if (!projectColumn) {
    return (
      <section
        className="dashboard-section project-management-section"
        id="projects"
      >
        <div className="section-title">
          <div>
            <p className="tagline">
              PROJECT MANAGEMENT
            </p>

            <h2>
              Project intelligence
            </h2>

            <p className="section-description">
              NEXUS could not identify project
              information in the uploaded dataset.
            </p>
          </div>
        </div>

        <div className="project-empty-state">
          <span>
            PROJECT DATA NOT AVAILABLE
          </span>

          <h3>
            No project field detected.
          </h3>

          <p>
            Your current dataset contains sales,
            product and delivery information, but
            not project information. Add a column
            such as <strong>Project</strong> or
            <strong> Project Name</strong> to enable
            this module.
          </p>

          <div className="project-fields-needed">

            <div>
              <span>
                PROJECT
              </span>

              <strong>
                Required
              </strong>
            </div>

            <div>
              <span>
                PROGRESS
              </span>

              <strong>
                Recommended
              </strong>
            </div>

            <div>
              <span>
                DEADLINE
              </span>

              <strong>
                Recommended
              </strong>
            </div>

            <div>
              <span>
                STATUS
              </span>

              <strong>
                Optional
              </strong>
            </div>
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
      className="dashboard-section project-management-section"
      id="projects"
    >
      {/* HEADER */}

      <div className="section-title">
        <div>
          <p className="tagline">
            PROJECT MANAGEMENT
          </p>

          <h2>
            Project intelligence
          </h2>

          <p className="section-description">
            Project performance calculated directly
            from the uploaded dataset.
          </p>
        </div>
      </div>

      {/* =====================================================
          PROJECT KPIs
      ====================================================== */}

      <div className="project-management-kpis">

        <div className="project-management-kpi">
          <span>
            PROJECTS
          </span>

          <strong>
            {projects.length}
          </strong>

          <p>
            Projects detected in the dataset.
          </p>
        </div>

        <div className="project-management-kpi">
          <span>
            AVERAGE PROGRESS
          </span>

          <strong>
            {averageProgress !== null
              ? `${averageProgress.toFixed(
                  1
                )}%`
              : "N/A"}
          </strong>

          <p>
            Average completion across projects.
          </p>
        </div>

        <div className="project-management-kpi warning">
          <span>
            AT RISK
          </span>

          <strong>
            {atRiskProjects.length}
          </strong>

          <p>
            Projects requiring attention.
          </p>
        </div>

        <div className="project-management-kpi">
          <span>
            COMPLETED
          </span>

          <strong>
            {completedProjects.length}
          </strong>

          <p>
            Projects at 100% completion.
          </p>
        </div>
      </div>

      {/* =====================================================
          PROJECT TABLE
      ====================================================== */}

      <div className="project-management-panel">

        <div className="panel-header">
          <div>
            <span>
              PROJECT PORTFOLIO
            </span>

            <h3>
              Current project status
            </h3>
          </div>

          <span className="panel-note">
            {projects.length} projects detected
          </span>
        </div>

        <div className="project-table-wrapper">

          <div className="project-table">

            <div className="project-row project-heading">

              <span>
                PROJECT
              </span>

              <span>
                PROGRESS
              </span>

              <span>
                DEADLINE
              </span>

              <span>
                OWNER
              </span>

              <span>
                HEALTH
              </span>

            </div>

            {projects.map(
              (project) => (
                <div
                  className="project-row"
                  key={
                    project.name
                  }
                >

                  <div className="project-name-cell">

                    <strong>
                      {
                        project.name
                      }
                    </strong>

                    {project.status && (
                      <small>
                        {
                          project.status
                        }
                      </small>
                    )}

                  </div>

                  <div>

                    <div className="project-progress-line">

                      <div
                        className="project-progress-fill"
                        style={{
                          width:
                            project.progress !==
                            null
                              ? `${project.progress}%`
                              : "0%",
                        }}
                      ></div>

                    </div>

                    <small>
                      {project.progress !==
                      null
                        ? `${project.progress.toFixed(
                            1
                          )}%`
                        : "N/A"}
                    </small>

                  </div>

                  <span>
                    {formatDate(
                      project.deadline
                    )}
                  </span>

                  <span>
                    {project.owner}
                  </span>

                  <span
                    className={`project-health ${project.health
                      .toLowerCase()
                      .replace(
                        " ",
                        "-"
                      )}`}
                  >
                    {project.health}
                  </span>

                </div>
              )
            )}

          </div>

        </div>
      </div>

      {/* =====================================================
          PROJECT RISKS
      ====================================================== */}

      <div className="project-analysis-grid">

        <div className="project-management-panel">

          <div className="panel-header">

            <div>
              <span>
                PROJECT RISK
              </span>

              <h3>
                Projects needing attention
              </h3>
            </div>

            <strong>
              {atRiskProjects.length}
            </strong>

          </div>

          {atRiskProjects.length === 0 ? (
            <div className="project-no-risk">
              <strong>
                No at-risk projects detected.
              </strong>

              <p>
                Based on the available project
                fields, NEXUS did not identify a
                current project health risk.
              </p>
            </div>
          ) : (
            <div className="project-risk-list">

              {atRiskProjects.map(
                (project) => (
                  <div
                    className="project-risk-item"
                    key={
                      project.name
                    }
                  >

                    <div>
                      <span>
                        {project.health}
                      </span>

                      <strong>
                        {
                          project.name
                        }
                      </strong>
                    </div>

                    <p>
                      {project.progress !==
                      null
                        ? `Current progress: ${project.progress.toFixed(
                            1
                          )}%.`
                        : "Progress data is not available."}

                      {project.deadline
                        ? ` Deadline: ${formatDate(
                            project.deadline
                          )}.`
                        : ""}
                    </p>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        {/* DATA COVERAGE */}

        <div className="project-management-panel">

          <div className="panel-header">

            <div>

              <span>
                PROJECT DATA COVERAGE
              </span>

              <h3>
                Detected project fields
              </h3>

            </div>

          </div>

          <div className="project-coverage-list">

            <div>
              <span>
                Project
              </span>

              <strong>
                {projectCoverage.project
                  ? "Detected ✓"
                  : "Missing"}
              </strong>
            </div>

            <div>
              <span>
                Progress
              </span>

              <strong>
                {projectCoverage.progress
                  ? "Detected ✓"
                  : "Not available"}
              </strong>
            </div>

            <div>
              <span>
                Deadline
              </span>

              <strong>
                {projectCoverage.deadline
                  ? "Detected ✓"
                  : "Not available"}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong>
                {projectCoverage.status
                  ? "Detected ✓"
                  : "Not available"}
              </strong>
            </div>

            <div>
              <span>
                Owner
              </span>

              <strong>
                {projectCoverage.owner
                  ? "Detected ✓"
                  : "Not available"}
              </strong>
            </div>

          </div>

        </div>
      </div>

      {/* =====================================================
          PROJECT ACTIONS
      ====================================================== */}

      <div className="project-management-panel">

        <div className="panel-header">

          <div>

            <span>
              PROJECT DECISION SUPPORT
            </span>

            <h3>
              Recommended actions
            </h3>

          </div>

        </div>

        <div className="project-actions-grid">

          <div className="project-action-card">

            <span>
              RISK
            </span>

            <h4>
              Review at-risk projects
            </h4>

            <p>
              {atRiskProjects.length > 0
                ? `${atRiskProjects.length} project(s) currently require closer monitoring based on progress and deadline signals.`
                : "No current project-risk signal was detected from the available project data."}
            </p>

          </div>

          <div className="project-action-card">

            <span>
              DELIVERY
            </span>

            <h4>
              Track upcoming deadlines
            </h4>

            <p>
              {deadlineColumn
                ? "Use deadline and progress together to identify projects that may miss their planned completion date."
                : "Add a Deadline or Due Date field to enable deadline-based project risk analysis."}
            </p>

          </div>

          <div className="project-action-card">

            <span>
              DATA
            </span>

            <h4>
              Improve project coverage
            </h4>

            <p>
              {progressColumn &&
              deadlineColumn
                ? "The dataset contains the main fields required for project monitoring."
                : "Adding Progress, Deadline and Status fields will make project analysis more precise."}
            </p>

          </div>

        </div>
      </div>
    </section>
  );
}

export default ProjectManagement;