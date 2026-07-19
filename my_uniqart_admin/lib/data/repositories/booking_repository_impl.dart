import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../domain/entities/booking_entity.dart';
import '../../domain/repositories/booking_repository.dart';
import '../models/booking_model.dart';

class BookingRepositoryImpl implements BookingRepository {
  final ApiClient _apiClient;

  BookingRepositoryImpl({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  @override
  Future<List<BookingEntity>> getPendingBookings({int page = 1, int limit = 50}) async {
    try {
      final response = await _apiClient.dio.get(
        ApiConstants.adminBookingsEndpoint,
        queryParameters: {'page': page, 'limit': limit},
      );

      final data = response.data;
      if (data == null || data['items'] == null || data['items'] is! List) {
        return [];
      }

      return (data['items'] as List)
          .map((item) => BookingModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e));
    } catch (e) {
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<void> submitDecision(String bookingId, String action, {String? adminNote, String? publicNote}) async {
    try {
      final payload = <String, dynamic>{'action': action};
      if (adminNote != null && adminNote.trim().isNotEmpty) {
        payload['adminNote'] = adminNote.trim();
      }
      if (publicNote != null && publicNote.trim().isNotEmpty) {
        payload['publicNote'] = publicNote.trim();
      }

      await _apiClient.dio.post(
        ApiConstants.bookingDecisionEndpoint(bookingId),
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
