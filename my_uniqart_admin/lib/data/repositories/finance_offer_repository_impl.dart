import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../domain/entities/finance_offer_entity.dart';
import '../../domain/repositories/finance_offer_repository.dart';
import '../models/finance_offer_model.dart';

class FinanceOfferRepositoryImpl implements FinanceOfferRepository {
  final ApiClient _apiClient;

  FinanceOfferRepositoryImpl({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  @override
  Future<List<FinanceOfferEntity>> getPendingOffers({int page = 1, int limit = 20}) async {
    try {
      final response = await _apiClient.dio.get(
        ApiConstants.pendingFinanceOffersEndpoint,
        queryParameters: {'page': page, 'limit': limit},
      );

      final data = response.data;
      if (data == null || data['items'] == null || data['items'] is! List) {
        return [];
      }

      return (data['items'] as List)
          .map((item) => FinanceOfferModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e));
    } catch (e) {
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<void> submitDecision(String offerId, String action, {String? adminNote, String? publicNote, double? overrideInterestRate, String? overrideTermsAndConditions}) async {
    try {
      final payload = <String, dynamic>{'action': action};
      if (adminNote != null && adminNote.trim().isNotEmpty) {
        payload['adminNote'] = adminNote.trim();
      }
      if (publicNote != null && publicNote.trim().isNotEmpty) {
        payload['publicNote'] = publicNote.trim();
      }
      if (action == 'approve') {
        if (overrideInterestRate != null) {
          payload['overrideInterestRate'] = overrideInterestRate;
        }
        if (overrideTermsAndConditions != null && overrideTermsAndConditions.isNotEmpty) {
          payload['overrideTermsAndConditions'] = overrideTermsAndConditions;
        }
      }

      await _apiClient.dio.post(
        ApiConstants.financeOfferDecisionEndpoint(offerId),
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
