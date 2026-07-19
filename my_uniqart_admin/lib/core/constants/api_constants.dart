class ApiConstants {
  static const String baseUrl = 'https://uniqart-production-c297.up.railway.app';
  static const String socketUrl = 'https://uniqart-production-c297.up.railway.app';
  
  static const String loginEndpoint = '/api/auth/login';
  static const String meEndpoint = '/api/auth/me';
  static const String logoutEndpoint = '/api/auth/logout';

  // Admin Dashboard & Vehicle Approval Endpoints
  static const String pendingVehiclesEndpoint = '/api/vehicles/admin/pending';
  static const String pendingFinanceOffersEndpoint = '/api/finance-offers/admin/pending';
  static const String adminLoanRequestsEndpoint = '/api/loan-requests/admin/pending'; // updated to use /pending
  static const String adminBookingsEndpoint = '/api/bookings/admin/pending';
  static const String adminUsersEndpoint = '/api/admin/users';

  static String vehicleDecisionEndpoint(String id) => '/api/vehicles/admin/$id/decision';
  static String financeOfferDecisionEndpoint(String id) => '/api/finance-offers/admin/$id/decision';
  static String loanRequestDecisionEndpoint(String id) => '/api/loan-requests/admin/$id/decision';
  static String bookingDecisionEndpoint(String id) => '/api/bookings/admin/$id/decision';

  // History endpoints
  static const String vehicleHistoryEndpoint = '/api/vehicles/admin/history';
  static const String financeOfferHistoryEndpoint = '/api/finance-offers/admin/history';
  static const String loanRequestHistoryEndpoint = '/api/loan-requests/admin/history';
  static const String bookingHistoryEndpoint = '/api/bookings/admin/history';
  
  static String userSuspendEndpoint(String id) => '/api/admin/users/$id/suspend';
  static String userDeleteEndpoint(String id) => '/api/admin/users/$id';
}
