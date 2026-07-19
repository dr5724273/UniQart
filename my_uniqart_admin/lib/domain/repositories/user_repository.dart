import '../entities/user_entity.dart';

abstract class UserRepository {
  Future<List<UserEntity>> getUsers({int page = 1, int limit = 50});
  Future<void> toggleSuspend(String userId, bool suspended);
  Future<void> deleteUser(String userId);
}
