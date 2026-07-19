import '../entities/vehicle_entity.dart';

abstract class VehicleRepository {
  Future<List<VehicleEntity>> getPendingVehicles();
  Future<void> submitDecision(String vehicleId, String action, {String? adminNote, String? publicNote});
}
