class ApiConstants {
  static const String baseUrl = 'https://uniqart-production-c297.up.railway.app';
  static const String socketUrl = 'https://uniqart-production-c297.up.railway.app';
  
  static const String loginEndpoint = '/api/auth/login';
  static const String meEndpoint = '/api/auth/me';
  static const String logoutEndpoint = '/api/auth/logout';

  // Admin Dashboard & Vehicle Approval Endpoints
  static const String pendingVehiclesEndpoint = '/api/vehicles/admin/pending';
  static const String pendingFinanceOffersEndpoint = '/api/finance-offers/admin/pending';
  static const String adminLoanRequestsEndpoint = '/api/loan-requests/admin';
  static String vehicleDecisionEndpoint(String id) => '/api/vehicles/admin/$id/decision';
  static String financeOfferDecisionEndpoint(String id) => '/api/finance-offers/admin/$id/decision';
  static String loanRequestDecisionEndpoint(String id) => '/api/loan-requests/admin/$id/decision';
}
