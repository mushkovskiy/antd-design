import React, { useMemo } from "react";
import { Input, Select, Table, Space } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { BudgetProgressBar } from "../components/BudgetProgressBar";
import "./Dashboard.css";
import type {
  Territory,
  AptrBudgetGosb,
  AptrBudgetObject,
  AptrProject,
  TableRow,
} from "../types/dashboard";
import dashboardData from "../../component-specs/dashboard/data-example.json";

const Dashboard: React.FC = () => {
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

  // Calculate requirements count recursively
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
          gosb.aptrProjects
        );
      });
    }

    return count;
  };

  // Calculate cost (sum of summ for projects with status === "INCLUDED_AP")
  const calculateCost = (projects: AptrProject[]): number => {
    return projects
      .filter((project) => project.status === "INCLUDED_AP")
      .reduce((sum, project) => sum + project.summ, 0);
  };

  // Calculate cost recursively
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
          gosb.aptrProjects
        );
      });
    }

    return cost;
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ru-RU").format(num);
  };

  // Transform territories to table rows
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
          gosb.aptrBudgetObjects,
          gosb.aptrProjects
        );
        const gosbCost = calculateCostRecursive(
          undefined,
          gosb.aptrBudgetObjects,
          gosb.aptrProjects
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

  const { dataSource, summary } = useMemo(
    () => transformDataToTableRows(dashboardData.content as Territory[]),
    []
  );

  // Add summary row to data source
  const dataSourceWithSummary = useMemo(
    () => [...dataSource, summary],
    [dataSource, summary]
  );

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
      width: 300,
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
          width: 120,
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
          width: 150,
          render: (value: number, record: TableRow) => {
            if (record.isProject) {
              return <span>{formatNumber(value)}</span>;
            }
            return null;
          },
        },
        {
          title: "Бюджет",
          key: "budget",
          width: 300,
          render: (_: unknown, record: TableRow) => {
            if (record.isProject) {
              return null;
            }
            return (
              <BudgetProgressBar
                cost={record.cost || 0}
                budget={record.budget || 0}
              />
            );
          },
        },
        {
          title: "Отклонение",
          key: "deviation",
          width: 150,
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
        }}
      />
    </div>
  );
};

export default Dashboard;
