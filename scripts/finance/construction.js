import { annualToMonthlyRate, clampMoney, pmt } from "./helpers.js";

const DEFAULT_POST_DELIVERY_MONTHS = 360;

export function calculateConstructionEvolution(input) {
  const propertyValue = clampMoney(input.propertyValue);
  const financedValue = clampMoney(input.financedValue);
  const downPayment = clampMoney(input.downPayment);
  const workInterestAnnualRate = Math.max(0, Number(input.workInterestAnnualRate) || 0);
  const inccAnnualRate = Math.max(0, Number(input.inccAnnualRate) || 0);
  const months = Math.max(0, Number.parseInt(input.months, 10) || 0);
  const expectedSaleValue = clampMoney(input.expectedSaleValue);

  const workInterestMonthlyRate = annualToMonthlyRate(workInterestAnnualRate);
  const inccMonthlyRate = annualToMonthlyRate(inccAnnualRate);
  const workInterest = calculateWorkInterestScenario({
    financedValue,
    monthlyRate: workInterestMonthlyRate,
    months,
  });
  const incc = calculateInccScenario({
    financedValue,
    monthlyRate: inccMonthlyRate,
    months,
  });
  const comparison = compareConstructionScenarios({
    propertyValue,
    financedValue,
    downPayment,
    workInterestCost: workInterest.totalInterest,
    inccCost: incc.correctionAmount,
  });
  const sale = expectedSaleValue > 0
    ? calculateSaleExpectation({
      propertyValue,
      downPayment,
      expectedSaleValue,
      workInterestCost: workInterest.totalInterest,
      inccCost: incc.correctionAmount,
    })
    : null;

  return {
    input: {
      propertyValue,
      financedValue,
      downPayment,
      workInterestAnnualRate,
      inccAnnualRate,
      months,
      expectedSaleValue,
    },
    rates: {
      workInterestMonthlyRate,
      inccMonthlyRate,
    },
    workInterest,
    incc,
    comparison,
    sale,
  };
}

export function calculateWorkInterestScenario({ financedValue, monthlyRate, months }) {
  const rows = [];
  let totalInterest = 0;

  for (let month = 1; month <= months; month += 1) {
    // Without a physical-financial schedule, assume a linear bank release.
    // releasedBalance(m) = financedValue * (m / months)
    // constructionInterest(m) = releasedBalance(m) * monthlyRate
    const releasedPercent = months > 0 ? month / months : 0;
    const releasedBalance = financedValue * releasedPercent;
    const interest = releasedBalance * monthlyRate;
    totalInterest += interest;
    rows.push({
      month,
      releasedPercent,
      releasedBalance,
      interest,
      accumulatedInterest: totalInterest,
    });
  }

  return {
    rows,
    firstMonthInterest: rows[0]?.interest || 0,
    lastMonthInterest: rows.at(-1)?.interest || 0,
    totalInterest,
    periodCost: totalInterest,
    estimatedPostDeliveryInstallment: pmt(financedValue, monthlyRate, DEFAULT_POST_DELIVERY_MONTHS),
    postDeliveryMonths: DEFAULT_POST_DELIVERY_MONTHS,
  };
}

export function calculateInccScenario({ financedValue, monthlyRate, months }) {
  const rows = [];
  let updatedBalance = financedValue;

  for (let month = 1; month <= months; month += 1) {
    // Equivalent monthly INCC with compound update:
    // balance(m) = balance(m - 1) * (1 + monthlyRate)
    updatedBalance *= 1 + monthlyRate;
    rows.push({
      month,
      updatedBalance,
      correctionAmount: updatedBalance - financedValue,
    });
  }

  const correctionAmount = Math.max(0, updatedBalance - financedValue);
  return {
    rows,
    updatedBalance,
    correctionAmount,
    periodCost: correctionAmount,
  };
}

export function compareConstructionScenarios({ propertyValue, financedValue, downPayment, workInterestCost, inccCost }) {
  const difference = Math.abs(workInterestCost - inccCost);
  const bestScenario = workInterestCost <= inccCost ? "jurosObra" : "incc";
  return {
    propertyValue,
    financedValue,
    downPayment,
    workInterestCost,
    inccCost,
    difference,
    economy: difference,
    bestScenario,
  };
}

export function calculateSaleExpectation({ propertyValue, downPayment, expectedSaleValue, workInterestCost, inccCost }) {
  const workInterest = saleMetrics({ propertyValue, downPayment, expectedSaleValue, scenarioCost: workInterestCost });
  const incc = saleMetrics({ propertyValue, downPayment, expectedSaleValue, scenarioCost: inccCost });
  const roiDifference = workInterest.roi - incc.roi;
  return {
    workInterest,
    incc,
    roiDifference,
    bestScenario: workInterest.roi >= incc.roi ? "jurosObra" : "incc",
  };
}

function saleMetrics({ propertyValue, downPayment, expectedSaleValue, scenarioCost }) {
  // Leveraged ROI uses cash invested during construction as denominator.
  // netProfit = expected sale - original property value - scenario cost
  // ROI = netProfit / (down payment + scenario cost)
  const capitalInvested = downPayment + scenarioCost;
  const netProfit = expectedSaleValue - propertyValue - scenarioCost;
  const roi = capitalInvested > 0 ? netProfit / capitalInvested : 0;
  return { capitalInvested, netProfit, roi };
}
