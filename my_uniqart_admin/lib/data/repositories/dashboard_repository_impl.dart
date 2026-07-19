import 'dart:async';
import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../domain/repositories/dashboard_repository.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  final ApiClient _apiClient;

  DashboardRepositoryImpl({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  @override
  Future<DashboardCounts> getPendingCounts() async {
    try {
      final results = await Future.wait([
        _apiClient.dio.get(ApiConstants.pendingVehiclesEndpoint),
        _apiClient.dio.get(ApiConstants.pendingFinanceOffersEndpoint),
        _apiClient.dio.get(ApiConstants.adminLoanRequestsEndpoint),
        _apiClient.dio.get(ApiConstants.adminBookingsEndpoint),
      ], eagerError: true).timeout(const Duration(seconds: 15));

      int parseTotal(Response res) {
        final data = res.data;
        if (data is Map<String, dynamic> && data.containsKey('total')) {
          return (data['total'] as num).toInt();
        }
        if (data is Map<String, dynamic> && data.containsKey('pagination')) {
          final pagination = data['pagination'];
          if (pagination is Map<String, dynamic> && pagination.containsKey('total')) {
            return (pagination['total'] as num).toInt();
          }
        }
        return 0;
      }

      return DashboardCounts(
        pendingVehicles: parseTotal(results[0]),
        pendingFinanceOffers: parseTotal(results[1]),
        pendingLoanRequests: parseTotal(results[2]),
        pendingBookings: parseTotal(results[3]),
      );
    } catch (e) {
      throw Exception('Failed to fetch dashboard counts: $e');
    }
  }
}
