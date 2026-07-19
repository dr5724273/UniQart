import '../entities/user_entity.dart';
import '../entities/user_audit_entity.dart';

abstract class UserRepository {
  Future<List<UserEntity>> getUsers({int page = 1, int limit = 50});
  Future<void> toggleSuspend(String userId, bool suspended);
  Future<void> deleteUser(String userId);
  Future<UserAuditResultEntity> getUserAudit(String userId);
}
