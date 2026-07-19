import 'package:flutter/foundation.dart';
import '../../domain/entities/loan_request_entity.dart';
import '../../domain/repositories/loan_request_repository.dart';
import '../../data/repositories/loan_request_repository_impl.dart';

class LoanRequestProvider extends ChangeNotifier {
  final LoanRequestRepository _repository;

  List<LoanRequestEntity> _pendingLoans = [];
  bool _isLoading = false;
  String? _errorMessage;

  LoanRequestProvider({LoanRequestRepository? repository})
      : _repository = repository ?? LoanRequestRepositoryImpl();

  List<LoanRequestEntity> get pendingLoans => _pendingLoans;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchPendingLoans() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _pendingLoans = await _repository.getPendingRequests();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitDecision(String requestId, String action, {String? adminNote, String? publicNote}) async {
    try {
      await _repository.submitDecision(requestId, action, adminNote: adminNote, publicNote: publicNote);
      _pendingLoans.removeWhere((r) => r.id == requestId);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }
}
