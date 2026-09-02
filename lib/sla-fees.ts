export function perEmployeeCost(monthlyFee: number, employeeCount: number): number {
  if (!Number.isFinite(monthlyFee) || !Number.isFinite(employeeCount) || employeeCount <= 0) {
    return 0;
  }
  return monthlyFee / employeeCount;
}

export function trackingTotal(
  employeeCount: number,
  trackingFeePerEmployee?: number,
): number {
  if (
    !Number.isFinite(employeeCount) ||
    employeeCount <= 0 ||
    trackingFeePerEmployee === undefined ||
    !Number.isFinite(trackingFeePerEmployee)
  ) {
    return 0;
  }
  return employeeCount * trackingFeePerEmployee;
}

export function netPrice({
  monthlyFee,
  oneTimeFee,
  employeeCount,
  trackingFeePerEmployee,
}: {
  monthlyFee: number;
  oneTimeFee: number;
  employeeCount: number;
  trackingFeePerEmployee?: number;
}): number {
  return monthlyFee + oneTimeFee + trackingTotal(employeeCount, trackingFeePerEmployee);
}

export function formatBdt(amount: number): string {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)} BDT`;
}
