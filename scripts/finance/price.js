import { clampMoney, pmt } from "./helpers.js";

export function calculatePrice({
  principal,
  monthlyRate,
  months,
  manualMap = new Map(),
  fgtsMap = new Map(),
  amortizationGoal = "prazo",
}) {
  const rows = [];
  let balance = principal;
  let payment = pmt(principal, monthlyRate, months);
  const originalPayment = payment;

  for (let month = 1; month <= months && balance > 0.01; month += 1) {
    const openingBalance = balance;
    const interest = openingBalance * monthlyRate;
    const amortization = Math.min(payment - interest, openingBalance);
    const installment = amortization + interest;
    const closingBalance = clampMoney(openingBalance - amortization);
    const manualContribution = clampMoney(manualMap.get(month) || 0);
    const fgtsContribution = clampMoney(fgtsMap.get(month) || 0);
    const correctedBalance = clampMoney(closingBalance - manualContribution - fgtsContribution);
    const correctedInterest = correctedBalance * monthlyRate;
    const remaining = Math.max(0, months - month);
    const correctedPayment = correctedBalance > 0 && remaining > 0
      ? nextPricePayment({ correctedBalance, monthlyRate, remaining, amortizationGoal, originalPayment })
      : 0;

    rows.push({
      month,
      remaining: months - month,
      openingBalance,
      interest,
      balanceWithInterest: openingBalance + interest,
      amortization,
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
    payment = correctedPayment || payment;
  }

  return rows;
}

function nextPricePayment({ correctedBalance, monthlyRate, remaining, amortizationGoal, originalPayment }) {
  if (amortizationGoal === "parcela") {
    return pmt(correctedBalance, monthlyRate, remaining);
  }
  if (monthlyRate === 0) {
    return Math.min(originalPayment, correctedBalance);
  }
  const interest = correctedBalance * monthlyRate;
  return interest >= originalPayment ? pmt(correctedBalance, monthlyRate, remaining) : originalPayment;
}
