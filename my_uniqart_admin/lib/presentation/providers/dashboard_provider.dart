import 'package:flutter/foundation.dart';
import '../../domain/repositories/dashboard_repository.dart';
import '../../data/repositories/dashboard_repository_impl.dart';

class DashboardProvider extends ChangeNotifier {
  final DashboardRepository _repository;

  DashboardCounts _counts = const DashboardCounts.initial();
  bool _isLoading = false;
  String? _errorMessage;

  DashboardProvider({DashboardRepository? repository})
      : _repository = repository ?? DashboardRepositoryImpl();

  DashboardCounts get counts => _counts;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchCounts() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _counts = await _repository.getPendingCounts();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
