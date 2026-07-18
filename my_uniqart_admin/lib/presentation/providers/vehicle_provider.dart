import 'package:flutter/foundation.dart';
import '../../domain/entities/vehicle_entity.dart';
import '../../domain/repositories/vehicle_repository.dart';
import '../../data/repositories/vehicle_repository_impl.dart';

class VehicleProvider extends ChangeNotifier {
  final VehicleRepository _repository;

  List<VehicleEntity> _pendingVehicles = [];
  bool _isLoading = false;
  String? _errorMessage;

  VehicleProvider({VehicleRepository? repository})
      : _repository = repository ?? VehicleRepositoryImpl();

  List<VehicleEntity> get pendingVehicles => _pendingVehicles;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchPendingVehicles() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _pendingVehicles = await _repository.getPendingVehicles();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitDecision(String vehicleId, String action, {String? adminNote}) async {
    try {
      await _repository.submitDecision(vehicleId, action, adminNote: adminNote);
      _pendingVehicles.removeWhere((v) => v.id == vehicleId);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }
}
