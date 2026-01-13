import React from "react";

interface BudgetProgressBarProps {
  cost: number;
  budget: number;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  cost,
  budget,
}) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ru-RU").format(num);
  };

  const getBarColor = () => {
    if (cost === 0) {
      return "rgb(233, 234, 255)";
    }
    if (cost < budget) {
      return {
        filled: "rgb(171, 169, 241)",
        empty: "rgb(233, 234, 255)",
      };
    }
    if (cost > budget) {
      return "rgb(255, 120, 117)";
    }
    return "rgb(81, 158, 65)";
  };

  const barColor = getBarColor();
  const fillPercentage = budget > 0 ? Math.min((cost / budget) * 100, 100) : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "265px",
        height: "30px",
        borderRadius: "16px",
        backgroundColor:
          typeof barColor === "string" ? barColor : barColor.empty,
        padding: "0 12px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Filled portion (only shown when cost < budget) */}
      {typeof barColor === "object" && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${fillPercentage}%`,
            backgroundColor: barColor.filled,
            borderRadius: "16px",
            transition: "width 0.3s ease",
          }}
        />
      )}

      {/* Cost value (left) */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: "12px",
          fontWeight: 500,
          color: "#000",
        }}
      >
        {formatNumber(cost)}
      </span>

      {/* Budget value (right) */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: "12px",
          fontWeight: 500,
          color: "#000",
        }}
      >
        {formatNumber(budget)}
      </span>
    </div>
  );
};
