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
  Future<List<LoanRequestEntity>> getPendingRequests({int page = 1, int limit = 50}) async {
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
  Future<void> submitDecision(String requestId, String action, {String? adminNote, String? publicNote}) async {
    try {
      final payload = <String, dynamic>{'action': action};
      if (adminNote != null && adminNote.trim().isNotEmpty) {
        payload['adminNote'] = adminNote.trim();
      }
      if (publicNote != null && publicNote.trim().isNotEmpty) {
        payload['publicNote'] = publicNote.trim();
      }

      await _apiClient.dio.post(
        ApiConstants.loanRequestDecisionEndpoint(requestId),
        data: payload,
      );
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
