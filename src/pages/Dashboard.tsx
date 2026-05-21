import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select, Table, Space, Alert } from "antd";
import { CheckOutlined, LoadingOutlined } from "@ant-design/icons";
import { BudgetProgressBar } from "../components/BudgetProgressBar";
import { useDashboardSearch } from "../hooks/useDashboardSearch";
import "./Dashboard.css";
import type {
  Territory,
  AptrBudgetGosb,
  AptrBudgetObject,
  AptrProject,
  TableRow,
} from "../types/dashboard";
import dashboardData from "../../component-specs/dashboard/data-example.json";

const EXPANDED_KEYS_STORAGE_KEY = "dashboard:expandedRowKeys";
const SINGLE_CLICK_DELAY_MS = 250;

const toggleGosbSubtree = (gosbRow: TableRow, prev: string[]): string[] => {
  const subtreeKeys = [
    gosbRow.key,
    ...(gosbRow.children ?? []).map((c) => c.key),
  ];
  const prevSet = new Set(prev);
  const anyExpanded = subtreeKeys.some((k) => prevSet.has(k));

  if (anyExpanded) {
    const toRemove = new Set(subtreeKeys);
    return prev.filter((k) => !toRemove.has(k));
  }
  return Array.from(new Set([...prev, ...subtreeKeys]));
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Filter states (no logic yet)
  const [searchValue, setSearchValue] = React.useState("");
  const [selectedYear, setSelectedYear] = React.useState<string | undefined>(
    undefined
  );
  const [selectedQuarter, setSelectedQuarter] = React.useState<
    string | undefined
  >(undefined);
  const [selectedCustomer, setSelectedCustomer] = React.useState<
    string | undefined
  >(undefined);
  const [expandedRowKeys, setExpandedRowKeys] = React.useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem(EXPANDED_KEYS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.filter((k): k is string => typeof k === "string")
        : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        EXPANDED_KEYS_STORAGE_KEY,
        JSON.stringify(expandedRowKeys)
      );
    } catch {
      // ignore quota errors
    }
  }, [expandedRowKeys]);

  // Year options (current year and next year)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { label: currentYear.toString(), value: currentYear.toString() },
    { label: (currentYear + 1).toString(), value: (currentYear + 1).toString() },
  ];

  // Quarter options
  const quarterOptions = [
    { label: "Q1", value: "Q1" },
    { label: "Q2", value: "Q2" },
    { label: "Q3", value: "Q3" },
    { label: "Q4", value: "Q4" },
  ];

  // Customer options
  const customerOptions = [
    { label: "ВСП", value: "vsp" },
    { label: "VIP ВСП", value: "vip_vsp" },
    { label: "ЦУНДО / КИЦ", value: "cundo_kic" },
    { label: "АЗ", value: "az" },
    { label: "Блок Т.", value: "block_t" },
  ];

  // Calculate requirements count for a territory/gosb/object
  const calculateRequirements = (projects: AptrProject[]): number => {
    return projects.length;
  };

  /**
   * Recursively calculate the total number of requirements (projects) in the structure.
   *
   * Input: Territory GOSBs, Objects, or Projects
   * Algorithm:
   *   - For projects: count the number of items
   *   - For objects: sum projects from all objects
   *   - For GOSBs: sum projects from all objects in all GOSBs
   * Result: Total count of projects
   */
  const calculateRequirementsRecursive = (
    gosbs?: AptrBudgetGosb[],
    objects?: AptrBudgetObject[],
    projects?: AptrProject[]
  ): number => {
    let count = 0;

    if (projects && projects.length > 0) {
      count += projects.length;
    }

    if (objects && objects.length > 0) {
      objects.forEach((obj) => {
        count += calculateRequirementsRecursive(
          undefined,
          undefined,
          obj.aptrProjects
        );
      });
    }

    if (gosbs && gosbs.length > 0) {
      gosbs.forEach((gosb) => {
        count += calculateRequirementsRecursive(
          undefined,
          gosb.aptrBudgetObjects,
          undefined
        );
      });
    }

    return count;
  };

  /**
   * Calculate cost from projects with status "INCLUDED_AP".
   *
   * Input: Array of projects
   * Algorithm: Filter projects by status === "INCLUDED_AP" and sum their summ values
   * Result: Total cost
   */
  const calculateCost = (projects: AptrProject[]): number => {
    return projects
      .filter((project) => project.status === "INCLUDED_AP")
      .reduce((sum, project) => sum + project.summ, 0);
  };

  /**
   * Recursively calculate the total cost in the structure.
   *
   * Input: Territory GOSBs, Objects, or Projects
   * Algorithm:
   *   - For projects: sum costs of projects with status "INCLUDED_AP"
   *   - For objects: sum costs from all objects
   *   - For GOSBs: sum costs from all objects in all GOSBs
   * Result: Total cost
   */
  const calculateCostRecursive = (
    gosbs?: AptrBudgetGosb[],
    objects?: AptrBudgetObject[],
    projects?: AptrProject[]
  ): number => {
    let cost = 0;

    if (projects && projects.length > 0) {
      cost += calculateCost(projects);
    }

    if (objects && objects.length > 0) {
      objects.forEach((obj) => {
        cost += calculateCostRecursive(undefined, undefined, obj.aptrProjects);
      });
    }

    if (gosbs && gosbs.length > 0) {
      gosbs.forEach((gosb) => {
        cost += calculateCostRecursive(
          undefined,
          gosb.aptrBudgetObjects,
          undefined
        );
      });
    }

    return cost;
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ru-RU").format(num);
  };

  /**
   * Transform territories data into table rows with hierarchical structure.
   *
   * Input: Array of Territory objects from API
   * Algorithm:
   *   1. For each territory, calculate requirements, cost, budget, deviation
   *   2. Transform GOSBs into child rows with their own calculations
   *   3. Transform Objects into child rows of GOSBs
   *   4. Transform Projects into child rows of Objects
   *   5. Accumulate totals for summary row
   * Result: Object with dataSource (tree structure) and summary row
   */
  const transformDataToTableRows = (
    territories: Territory[]
  ): { dataSource: TableRow[]; summary: TableRow } => {
    let totalRequirements = 0;
    let totalCost = 0;
    let totalBudget = 0;

    const dataSource = territories.map((territory) => {
      const requirements = calculateRequirementsRecursive(
        territory.aptrBudgetGosbs
      );
      const cost = calculateCostRecursive(territory.aptrBudgetGosbs);
      const budget = Number(territory.planBudget);
      const deviation = budget - cost;
      const deviationPercent =
        budget > 0 ? ((deviation / budget) * 100).toFixed(2) : 0;

      totalRequirements += requirements;
      totalCost += cost;
      totalBudget += budget;

      // Transform GOSBs
      const gosbRows: TableRow[] = territory.aptrBudgetGosbs.map((gosb) => {
        const gosbRequirements = calculateRequirementsRecursive(
          undefined,
          gosb.aptrBudgetObjects
        );
        const gosbCost = calculateCostRecursive(
          undefined,
          gosb.aptrBudgetObjects
        );
        const gosbBudget = Number(gosb.planBidget);
        const gosbDeviation = gosbBudget - gosbCost;
        const gosbDeviationPercent =
          gosbBudget > 0 ? ((gosbDeviation / gosbBudget) * 100).toFixed(2) : 0;

        // Transform Objects
        const objectRows: TableRow[] = gosb.aptrBudgetObjects.map((obj) => {
          const objRequirements = calculateRequirements(obj.aptrProjects);
          const objCost = calculateCost(obj.aptrProjects);
          const objBudget = Number(obj.planBidget);
          const objDeviation = objBudget - objCost;
          const objDeviationPercent =
            objBudget > 0 ? ((objDeviation / objBudget) * 100).toFixed(2) : 0;

          // Transform Projects
          const projectRows: TableRow[] = obj.aptrProjects.map((project) => ({
            key: project.id,
            name: obj.object,
            requirements: 1,
            cost: project.summ,
            isProject: true,
            projectNumber: project.number,
            projectCustomer: project.customer,
            projectQuarter: project.quarter,
            projectStatus: project.status,
          }));

          return {
            key: obj.id,
            name: obj.object,
            requirements: objRequirements,
            cost: objCost,
            budget: objBudget,
            deviation: objDeviation,
            deviationPercent: Number(objDeviationPercent),
            children: projectRows.length > 0 ? projectRows : undefined,
          };
        });

        return {
          key: gosb.id,
          name: gosb.gosbId,
          requirements: gosbRequirements,
          cost: gosbCost,
          budget: gosbBudget,
          deviation: gosbDeviation,
          deviationPercent: Number(gosbDeviationPercent),
          isGosb: true,
          children: objectRows.length > 0 ? objectRows : undefined,
        };
      });

      return {
        key: territory.id,
        name: territory.tbId,
        requirements,
        cost,
        budget,
        deviation,
        deviationPercent: Number(deviationPercent),
        children: gosbRows.length > 0 ? gosbRows : undefined,
      };
    });

    const totalDeviation = totalBudget - totalCost;
    const totalDeviationPercent =
      totalBudget > 0
        ? ((totalDeviation / totalBudget) * 100).toFixed(2)
        : 0;

    const summary: TableRow = {
      key: "summary",
      name: "Итого",
      requirements: totalRequirements,
      cost: totalCost,
      budget: totalBudget,
      deviation: totalDeviation,
      deviationPercent: Number(totalDeviationPercent),
      isSummary: true,
    };

    return { dataSource, summary };
  };

  const territories = useMemo(
    () => dashboardData.content as Territory[],
    []
  );

  const { dataSource, summary } = useMemo(
    () => transformDataToTableRows(territories),
    [territories]
  );

  // Add summary row to data source
  const dataSourceWithSummary = useMemo(
    () => [...dataSource, summary],
    [dataSource, summary]
  );

  const isRowExpandable = (record: TableRow) =>
    Boolean(record.children && record.children.length > 0);

  const toggleRowExpansion = (record: TableRow) => {
    if (!isRowExpandable(record)) {
      return;
    }

    setExpandedRowKeys((prevKeys) =>
      prevKeys.includes(record.key)
        ? prevKeys.filter((key) => key !== record.key)
        : [...prevKeys, record.key]
    );
  };

  const singleClickTimerRef = React.useRef<number | null>(null);

  const handleGosbSingleClick = (record: TableRow) => {
    if (singleClickTimerRef.current !== null) {
      window.clearTimeout(singleClickTimerRef.current);
    }
    singleClickTimerRef.current = window.setTimeout(() => {
      singleClickTimerRef.current = null;
      toggleRowExpansion(record);
    }, SINGLE_CLICK_DELAY_MS);
  };

  const handleGosbDoubleClick = (record: TableRow) => {
    if (singleClickTimerRef.current !== null) {
      window.clearTimeout(singleClickTimerRef.current);
      singleClickTimerRef.current = null;
    }
    setExpandedRowKeys((prev) => toggleGosbSubtree(record, prev));
  };

  React.useEffect(() => {
    return () => {
      if (singleClickTimerRef.current !== null) {
        window.clearTimeout(singleClickTimerRef.current);
      }
    };
  }, []);

  const handleMatchExpand = React.useCallback((ancestors: string[]) => {
    setExpandedRowKeys((prev) => Array.from(new Set([...prev, ...ancestors])));
  }, []);

  const { isSearching, matchesCount } = useDashboardSearch({
    query: searchValue,
    territories,
    onMatchExpand: handleMatchExpand,
  });

  // Table columns
  const columns = [
    {
      title: (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Территория</div>
          <div style={{ fontSize: "12px", fontWeight: 400, color: "#8c8c8c" }}>
            потребности в шт., бюджет в рублях без НДС
          </div>
        </div>
      ),
      dataIndex: "name",
      key: "name",
      width: '30%',
      onCell: (record: TableRow) => {
        if (record.isProject) {
          return {
            onClick: () => navigate(`/project/${record.key}`),
            style: { cursor: "pointer" },
          };
        }
        if (record.isGosb) {
          return {
            onClick: () => handleGosbSingleClick(record),
            onDoubleClick: () => handleGosbDoubleClick(record),
            style: {
              cursor: isRowExpandable(record) ? "pointer" : undefined,
              userSelect: "none" as const,
            },
          };
        }
        return {
          onClick: () => toggleRowExpansion(record),
          style: isRowExpandable(record) ? { cursor: "pointer" } : undefined,
        };
      },
      render: (text: string, record: TableRow) => {
        if (record.isProject) {
          return (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>{record.projectNumber}</span>
              <span>{record.projectCustomer}</span>
              <span>{record.projectQuarter}</span>
              <span>{record.projectStatus}</span>
            </div>
          );
        }
        return (
          <span style={{ fontWeight: record.isSummary ? 600 : 400 }}>
            {text}
          </span>
        );
      },
    },
    {
      title: "Планирование ремонта",
      children: [
        {
          title: "Потребность",
          dataIndex: "requirements",
          key: "requirements",
          render: (value: number, record: TableRow) => (
            <span style={{ fontWeight: record.isSummary ? 600 : 400 }}>
              {value}
            </span>
          ),
        },
        {
          title: "Стоимость",
          dataIndex: "cost",
          key: "cost",
          onCell: (record: TableRow) => {
            // For project rows, show only cost value in one cell
            if (record.isProject) {
              return {};
            }
            // For other rows, span across Cost and Budget columns for ProgressBar
            return { colSpan: 2 };
          },
          render: (value: number, record: TableRow) => {
            if (record.isProject) {
              return <span>{formatNumber(value)}</span>;
            }
            // Render ProgressBar spanning both Cost and Budget columns
            return (
              <BudgetProgressBar
                cost={record.cost || 0}
                budget={record.budget || 0}
              />
            );
          },
        },
        {
          title: "Бюджет",
        
          key: "budget",
          onCell: (record: TableRow) => {
            // For project rows, hide this column (no budget/deviation)
            if (record.isProject) {
              return { colSpan: 0 };
            }
            // For other rows, this cell is hidden because Cost column spans 2
            return { colSpan: 0 };
          },
          render: () => null,
        },
        {
          title: "Отклонение",
          key: "deviation",
          render: (_: unknown, record: TableRow) => {
            if (record.isProject) {
              return null;
            }
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontWeight: record.isSummary ? 600 : 400 }}>
                  {record.deviation === 0 ? (
                    <CheckOutlined style={{ color: "#52c41a" }} />
                  ) : (
                    formatNumber(record.deviation || 0)
                  )}
                </span>
                <span
                  style={{
                    fontWeight: record.isSummary ? 600 : 400,
                    color: "#8c8c8c",
                  }}
                >
                  {record.deviationPercent}%
                </span>
              </div>
            );
          },
        },
      ],
      width: '70%',
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "24px" }}>Dashboard</h1>

      {/* Filter block */}
      <Space
        style={{ marginBottom: "24px", width: "100%" }}
        size="middle"
        wrap
      >
        <Input
          placeholder="Введите адрес или номер заявки"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          suffix={isSearching ? <LoadingOutlined /> : <span />}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Выберите год"
          options={yearOptions}
          value={selectedYear}
          onChange={setSelectedYear}
          style={{ width: 150 }}
          allowClear
        />
        <Select
          placeholder="Выберите квартал"
          options={quarterOptions}
          value={selectedQuarter}
          onChange={setSelectedQuarter}
          style={{ width: 150 }}
          allowClear
        />
        <Select
          placeholder="Выберите заказчика"
          options={customerOptions}
          value={selectedCustomer}
          onChange={setSelectedCustomer}
          style={{ width: 200 }}
          allowClear
        />
      </Space>

      {!isSearching && matchesCount === 0 && searchValue.trim() && (
        <Alert
          type="info"
          message="Ничего не найдено"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Table */}
      <Table
        className="dashboard-table"
        columns={columns}
        dataSource={dataSourceWithSummary}
        pagination={false}
        bordered
        size="middle"
        scroll={{ x: 1200 }}
        expandable={{
          defaultExpandAllRows: false,
          expandedRowKeys,
          showExpandColumn: true,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
        }}
      />
    </div>
  );
};

export default Dashboard;
