import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../domain/entities/loan_request_entity.dart';
import '../../domain/repositories/loan_request_repository.dart';
import '../models/loan_request_model.dart';

class LoanRequestRepositoryImpl implements LoanRequestRepository {
  final ApiClient _apiClient;

  LoanRequestRepositoryImpl({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  @override
  Future<List<LoanRequestEntity>> getPendingLoanRequests({int page = 1, int limit = 50}) async {
    try {
      final response = await _apiClient.dio.get(
        ApiConstants.adminLoanRequestsEndpoint,
        queryParameters: {'page': page, 'limit': limit},
      );

      final data = response.data;
      if (data == null || data['items'] == null || data['items'] is! List) {
        return [];
      }

      return (data['items'] as List)
          .map((item) => LoanRequestModel.fromJson(item as Map<String, dynamic>))
          .where((item) => item.status == 'pending')
          .toList();
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e));
    } catch (e) {
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<LoanRequestEntity> submitDecision(
    String loanId,
    String action, {
    String? internalNotes,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiConstants.loanRequestDecisionEndpoint(loanId),
        data: {
          'action': action,
          if (internalNotes != null && internalNotes.isNotEmpty) 'internalNotes': internalNotes,
        },
      );

      final data = response.data;
      if (data == null || data['item'] == null) {
        throw Exception('Invalid response received from server upon loan decision.');
      }

      return LoanRequestModel.fromJson(data['item'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e));
    } catch (e) {
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  String _extractErrorMessage(DioException e) {
    if (e.response?.data != null && e.response?.data is Map) {
      final map = e.response?.data as Map;
      if (map['message'] != null) return map['message'].toString();
      if (map['error'] != null) return map['error'].toString();
    }
    return e.message ?? 'Failed to communicate with server.';
  }
}
