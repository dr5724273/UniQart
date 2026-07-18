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
  Future<List<FinanceOfferEntity>> getPendingFinanceOffers({int page = 1, int limit = 20}) async {
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
  Future<FinanceOfferEntity> submitDecision(
    String offerId,
    String action, {
    String? adminNote,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiConstants.financeOfferDecisionEndpoint(offerId),
        data: {
          'action': action,
          if (adminNote != null && adminNote.isNotEmpty) 'adminNote': adminNote,
        },
      );

      final data = response.data;
      if (data == null || data['item'] == null) {
        throw Exception('Invalid response received from server upon finance decision.');
      }

      return FinanceOfferModel.fromJson(data['item'] as Map<String, dynamic>);
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
