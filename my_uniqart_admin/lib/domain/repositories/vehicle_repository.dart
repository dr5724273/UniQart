import '../entities/vehicle_entity.dart';

abstract class VehicleRepository {
  Future<List<VehicleEntity>> getPendingVehicles({int page = 1, int limit = 20});
  Future<VehicleEntity> submitDecision(String vehicleId, String action, {String? adminNote});
}
