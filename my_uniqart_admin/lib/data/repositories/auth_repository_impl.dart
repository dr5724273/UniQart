import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/token_storage.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;
  final TokenStorage _tokenStorage;

  AuthRepositoryImpl({ApiClient? apiClient, TokenStorage? tokenStorage})
      : _apiClient = apiClient ?? ApiClient(),
        _tokenStorage = tokenStorage ?? TokenStorage();

  @override
  Future<UserEntity> login(String email, String password) async {
    try {
      final response = await _apiClient.dio.post(
        ApiConstants.loginEndpoint,
        data: {'email': email, 'password': password},
      );

      final data = response.data;
      if (data == null || data['user'] == null) {
        throw Exception('Invalid login response from server.');
      }

      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      if (user.role != 'admin') {
        throw Exception('Unauthorized: Only Admin accounts can access this app.');
      }

      final token = (data['token'] ?? '').toString();
      if (token.isNotEmpty) {
        await _tokenStorage.saveToken(token);
      }

      return user;
    } on DioException catch (e) {
      final message = _extractErrorMessage(e);
      throw Exception(message);
    } catch (e) {
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  @override
  Future<UserEntity?> getCurrentUser() async {
    try {
      final token = await _tokenStorage.getToken();
      if (token == null || token.isEmpty) return null;

      final response = await _apiClient.dio.get(ApiConstants.meEndpoint);
      final data = response.data;
      if (data != null && data['user'] != null) {
        final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
        if (user.role == 'admin') {
          return user;
        }
      }
      await _tokenStorage.clearToken();
      return null;
    } catch (_) {
      await _tokenStorage.clearToken();
      return null;
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _apiClient.dio.post(ApiConstants.logoutEndpoint);
    } catch (_) {
      // ignore errors on server logout attempt
    } finally {
      await _tokenStorage.clearToken();
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await _tokenStorage.getToken();
    return token != null && token.isNotEmpty;
  }

  String _extractErrorMessage(DioException e) {
    if (e.response?.data != null && e.response?.data is Map) {
      final map = e.response?.data as Map;
      if (map['message'] != null) {
        return map['message'].toString();
      }
      if (map['error'] != null) {
        return map['error'].toString();
      }
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Connection timed out. Please check your network and try again.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Could not connect to the server. Please verify your backend API URL (${ApiConstants.baseUrl}).';
    }
    return e.message ?? 'An unexpected error occurred.';
  }
}
