import 'package:flutter/foundation.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/user_repository.dart';
import '../../data/repositories/user_repository_impl.dart';

class UserProvider extends ChangeNotifier {
  final UserRepository _repository;

  List<UserEntity> _users = [];
  bool _isLoading = false;
  String? _errorMessage;

  UserProvider({UserRepository? repository})
      : _repository = repository ?? UserRepositoryImpl();

  List<UserEntity> get users => _users;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchUsers() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _users = await _repository.getUsers();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> toggleSuspend(String userId, bool currentSuspended) async {
    try {
      await _repository.toggleSuspend(userId, !currentSuspended);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteUser(String userId) async {
    try {
      await _repository.deleteUser(userId);
      _users.removeWhere((u) => u.id == userId);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }
}
