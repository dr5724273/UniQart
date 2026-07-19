import 'package:flutter/foundation.dart';
import '../../domain/entities/user_audit_entity.dart';
import '../../domain/repositories/user_repository.dart';
import '../../data/repositories/user_repository_impl.dart';

class UserAuditProvider extends ChangeNotifier {
  final UserRepository _repository;

  UserAuditProvider({UserRepository? repository})
      : _repository = repository ?? UserRepositoryImpl();

  UserAuditResultEntity? _auditData;
  bool _isLoading = false;
  String? _errorMessage;

  UserAuditResultEntity? get auditData => _auditData;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchUserAudit(String userId) async {
    _isLoading = true;
    _errorMessage = null;
    _auditData = null; // reset stale data from previous user
    notifyListeners();

    try {
      _auditData = await _repository.getUserAudit(userId);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
