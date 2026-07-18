class ApiConstants {
  // Use 10.0.2.2 for Android emulator to connect to localhost:5000, or exact IP
  static const String baseUrl = 'http://10.0.2.2:5000';
  
  static const String loginEndpoint = '/api/auth/login';
  static const String meEndpoint = '/api/auth/me';
  static const String logoutEndpoint = '/api/auth/logout';
}
