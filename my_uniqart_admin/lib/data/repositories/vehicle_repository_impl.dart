import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../domain/entities/vehicle_entity.dart';
import '../../domain/repositories/vehicle_repository.dart';
import '../models/vehicle_model.dart';

class VehicleRepositoryImpl implements VehicleRepository {
  final ApiClient _apiClient;

  VehicleRepositoryImpl({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  @override
  Future<List<VehicleEntity>> getPendingVehicles({int page = 1, int limit = 20}) async {
    try {
      final response = await _apiClient.dio.get(
        ApiConstants.pendingVehiclesEndpoint,
        queryParameters: {'page': page, 'limit': limit},
      );

      final data = response.data;
      if (data == null || data['items'] == null || data['items'] is! List) {
        return [];
      }

      final list = (data['items'] as List)
          .map((item) => VehicleModel.fromJson(item as Map<String, dynamic>))
          .toList();

      return list;
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e));
    } catch (e) {
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<VehicleEntity> submitDecision(
    String vehicleId,
    String action, {
    String? adminNote,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiConstants.vehicleDecisionEndpoint(vehicleId),
        data: {
          'action': action,
          if (adminNote != null && adminNote.isNotEmpty) 'adminNote': adminNote,
        },
      );

      final data = response.data;
      if (data == null || data['item'] == null) {
        throw Exception('Invalid response received from server upon approval decision.');
      }

      return VehicleModel.fromJson(data['item'] as Map<String, dynamic>);
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
