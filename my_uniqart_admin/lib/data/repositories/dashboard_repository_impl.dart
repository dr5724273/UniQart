import 'dart:async';
import 'package:flutter/foundation.dart';
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
      debugPrint('--- Dashboard API Requests ---');
      debugPrint('GET URL 1: ${ApiConstants.baseUrl}${ApiConstants.pendingVehiclesEndpoint}');
      debugPrint('GET URL 2: ${ApiConstants.baseUrl}${ApiConstants.pendingFinanceOffersEndpoint}');
      debugPrint('GET URL 3: ${ApiConstants.baseUrl}${ApiConstants.adminLoanRequestsEndpoint}');

      final results = await Future.wait([
        _apiClient.dio
            .get(ApiConstants.pendingVehiclesEndpoint, queryParameters: {'limit': 1})
            .timeout(const Duration(seconds: 12)),
        _apiClient.dio
            .get(ApiConstants.pendingFinanceOffersEndpoint, queryParameters: {'limit': 1})
            .timeout(const Duration(seconds: 12)),
        _apiClient.dio
            .get(ApiConstants.adminLoanRequestsEndpoint, queryParameters: {'limit': 100})
            .timeout(const Duration(seconds: 12)),
      ], eagerError: true).timeout(const Duration(seconds: 15));

      debugPrint('HTTP Status 1 (Vehicles): ${results[0].statusCode}');
      debugPrint('HTTP Status 2 (Finance): ${results[1].statusCode}');
      debugPrint('HTTP Status 3 (Loans): ${results[2].statusCode}');
      debugPrint('Response Body 1: ${results[0].data}');
      debugPrint('Response Body 2: ${results[1].data}');
      debugPrint('Response Body 3: ${results[2].data}');

      int pendingVehicles = _extractTotal(results[0].data);
      int pendingFinanceOffers = _extractTotal(results[1].data);
      int pendingLoanRequests = 0;

      final loansData = results[2].data;
      if (loansData != null && loansData['items'] is List) {
        final list = loansData['items'] as List;
        pendingLoanRequests = list.where((item) {
          if (item is Map) {
            return (item['status'] ?? '') == 'pending';
          }
          return false;
        }).length;
      }

      return DashboardCounts(
        pendingVehicles: pendingVehicles,
        pendingFinanceOffers: pendingFinanceOffers,
        pendingLoanRequests: pendingLoanRequests,
      );
    } on TimeoutException catch (_) {
      throw Exception('Dashboard request timed out while contacting the server.');
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e));
    } catch (e) {
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  int _extractTotal(dynamic data) {
    if (data != null && data is Map && data['pagination'] is Map) {
      return (data['pagination']['total'] as num?)?.toInt() ?? 0;
    }
    if (data != null && data is Map && data['items'] is List) {
      return (data['items'] as List).length;
    }
    return 0;
  }

  String _extractErrorMessage(DioException e) {
    if (e.response?.data != null && e.response?.data is Map) {
      final map = e.response?.data as Map;
      if (map['message'] != null) return map['message'].toString();
      if (map['error'] != null) return map['error'].toString();
    }
    return e.message ?? 'Failed to load dashboard counts.';
  }
}
