import { clampMoney } from "./helpers.js";

export function calculateSac({
  principal,
  monthlyRate,
  months,
  manualMap = new Map(),
  fgtsMap = new Map(),
  amortizationGoal = "prazo",
}) {
  const rows = [];
  let balance = principal;
  const originalAmortization = months > 0 ? principal / months : 0;

  for (let month = 1; month <= months && balance > 0.01; month += 1) {
    const remainingIncludingCurrent = months - month + 1;
    const scheduledAmortization = amortizationGoal === "parcela"
      ? balance / remainingIncludingCurrent
      : originalAmortization;
    const fixedAmortization = Math.min(scheduledAmortization, balance);
    const openingBalance = balance;
    const interest = openingBalance * monthlyRate;
    const installment = fixedAmortization + interest;
    const closingBalance = clampMoney(openingBalance - fixedAmortization);
    const manualContribution = clampMoney(manualMap.get(month) || 0);
    const fgtsContribution = clampMoney(fgtsMap.get(month) || 0);
    const correctedBalance = clampMoney(closingBalance - manualContribution - fgtsContribution);
    const correctedInterest = correctedBalance * monthlyRate;
    const correctedAmortization = amortizationGoal === "parcela" && remainingIncludingCurrent > 1
      ? correctedBalance / (remainingIncludingCurrent - 1)
      : Math.min(originalAmortization, correctedBalance);
    const correctedPayment = correctedBalance > 0 ? correctedAmortization + correctedInterest : 0;

    rows.push({
      month,
      remaining: months - month,
      openingBalance,
      interest,
      balanceWithInterest: openingBalance + interest,
      amortization: fixedAmortization,
      installment,
      closingBalance,
      manualContribution,
      fgtsContribution,
      correctedBalance,
      correctedInterest,
      correctedPayment,
      newBalance: correctedBalance,
    });

    balance = correctedBalance;
  }

  return rows;
}
