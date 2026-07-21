import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../core/network/api_client.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../data/repositories/auth_repository_impl.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final AuthRepository _authRepository;

  AuthStatus _status = AuthStatus.initial;
  UserEntity? _user;
  String? _errorMessage;

  Timer? _inactivityTimer;
  Timer? _refreshTimer;
  DateTime _lastActivity = DateTime.now();

  AuthProvider({AuthRepository? authRepository})
      : _authRepository = authRepository ?? AuthRepositoryImpl() {
    ApiClient.onSessionExpired = handleSessionExpired;
  }

  AuthStatus get status => _status;
  UserEntity? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _status == AuthStatus.loading;

  void handleSessionExpired() {
    _stopSessionTimers();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  void userInteracted() {
    _lastActivity = DateTime.now();
  }

  void _startSessionTimers() {
    _stopSessionTimers();
    _lastActivity = DateTime.now();

    // Check inactivity every 30 seconds
    _inactivityTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (_status != AuthStatus.authenticated) return;
      final idleTime = DateTime.now().difference(_lastActivity);
      if (idleTime.inMinutes >= 5) {
        logout();
      }
    });

    // Refresh token every 4 minutes if active
    _refreshTimer = Timer.periodic(const Duration(minutes: 4), (timer) async {
      if (_status != AuthStatus.authenticated) return;
      final idleTime = DateTime.now().difference(_lastActivity);
      if (idleTime.inMinutes < 5) {
        try {
          await _authRepository.refreshToken();
        } catch (e) {
          debugPrint('Background refresh failed: $e');
          // Assuming 401 is handled by ApiClient interceptor which calls handleSessionExpired.
          // Other network errors are safely ignored here to not crash the app.
        }
      }
    });
  }

  void _stopSessionTimers() {
    _inactivityTimer?.cancel();
    _refreshTimer?.cancel();
  }

  @override
  void dispose() {
    _stopSessionTimers();
    super.dispose();
  }

  Future<void> checkAuthStatus() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      final currentUser = await _authRepository.getCurrentUser();
      if (currentUser != null && currentUser.isAdmin) {
        _user = currentUser;
        _status = AuthStatus.authenticated;
        _startSessionTimers();
      } else {
        _user = null;
        _status = AuthStatus.unauthenticated;
      }
    } catch (_) {
      _user = null;
      _status = AuthStatus.unauthenticated;
    } finally {
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final loggedInUser = await _authRepository.login(email, password);
      _user = loggedInUser;
      _status = AuthStatus.authenticated;
      _startSessionTimers();
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _status = AuthStatus.loading;
    notifyListeners();

    _stopSessionTimers();
    await _authRepository.logout();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
