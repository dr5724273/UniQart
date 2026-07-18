class DashboardCounts {
  final int pendingVehicles;
  final int pendingFinanceOffers;
  final int pendingLoanRequests;

  const DashboardCounts({
    required this.pendingVehicles,
    required this.pendingFinanceOffers,
    required this.pendingLoanRequests,
  });

  const DashboardCounts.initial()
      : pendingVehicles = 0,
        pendingFinanceOffers = 0,
        pendingLoanRequests = 0;
}

abstract class DashboardRepository {
  Future<DashboardCounts> getPendingCounts();
}
