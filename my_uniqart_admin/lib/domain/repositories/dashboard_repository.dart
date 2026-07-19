class DashboardCounts {
  final int pendingVehicles;
  final int pendingFinanceOffers;
  final int pendingLoanRequests;
  final int pendingBookings;

  const DashboardCounts({
    required this.pendingVehicles,
    required this.pendingFinanceOffers,
    required this.pendingLoanRequests,
    required this.pendingBookings,
  });

  const DashboardCounts.initial()
      : pendingVehicles = 0,
        pendingFinanceOffers = 0,
        pendingLoanRequests = 0,
        pendingBookings = 0;
}

abstract class DashboardRepository {
  Future<DashboardCounts> getPendingCounts();
}
