class ApiConstants {
  // Use 10.0.2.2 for Android emulator to connect to localhost:5000, or exact IP
  static const String baseUrl = 'http://10.0.2.2:5000';
  
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
